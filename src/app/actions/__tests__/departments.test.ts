import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createDepartment, updateDepartment, deleteDepartment, getDepartments } from '../departments';
import * as authModule from '@/lib/auth';

// Mock modules
vi.mock('@/lib/auth');
vi.mock('@/lib/prisma', () => ({
  prisma: {
    department: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    product: {
      count: vi.fn(),
    },
  },
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

import { prisma } from '@/lib/prisma';

const mockRequireRole = authModule.requireRole as any;

describe('Departments Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireRole.mockResolvedValue(undefined);
  });

  describe('getDepartments', () => {
    it('should fetch departments with hierarchy and product counts', async () => {
      const mockDepts = [
        {
          id: '1',
          name: 'General',
          icon: 'Folder',
          color: '#3b82f6',
          parentId: null,
          children: [],
          _count: { products: 5 },
        },
        {
          id: '2',
          name: 'Eléctrico',
          icon: 'Zap',
          color: '#f59e0b',
          parentId: null,
          children: [
            {
              id: '3',
              name: 'Cables',
              icon: 'Zap',
              color: '#f59e0b',
              parentId: '2',
              children: [],
              _count: { products: 3 },
            },
          ],
          _count: { products: 2 },
        },
      ];

      (prisma.department.findMany as any).mockResolvedValue(mockDepts);

      const result = await getDepartments();

      expect(result.success).toBe(true);
      expect(result.departments).toEqual(mockDepts);
      expect(prisma.department.findMany).toHaveBeenCalledWith({
        include: {
          children: true,
          _count: { select: { products: true } },
        },
        orderBy: { name: 'asc' },
      });
    });
  });

  describe('createDepartment', () => {
    it('should create a valid department', async () => {
      const data = {
        name: 'Nueva Sección',
        icon: 'Folder',
        color: '#3b82f6',
      };

      const mockDept = {
        id: '1',
        ...data,
        parentId: null,
        _count: { products: 0 },
      };

      (prisma.department.create as any).mockResolvedValue(mockDept);

      const result = await createDepartment(data);

      expect(result.success).toBe(true);
      expect(result.department).toEqual(mockDept);
    });

    it('should reject invalid color format', async () => {
      const data = {
        name: 'Nueva Sección',
        icon: 'Folder',
        color: 'invalid-color',
      };

      const result = await createDepartment(data);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Color');
    });

    it('should reject invalid icon', async () => {
      const data = {
        name: 'Nueva Sección',
        icon: 'InvalidIcon',
        color: '#3b82f6',
      };

      const result = await createDepartment(data);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Icon');
    });

    it('should reject subdepartment of subdepartment (max depth 1)', async () => {
      const parentDept = {
        id: 'parent-2',
        parentId: 'parent-1', // Parent ya es subdepartamento
      };

      (prisma.department.findUnique as any).mockResolvedValue(parentDept);

      const data = {
        name: 'Too Deep',
        icon: 'Folder',
        color: '#3b82f6',
        parentId: 'parent-2',
      };

      const result = await createDepartment(data);

      expect(result.success).toBe(false);
      expect(result.error).toContain('no pueden tener más niveles');
    });

    it('should reject duplicate department name', async () => {
      const data = {
        name: 'Duplicado',
        icon: 'Folder',
        color: '#3b82f6',
      };

      const error = new Error('Unique constraint failed');
      (error as any).code = 'P2002';

      (prisma.department.create as any).mockRejectedValue(error);

      const result = await createDepartment(data);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Ya existe');
    });
  });

  describe('updateDepartment', () => {
    it('should update department with valid data', async () => {
      const id = '1';
      const data = {
        name: 'Nombre Actualizado',
        icon: 'Wind',
        color: '#06b6d4',
      };

      const mockDept = {
        id,
        ...data,
        parentId: null,
        _count: { products: 0 },
      };

      (prisma.department.update as any).mockResolvedValue(mockDept);

      const result = await updateDepartment(id, data);

      expect(result.success).toBe(true);
      expect(result.department).toEqual(mockDept);
    });

    it('should reject invalid color on update', async () => {
      const result = await updateDepartment('1', { color: 'bad' });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Color');
    });
  });

  describe('deleteDepartment', () => {
    it('should delete department with no subdepartments or products', async () => {
      const id = '1';

      (prisma.department.findUnique as any).mockResolvedValue({
        id,
        children: [],
        _count: { products: 0 },
      });

      (prisma.department.delete as any).mockResolvedValue({ id });

      const result = await deleteDepartment(id);

      expect(result.success).toBe(true);
    });

    it('should reject deletion if has subdepartments', async () => {
      const id = '1';

      (prisma.department.findUnique as any).mockResolvedValue({
        id,
        children: [{ id: 'child-1' }],
        _count: { products: 0 },
      });

      const result = await deleteDepartment(id);

      expect(result.success).toBe(false);
      expect(result.error).toContain('subdepartamentos');
    });

    it('should reject deletion if has products', async () => {
      const id = '1';

      (prisma.department.findUnique as any).mockResolvedValue({
        id,
        children: [],
        _count: { products: 3 },
      });

      const result = await deleteDepartment(id);

      expect(result.success).toBe(false);
      expect(result.error).toContain('3 producto');
    });

    it('should handle non-existent department', async () => {
      (prisma.department.findUnique as any).mockResolvedValue(null);

      const result = await deleteDepartment('non-existent');

      expect(result.success).toBe(false);
      expect(result.error).toContain('no encontrado');
    });
  });
});
