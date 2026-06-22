'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function getProjects() {
  return await prisma.project.findMany({
    include: {
      client: true
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
      }
    }
  })
}

export async function getClients() {
  return await prisma.client.findMany({
    orderBy: { name: 'asc' }
  })
}

export async function createClient(data: { name: string; contact?: string }) {
  try {
    await prisma.client.create({ data })
    revalidatePath('/proyectos')
    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido'
    return { success: false, error: message }
  }
}

export async function createProject(data: { name: string; clientId: string }) {
  try {
    await prisma.project.create({ data })
    revalidatePath('/proyectos')
    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido'
    return { success: false, error: message }
  }
}

export async function updateProjectStatus(data: { id: string, progress: number, status: string, blockReason?: string | null }) {
  try {
    await prisma.project.update({
      where: { id: data.id },
      data: {
        progress: data.progress,
        status: data.status,
        blockReason: data.status === 'ATORADO' ? data.blockReason : null
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
