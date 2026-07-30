'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { requireRole, getCurrentUser } from '@/lib/auth'

const ADMIN_ROLES = ['ADMIN', 'GERENTE']

export async function getRestockOrders() {
  await requireRole(ADMIN_ROLES)
  return await prisma.restockOrder.findMany({
    include: {
      user: { select: { email: true } },
      items: {
        include: {
          product: { select: { name: true, sku: true, stock: true, minStock: true, cost: true } }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })
}

export async function generateAutoRestock() {
  try {
    await requireRole(ADMIN_ROLES)
    const user = await getCurrentUser()
    if (!user) throw new Error('No user found')

    // Find products below minStock
    const lowStockProducts = await prisma.product.findMany({
      where: {
        stock: {
          lte: prisma.product.fields.minStock
        }
      }
    })

    if (lowStockProducts.length === 0) {
      return { success: false, error: 'No hay productos con bajo stock.' }
    }

    // Create the order
    const order = await prisma.restockOrder.create({
      data: {
        createdBy: user.id,
        status: 'BORRADOR',
        notes: 'Generada automáticamente por alerta de stock bajo.',
        items: {
          create: lowStockProducts.map(p => ({
            productId: p.id,
            // Pedimos lo necesario para estar al doble del mínimo (ejemplo) o mínimo + 5
            // Si el stock actual es 0 y el mínimo es 5, pedir 10.
            quantity: Math.max((p.minStock * 2) - p.stock, 1),
            unitCost: p.cost
          }))
        }
      }
    })

    revalidatePath('/almacen')
    revalidatePath('/almacen/reposiciones')
    return { success: true, orderId: order.id }
  } catch (error) {
    if (error instanceof Error && error.message.includes('permisos')) return { success: false, error: error.message }
    return { success: false, error: 'Error al generar la orden automática.' }
  }
}

export async function updateRestockOrderStatus(id: string, status: string) {
  try {
    await requireRole(ADMIN_ROLES)
    await prisma.restockOrder.update({
      where: { id },
      data: { status }
    })
    
    revalidatePath('/almacen')
    revalidatePath('/almacen/reposiciones')
    return { success: true }
  } catch (error) {
    if (error instanceof Error && error.message.includes('permisos')) return { success: false, error: error.message }
    return { success: false, error: 'Error al actualizar el estado.' }
  }
}

export async function receiveRestockOrder(id: string) {
  try {
    await requireRole(ADMIN_ROLES)
    const user = await getCurrentUser()
    if (!user) throw new Error('No user found')

    const order = await prisma.restockOrder.findUnique({
      where: { id },
      include: { items: true }
    })

    if (!order) return { success: false, error: 'Orden no encontrada.' }
    if (order.status === 'RECIBIDA') return { success: false, error: 'La orden ya fue recibida.' }

    // Usar transacción para asegurar que el inventario y la orden se actualicen juntos
    await prisma.$transaction(async (tx) => {
      // 1. Marcar como RECIBIDA
      await tx.restockOrder.update({
        where: { id },
        data: { 
          status: 'RECIBIDA',
          receivedAt: new Date()
        }
      })

      // 2. Incrementar stock de productos y registrar movimientos
      for (const item of order.items) {
        // Increment stock
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: { increment: item.quantity },
            // Actualizamos el costo unitario al último precio de compra si queremos, pero lo dejamos simple por ahora
          }
        })

        // Add inventory movement history
        await tx.inventory.create({
          data: {
            productId: item.productId,
            userId: user.id,
            quantity: item.quantity,
            type: 'ENTRADA',
            notes: `Entrada automática por Orden de Reposición ${id.slice(-6).toUpperCase()}`,
            isManual: false
          }
        })
      }
    })
    
    revalidatePath('/almacen')
    revalidatePath('/almacen/reposiciones')
    return { success: true }
  } catch (error) {
    if (error instanceof Error && error.message.includes('permisos')) return { success: false, error: error.message }
    console.error(error);
    return { success: false, error: 'Error al recibir el material.' }
  }
}

export async function deleteRestockOrder(id: string) {
  try {
    await requireRole(ADMIN_ROLES)
    const order = await prisma.restockOrder.findUnique({ where: { id } })
    if (order?.status === 'RECIBIDA') return { success: false, error: 'No se puede eliminar una orden ya recibida.' }
    
    await prisma.restockOrder.delete({ where: { id } })
    revalidatePath('/almacen')
    revalidatePath('/almacen/reposiciones')
    return { success: true }
  } catch (error) {
    if (error instanceof Error && error.message.includes('permisos')) return { success: false, error: error.message }
    return { success: false, error: 'Error al eliminar la orden.' }
  }
}

export async function updateRestockOrderItem(itemId: string, quantity: number) {
  try {
    await requireRole(ADMIN_ROLES)
    await prisma.restockOrderItem.update({
      where: { id: itemId },
      data: { quantity }
    })
    revalidatePath('/almacen/reposiciones')
    return { success: true }
  } catch (error) {
    return { success: false, error: 'Error al actualizar la cantidad.' }
  }
}

export async function removeRestockOrderItem(itemId: string) {
  try {
    await requireRole(ADMIN_ROLES)
    await prisma.restockOrderItem.delete({
      where: { id: itemId }
    })
    revalidatePath('/almacen/reposiciones')
    return { success: true }
  } catch (error) {
    return { success: false, error: 'Error al eliminar el item.' }
  }
}
