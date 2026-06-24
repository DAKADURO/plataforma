'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/auth'

type ClientInput = {
  name: string
  contact?: string
  email?: string
  phone?: string
  rfc?: string
  address?: string
}

export async function getClients() {
  return await prisma.client.findMany({
    include: {
      _count: {
        select: { projects: true }
      }
    },
    orderBy: { name: 'asc' }
  })
}

export async function createClient(data: ClientInput) {
  try {
    await requireRole(['ADMIN', 'GERENTE', 'TECNICO'])
    await prisma.client.create({ data })
    revalidatePath('/clientes')
    revalidatePath('/proyectos')
    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido'
    return { success: false, error: message }
  }
}

export async function updateClient(id: string, data: ClientInput) {
  try {
    await requireRole(['ADMIN', 'GERENTE'])
    await prisma.client.update({ where: { id }, data })
    revalidatePath('/clientes')
    revalidatePath('/proyectos')
    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido'
    return { success: false, error: message }
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
    const message = error instanceof Error ? error.message : 'Error desconocido'
    return { success: false, error: message }
  }
}
