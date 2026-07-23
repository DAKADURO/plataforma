'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/auth'
import { createClientSchema } from '@/lib/validations'
import { z } from 'zod'

type ClientInput = z.infer<typeof createClientSchema>

// [SEC-FIX #1] Proteger lectura del directorio de clientes
const ACTIVE_ROLES = ['ADMIN', 'GERENTE', 'TECNICO']

export async function getClients() {
  await requireRole(ACTIVE_ROLES)
  return await prisma.client.findMany({
    include: {
      _count: {
        select: { projects: true }
      }
    },
    orderBy: { name: 'asc' }
  })
}

export async function getClientById(id: string) {
  await requireRole(ACTIVE_ROLES)
  return await prisma.client.findUnique({
    where: { id },
    include: {
      projects: {
        orderBy: { name: 'asc' },
        include: {
          departments: {
            include: { tasks: true }
          },
          _count: {
            select: { departments: true, documents: true }
          }
        }
      }
    }
  })
}

export async function createClient(data: ClientInput) {
  try {
    await requireRole(['ADMIN', 'GERENTE', 'TECNICO'])
    const validData = createClientSchema.parse(data)
    await prisma.client.create({ data: validData })
    revalidatePath('/clientes')
    revalidatePath('/proyectos')
    return { success: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Datos del formulario inválidos.' }
    }
    // [SEC-FIX #5] Sanitizar errores internos de Prisma/BD
    if (error instanceof Error && error.message.includes('permisos')) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'No se pudo completar la operación. Intente de nuevo.' }
  }
}

export async function updateClient(id: string, data: ClientInput) {
  try {
    await requireRole(['ADMIN', 'GERENTE'])
    const validData = createClientSchema.parse(data)
    await prisma.client.update({ where: { id }, data: validData })
    revalidatePath('/clientes')
    revalidatePath('/proyectos')
    return { success: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Datos del formulario inválidos.' }
    }
    // [SEC-FIX #5] Sanitizar errores internos de Prisma/BD
    if (error instanceof Error && error.message.includes('permisos')) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'No se pudo completar la operación. Intente de nuevo.' }
  }
}

export async function deleteClient(id: string) {
  try {
    await requireRole(['ADMIN', 'GERENTE'])
    await prisma.client.delete({ where: { id } })
    revalidatePath('/clientes')
    revalidatePath('/proyectos')
    return { success: true }
  } catch (error) {
    // [SEC-FIX #5] Sanitizar errores internos de Prisma/BD
    if (error instanceof Error && error.message.includes('permisos')) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'No se pudo completar la operación. Intente de nuevo.' }
  }
}
