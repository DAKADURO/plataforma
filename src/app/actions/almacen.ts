'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function getProducts(category?: string) {
  const products = await prisma.product.findMany({
    where: category && category !== 'Todas' ? { category } : undefined,
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
      minStock: p.minStock,
      stock
    }
  })
}

export async function getCategories() {
  const categories = await prisma.product.findMany({
    select: { category: true },
    distinct: ['category']
  })
  return categories.map(c => c.category).sort()
}

export async function createProduct(data: { sku: string, name: string, category: string, minStock: number }) {
  try {
    await prisma.product.create({ data })
    revalidatePath('/almacen')
    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido'
    return { success: false, error: message }
  }
}

export async function createMovement(data: { productId: string, quantity: number, type: 'ENTRADA' | 'SALIDA', projectId?: string }) {
  try {
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
    const message = error instanceof Error ? error.message : 'Error desconocido'
    return { success: false, error: message }
  }
}
