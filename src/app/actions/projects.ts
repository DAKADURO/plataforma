'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/auth'
import { createClientSchema, createProjectSchema } from '@/lib/validations'
import { z } from 'zod'

export async function getProjects() {
  return await prisma.project.findMany({
    include: {
      client: true,
      tasks: {
        select: { status: true }
      }
    },
    orderBy: { name: 'asc' }
  })
}

export async function getProjectById(id: string) {
  return await prisma.project.findUnique({
    where: { id },
    include: {
      client: true,
      inventory: {
        include: { product: true },
        orderBy: { date: 'desc' }
      },
      documents: {
        include: {
          versions: {
            orderBy: { version: 'desc' }
          }
        }
      },
      tasks: {
        orderBy: { createdAt: 'asc' }
      }
    }
  })
}

export async function getClients() {
  return await prisma.client.findMany({
    orderBy: { name: 'asc' }
  })
}

export async function createClient(data: z.infer<typeof createClientSchema>) {
  try {
    await requireRole(['ADMIN', 'GERENTE'])
    const validData = createClientSchema.parse(data)
    await prisma.client.create({ data: validData })
    revalidatePath('/proyectos')
    revalidatePath('/clientes')
    return { success: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.message }
    }
    const message = error instanceof Error ? error.message : 'Error desconocido'
    return { success: false, error: message }
  }
}

export async function createProject(data: z.infer<typeof createProjectSchema>) {
  try {
    await requireRole(['ADMIN', 'GERENTE'])
    const validData = createProjectSchema.parse(data)
    await prisma.project.create({ data: validData })
    revalidatePath('/proyectos')
    return { success: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.message }
    }
    const message = error instanceof Error ? error.message : 'Error desconocido'
    return { success: false, error: message }
  }
}

export async function updateProjectStatus(data: { 
  id: string, 
  status: string, 
  blockReason?: string | null,
}) {
  try {
    await requireRole(['ADMIN', 'GERENTE'])
    await prisma.project.update({
      where: { id: data.id },
      data: {
        status: data.status,
        blockReason: data.status === 'ATORADO' ? data.blockReason : null,
      }
    })
    revalidatePath('/proyectos')
    revalidatePath(`/proyectos/${data.id}`)
    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido'
    return { success: false, error: message }
  }
}

