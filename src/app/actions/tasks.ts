'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/auth'

export async function createTask(data: {
  projectId: string
  name: string
  startDate?: Date | null
  endDate?: Date | null
}) {
  try {
    await requireRole(['ADMIN', 'GERENTE', 'TECNICO'])
    const task = await prisma.projectTask.create({ data })

    // Recalculate project progress from tasks average
    await recalcProjectProgress(data.projectId)

    revalidatePath(`/proyectos/${data.projectId}`)
    return { success: true, task }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido'
    return { success: false, error: message }
  }
}

export async function updateTask(data: {
  id: string
  projectId: string
  name?: string
  startDate?: Date | null
  endDate?: Date | null
  progress?: number
  status?: string
}) {
  try {
    await requireRole(['ADMIN', 'GERENTE', 'TECNICO'])
    const { id, projectId, ...rest } = data
    await prisma.projectTask.update({ where: { id }, data: rest })

    // Recalculate project progress from tasks average
    await recalcProjectProgress(projectId)

    revalidatePath(`/proyectos/${projectId}`)
    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido'
    return { success: false, error: message }
  }
}

export async function deleteTask(id: string, projectId: string) {
  try {
    await requireRole(['ADMIN', 'GERENTE'])
    await prisma.projectTask.delete({ where: { id } })

    // Recalculate project progress from tasks average
    await recalcProjectProgress(projectId)

    revalidatePath(`/proyectos/${projectId}`)
    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido'
    return { success: false, error: message }
  }
}

// Helper: recalculate project progress as average of all task progresses
async function recalcProjectProgress(projectId: string) {
  const tasks = await prisma.projectTask.findMany({ where: { projectId } })
  const avg = tasks.length === 0
    ? 0
    : Math.round(tasks.reduce((sum, t) => sum + t.progress, 0) / tasks.length)

  await prisma.project.update({
    where: { id: projectId },
    data: { progress: avg }
  })
}
