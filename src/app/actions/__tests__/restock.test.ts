import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getRestockOrders,
  generateAutoRestock,
  updateRestockOrderStatus,
  receiveRestockOrder,
  deleteRestockOrder,
  updateRestockOrderItem,
  removeRestockOrderItem,
} from '../restock';
import * as authModule from '@/lib/auth';

// Mock modules
vi.mock('@/lib/auth');
vi.mock('@/lib/prisma', () => ({
  prisma: {
    restockOrder: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    restockOrderItem: {
      update: vi.fn(),
      delete: vi.fn(),
    },
    product: {
      findMany: vi.fn(),
      update: vi.fn(),
      fields: { minStock: {} }, // Mock para la consulta en generateAutoRestock
    },
    inventory: {
      create: vi.fn(),
    },
    $transaction: vi.fn((callback: any) => callback({
      restockOrder: { update: vi.fn(), create: vi.fn() },
      product: { update: vi.fn() },
      inventory: { create: vi.fn() },
    })),
  },
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

import { prisma } from '@/lib/prisma';

const mockRequireRole = authModule.requireRole as any;
const mockGetCurrentUser = authModule.getCurrentUser as any;

describe('Restock Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireRole.mockResolvedValue(undefined);
    mockGetCurrentUser.mockResolvedValue({ id: 'user-1', email: 'user@test.com' });
  });

  describe('getRestockOrders', () => {
    it('should fetch all restock orders with items', async () => {
      const mockOrders = [
        {
          id: 'order-1',
          status: 'BORRADOR',
          createdBy: 'user-1',
          user: { email: 'admin@test.com' },
          items: [
            {
              id: 'item-1',
              productId: 'prod-1',
              quantity: 10,
              unitCost: 100,
              product: { name: 'Producto 1', sku: 'SKU-1', stock: 2, minStock: 5, cost: 100 },
            },
          ],
          createdAt: new Date(),
        },
      ];

      (prisma.restockOrder.findMany as any).mockResolvedValue(mockOrders);

      const result = await getRestockOrders();

      expect(result).toEqual(mockOrders);
      expect(mockRequireRole).toHaveBeenCalledWith(['ADMIN', 'GERENTE']);
    });
  });

  describe('generateAutoRestock', () => {
    it('should generate restock order for low stock products', async () => {
      const lowStockProducts = [
        {
          id: 'prod-1',
          name: 'Producto Bajo',
          stock: 1,
          minStock: 5,
          cost: 50,
        },
        {
          id: 'prod-2',
          name: 'Producto Crítico',
          stock: 0,
          minStock: 10,
          cost: 100,
        },
      ];

      const mockOrder = {
        id: 'order-1',
        createdBy: 'user-1',
        status: 'BORRADOR',
        items: [
          { productId: 'prod-1', quantity: 9, unitCost: 50 },
          { productId: 'prod-2', quantity: 20, unitCost: 100 },
        ],
      };

      (prisma.product.findMany as any).mockResolvedValue(lowStockProducts);
      (prisma.restockOrder.create as any).mockResolvedValue(mockOrder);

      const result = await generateAutoRestock();

      expect(result.success).toBe(true);
      expect(result.orderId).toBe('order-1');
    });

    it('should return error if no low stock products', async () => {
      (prisma.product.findMany as any).mockResolvedValue([]);

      const result = await generateAutoRestock();

      expect(result.success).toBe(false);
      expect(result.error).toContain('No hay productos');
    });
  });

  describe('updateRestockOrderStatus', () => {
    it('should update order status', async () => {
      (prisma.restockOrder.update as any).mockResolvedValue({
        id: 'order-1',
        status: 'EN_TRANSITO',
      });

      const result = await updateRestockOrderStatus('order-1', 'EN_TRANSITO');

      expect(result.success).toBe(true);
      expect(prisma.restockOrder.update).toHaveBeenCalledWith({
        where: { id: 'order-1' },
        data: { status: 'EN_TRANSITO' },
      });
    });
  });

  describe('receiveRestockOrder', () => {
    it('should mark order as received and increment stock', async () => {
      const mockOrder = {
        id: 'order-1',
        status: 'EN_TRANSITO',
        items: [
          { id: 'item-1', productId: 'prod-1', quantity: 5 },
          { id: 'item-2', productId: 'prod-2', quantity: 10 },
        ],
      };

      (prisma.restockOrder.findUnique as any).mockResolvedValue(mockOrder);

      const result = await receiveRestockOrder('order-1');

      expect(result.success).toBe(true);
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('should reject if order not found', async () => {
      (prisma.restockOrder.findUnique as any).mockResolvedValue(null);

      const result = await receiveRestockOrder('non-existent');

      expect(result.success).toBe(false);
      expect(result.error).toContain('no encontrada');
    });

    it('should reject if order already received', async () => {
      const mockOrder = {
        id: 'order-1',
        status: 'RECIBIDA',
        items: [],
      };

      (prisma.restockOrder.findUnique as any).mockResolvedValue(mockOrder);

      const result = await receiveRestockOrder('order-1');

      expect(result.success).toBe(false);
      expect(result.error).toContain('ya fue recibida');
    });
  });

  describe('deleteRestockOrder', () => {
    it('should delete draft order', async () => {
      (prisma.restockOrder.findUnique as any).mockResolvedValue({
        id: 'order-1',
        status: 'BORRADOR',
      });

      (prisma.restockOrder.delete as any).mockResolvedValue({ id: 'order-1' });

      const result = await deleteRestockOrder('order-1');

      expect(result.success).toBe(true);
    });

    it('should reject deletion of received order', async () => {
      (prisma.restockOrder.findUnique as any).mockResolvedValue({
        id: 'order-1',
        status: 'RECIBIDA',
      });

      const result = await deleteRestockOrder('order-1');

      expect(result.success).toBe(false);
      expect(result.error).toContain('ya recibida');
    });
  });

  describe('updateRestockOrderItem', () => {
    it('should update item quantity', async () => {
      (prisma.restockOrderItem.update as any).mockResolvedValue({
        id: 'item-1',
        quantity: 15,
      });

      const result = await updateRestockOrderItem('item-1', 15);

      expect(result.success).toBe(true);
      expect(prisma.restockOrderItem.update).toHaveBeenCalledWith({
        where: { id: 'item-1' },
        data: { quantity: 15 },
      });
    });
  });

  describe('removeRestockOrderItem', () => {
    it('should delete restock item', async () => {
      (prisma.restockOrderItem.delete as any).mockResolvedValue({ id: 'item-1' });

      const result = await removeRestockOrderItem('item-1');

      expect(result.success).toBe(true);
      expect(prisma.restockOrderItem.delete).toHaveBeenCalledWith({
        where: { id: 'item-1' },
      });
    });
  });
});
