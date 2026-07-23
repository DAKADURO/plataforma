/* eslint-disable @typescript-eslint/no-explicit-any */
'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/auth'

// [SEC-FIX #1] Roles activos del sistema (excluye PENDIENTE)
const ACTIVE_ROLES = ['ADMIN', 'GERENTE', 'TECNICO']

export async function getProducts(category?: string, department?: string) {
  // [SEC-FIX #1] Proteger lectura de inventario contra usuarios PENDIENTE
  await requireRole(ACTIVE_ROLES)
  const products = await prisma.product.findMany({
    where: {
      ...(category && category !== 'Todas' ? { category } : {}),
      ...(department && department !== 'Todos' ? { department } : {})
    },
    orderBy: { name: 'asc' }
  })

  return products.map((p: any) => ({
    id: p.id,
    sku: p.sku,
    name: p.name,
    category: p.category,
    department: p.department,
    itemType: p.itemType,
    minStock: p.minStock,
    stock: p.stock
  }))
}

export async function getCategories() {
  // [SEC-FIX #1] Proteger lectura de categorías
  await requireRole(ACTIVE_ROLES)
  const categories = await prisma.product.findMany({
    select: { category: true },
    distinct: ['category']
  })
  return categories.map((c: any) => c.category).sort()
}

export async function createProduct(data: { sku: string, name: string, category: string, department: string, itemType: string, minStock: number }) {
  try {
    await requireRole(['ADMIN', 'GERENTE'])
    await prisma.product.create({ data })
    revalidatePath('/almacen')
    revalidatePath('/maquinas')
    return { success: true }
  } catch (error) {
    // [SEC-FIX #5] Sanitizar errores internos de Prisma
    if (error instanceof Error && error.message.includes('permisos')) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'No se pudo completar la operación. Intente de nuevo.' }
  }
}

export async function createMovement(data: { productId: string, quantity: number, type: 'ENTRADA' | 'SALIDA', projectId?: string, notes?: string }) {
  try {
    // [SEC-FIX #2] createMovement estaba DESPROTEGIDA — se requiere rol activo
    await requireRole(ACTIVE_ROLES)

    const { createSupabaseServerClient } = await import('@/lib/supabase-server')
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    const dbUser = user ? await prisma.user.findUnique({ where: { email: user.email! } }) : null

    await prisma.$transaction(async (tx: any) => {
      await tx.inventory.create({
        data: {
          productId: data.productId,
          quantity: data.quantity,
          type: data.type,
          projectId: data.projectId || null,
          userId: dbUser?.id,
          notes: data.notes || null
        }
      })

      const product = await tx.product.findUnique({ where: { id: data.productId } })
      const stockChange = data.type === 'ENTRADA' ? data.quantity : -data.quantity
      const newStock = Math.max(0, (product?.stock || 0) + stockChange)

      await tx.product.update({
        where: { id: data.productId },
        data: {
          stock: newStock
        }
      })

      // Check if stock is now low and create alert if enabled
      if (product?.isAlertEnabled && newStock <= product.minStock) {
        const existingAlert = await tx.reorderAlert.findFirst({
          where: { productId: data.productId, status: 'ACTIVE' }
        })
        if (!existingAlert) {
          await tx.reorderAlert.create({
            data: {
              productId: data.productId,
              alertType: newStock === 0 ? 'OUT_OF_STOCK' : 'LOW_STOCK',
              severity: newStock === 0 ? 'CRITICAL' : 'WARNING'
            }
          })
        }
      }
    })

    revalidatePath('/almacen')
    if (data.projectId) revalidatePath(`/proyectos/${data.projectId}`)
    return { success: true }
  } catch (error) {
    // [SEC-FIX #5] Sanitizar errores internos de Prisma
    if (error instanceof Error && error.message.includes('permisos')) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'No se pudo registrar el movimiento. Intente de nuevo.' }
  }
}

export async function deleteProduct(id: string) {
  try {
    await requireRole(['ADMIN', 'GERENTE'])
    await prisma.product.delete({ where: { id } })
    revalidatePath('/almacen')
    revalidatePath('/maquinas')
    return { success: true }
  } catch (error) {
    if (error instanceof Error && error.message.includes('permisos')) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'No se pudo eliminar. Es posible que el producto tenga movimientos o máquinas asociadas.' }
  }
}

// ==========================================
// Alert Management (Phase 1: Stock Alerts)
// ==========================================

export async function getAlerts() {
  try {
    await requireRole(['ADMIN', 'GERENTE'])
    const alerts = await prisma.reorderAlert.findMany({
      include: {
        product: { select: { id: true, name: true, sku: true, stock: true, minStock: true } }
      },
      orderBy: { createdAt: 'desc' }
    })
    return { success: true, alerts }
  } catch (error) {
    if (error instanceof Error && error.message.includes('permisos')) {
      return { success: false, error: error.message, alerts: [] }
    }
    return { success: false, error: 'No se pudo obtener alertas.', alerts: [] }
  }
}

export async function getLowStockProducts() {
  try {
    await requireRole(ACTIVE_ROLES)
    const products = await prisma.product.findMany({
      where: {
        isAlertEnabled: true,
        stock: { lte: prisma.product.fields.minStock }
      },
      include: {
        alerts: { where: { status: 'ACTIVE' }, take: 1 }
      },
      orderBy: [{ stock: 'asc' }],
      take: 10
    })
    return { success: true, products }
  } catch (error) {
    return { success: false, error: 'No se pudo obtener productos con bajo stock.', products: [] }
  }
}

export async function acknowledgeAlert(alertId: string) {
  try {
    await requireRole(['ADMIN', 'GERENTE'])
    const { createSupabaseServerClient } = await import('@/lib/supabase-server')
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    const dbUser = user ? await prisma.user.findUnique({ where: { email: user.email! } }) : null

    await prisma.reorderAlert.update({
      where: { id: alertId },
      data: {
        status: 'ACKNOWLEDGED',
        acknowledgedBy: dbUser?.id,
        acknowledgedAt: new Date()
      }
    })

    revalidatePath('/almacen')
    return { success: true }
  } catch (error) {
    if (error instanceof Error && error.message.includes('permisos')) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'No se pudo reconocer la alerta.' }
  }
}

export async function resolveAlert(alertId: string) {
  try {
    await requireRole(['ADMIN', 'GERENTE'])
    await prisma.reorderAlert.update({
      where: { id: alertId },
      data: {
        status: 'RESOLVED',
        resolvedAt: new Date()
      }
    })

    revalidatePath('/almacen')
    return { success: true }
  } catch (error) {
    if (error instanceof Error && error.message.includes('permisos')) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'No se pudo resolver la alerta.' }
  }
}

export async function getMovementHistory(productId: string, limit: number = 20) {
  try {
    await requireRole(ACTIVE_ROLES)
    const movements = await prisma.inventory.findMany({
      where: { productId },
      include: {
        user: { select: { id: true, email: true } },
        project: { select: { id: true, name: true } }
      },
      orderBy: { date: 'desc' },
      take: limit
    })
    return { success: true, movements }
  } catch (error) {
    return { success: false, error: 'No se pudo obtener el historial.', movements: [] }
  }
}

export async function updateProductAlertSettings(productId: string, isAlertEnabled: boolean) {
  try {
    await requireRole(['ADMIN', 'GERENTE'])
    await prisma.product.update({
      where: { id: productId },
      data: { isAlertEnabled }
    })
    revalidatePath('/almacen')
    return { success: true }
  } catch (error) {
    return { success: false, error: 'No se pudo actualizar configuración de alertas.' }
  }
}
