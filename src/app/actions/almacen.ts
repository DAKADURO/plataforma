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
    include: {
      inventory: true
    },
    orderBy: { name: 'asc' }
  })

  // Stock calculation dynamically: sum(ENTRADA) - sum(SALIDA)
  return products.map(p => {
    const stock = p.inventory.reduce((acc, inv) => {
      return inv.type === 'ENTRADA' ? acc + inv.quantity : acc - inv.quantity
    }, 0)
    return { 
      id: p.id,
      sku: p.sku,
      name: p.name,
      category: p.category,
      department: p.department,
      itemType: p.itemType,
      minStock: p.minStock,
      stock
    }
  })
}

export async function getCategories() {
  // [SEC-FIX #1] Proteger lectura de categorías
  await requireRole(ACTIVE_ROLES)
  const categories = await prisma.product.findMany({
    select: { category: true },
    distinct: ['category']
  })
  return categories.map(c => c.category).sort()
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

export async function createMovement(data: { productId: string, quantity: number, type: 'ENTRADA' | 'SALIDA', projectId?: string }) {
  try {
    // [SEC-FIX #2] createMovement estaba DESPROTEGIDA — se requiere rol activo
    await requireRole(ACTIVE_ROLES)
    await prisma.inventory.create({
      data: {
        productId: data.productId,
        quantity: data.quantity,
        type: data.type,
        projectId: data.projectId || null
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
