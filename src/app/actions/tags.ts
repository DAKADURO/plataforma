'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/auth'
import { createTagSchema } from '@/lib/validations'
import { z } from 'zod'

const ACTIVE_ROLES = ['ADMIN', 'GERENTE', 'TECNICO']

export async function getTags() {
  try {
    await requireRole(ACTIVE_ROLES)
    const tags = await prisma.tag.findMany({
      include: {
        _count: { select: { products: true } }
      },
      orderBy: { name: 'asc' }
    })
    return { success: true, tags: tags as any[] }
  } catch (error) {
    return { success: false, error: 'No se pudo obtener etiquetas.', tags: [] }
  }
}

export async function createTag(data: { name: string; description?: string; color?: string }) {
  try {
    await requireRole(['ADMIN', 'GERENTE'])
    const validData = createTagSchema.parse(data)
    const { createSupabaseServerClient } = await import('@/lib/supabase-server')
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    const dbUser = user ? await prisma.user.findUnique({ where: { email: user.email! } }) : null

    if (!dbUser) {
      return { success: false, error: 'Usuario no encontrado.' }
    }

    const tag = await prisma.tag.create({
      data: {
        name: validData.name,
        description: validData.description,
        color: validData.color,
        createdBy: dbUser.id
      }
    })

    revalidatePath('/almacen')
    return { success: true, tag }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Datos de la etiqueta inválidos.' }
    }
    if (error instanceof Error && error.message.includes('Unique constraint failed')) {
      return { success: false, error: 'Ya existe una etiqueta con este nombre.' }
    }
    if (error instanceof Error && error.message.includes('permisos')) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'No se pudo crear la etiqueta.' }
  }
}

export async function updateTag(tagId: string, data: { name?: string; description?: string; color?: string }) {
  try {
    await requireRole(['ADMIN', 'GERENTE'])
    const validData = createTagSchema.partial().parse(data)
    const tag = await prisma.tag.update({
      where: { id: tagId },
      data: validData
    })
    revalidatePath('/almacen')
    return { success: true, tag }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Datos de la etiqueta inválidos.' }
    }
    if (error instanceof Error && error.message.includes('permisos')) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'No se pudo actualizar la etiqueta.' }
  }
}

export async function deleteTag(tagId: string) {
  try {
    await requireRole(['ADMIN'])
    await prisma.tag.delete({ where: { id: tagId } })
    revalidatePath('/almacen')
    return { success: true }
  } catch (error) {
    if (error instanceof Error && error.message.includes('permisos')) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'No se pudo eliminar la etiqueta.' }
  }
}

export async function addTagToProduct(productId: string, tagId: string) {
  try {
    await requireRole(['ADMIN', 'GERENTE'])
    await prisma.productTag.create({
      data: { productId, tagId }
    })
    revalidatePath('/almacen')
    return { success: true }
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unique constraint failed')) {
      return { success: false, error: 'Este producto ya tiene esta etiqueta.' }
    }
    return { success: false, error: 'No se pudo agregar la etiqueta.' }
  }
}

export async function removeTagFromProduct(productId: string, tagId: string) {
  try {
    await requireRole(['ADMIN', 'GERENTE'])
    await prisma.productTag.delete({
      where: { productId_tagId: { productId, tagId } }
    })
    revalidatePath('/almacen')
    return { success: true }
  } catch (error) {
    return { success: false, error: 'No se pudo remover la etiqueta.' }
  }
}

export async function getProductsByTag(tagId: string) {
  try {
    await requireRole(ACTIVE_ROLES)
    const products = await prisma.product.findMany({
      where: {
        tags: {
          some: { tagId }
        }
      },
      include: { tags: { include: { tag: true } } }
    })
    return { success: true, products }
  } catch (error) {
    return { success: false, error: 'No se pudo obtener productos.', products: [] }
  }
}

export async function getTagStats() {
  try {
    await requireRole(ACTIVE_ROLES)
    const tags = await prisma.tag.findMany({
      select: {
        id: true,
        name: true,
        _count: { select: { products: true } }
      },
      orderBy: { name: 'asc' }
    })
    return { success: true, tags }
  } catch (error) {
    return { success: false, error: 'No se pudo obtener estadísticas.', tags: [] }
  }
}
