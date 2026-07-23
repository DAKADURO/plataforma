import { describe, it, expect, vi, beforeEach } from 'vitest'

const requireRole = vi.fn()
const transaction = vi.fn()
const productDelete = vi.fn()
const inventoryCreate = vi.fn()
const productUpdate = vi.fn()

vi.mock('@/lib/auth', () => ({ requireRole }))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: transaction,
    product: { delete: productDelete },
    inventory: { create: inventoryCreate },
  },
}))

const { createMovement, deleteProduct } = await import('./almacen')

describe('createMovement', () => {
  beforeEach(() => {
    requireRole.mockReset()
    transaction.mockReset()
    inventoryCreate.mockReset()
    productUpdate.mockReset()
  })

  it('requires an active role before touching the database', async () => {
    requireRole.mockRejectedValue(new Error('No tienes permisos suficientes para realizar esta acción.'))

    const result = await createMovement({ productId: 'p1', quantity: 5, type: 'ENTRADA' })

    expect(requireRole).toHaveBeenCalledWith(['ADMIN', 'GERENTE', 'TECNICO'])
    expect(transaction).not.toHaveBeenCalled()
    expect(result).toEqual({ success: false, error: 'No tienes permisos suficientes para realizar esta acción.' })
  })

  it('increments stock on ENTRADA', async () => {
    requireRole.mockResolvedValue('TECNICO')
    transaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) =>
      fn({ inventory: { create: inventoryCreate }, product: { update: productUpdate } })
    )

    const result = await createMovement({ productId: 'p1', quantity: 5, type: 'ENTRADA' })

    expect(productUpdate).toHaveBeenCalledWith({
      where: { id: 'p1' },
      data: { stock: { increment: 5 } },
    })
    expect(result).toEqual({ success: true })
  })

  it('decrements stock on SALIDA', async () => {
    requireRole.mockResolvedValue('TECNICO')
    transaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) =>
      fn({ inventory: { create: inventoryCreate }, product: { update: productUpdate } })
    )

    await createMovement({ productId: 'p1', quantity: 3, type: 'SALIDA' })

    expect(productUpdate).toHaveBeenCalledWith({
      where: { id: 'p1' },
      data: { stock: { increment: -3 } },
    })
  })

  it('sanitizes unexpected/internal errors instead of leaking them', async () => {
    requireRole.mockResolvedValue('TECNICO')
    transaction.mockRejectedValue(new Error('duplicate key value violates unique constraint'))

    const result = await createMovement({ productId: 'p1', quantity: 1, type: 'ENTRADA' })

    expect(result).toEqual({ success: false, error: 'No se pudo registrar el movimiento. Intente de nuevo.' })
  })
})

describe('deleteProduct', () => {
  beforeEach(() => {
    requireRole.mockReset()
    productDelete.mockReset()
  })

  it('requires ADMIN or GERENTE', async () => {
    requireRole.mockResolvedValue('ADMIN')
    productDelete.mockResolvedValue({})

    await deleteProduct('p1')

    expect(requireRole).toHaveBeenCalledWith(['ADMIN', 'GERENTE'])
  })

  it('rejects a TECNICO trying to delete a product', async () => {
    requireRole.mockRejectedValue(new Error('No tienes permisos suficientes para realizar esta acción.'))

    const result = await deleteProduct('p1')

    expect(productDelete).not.toHaveBeenCalled()
    expect(result.success).toBe(false)
  })
})
