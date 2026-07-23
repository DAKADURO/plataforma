'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/auth'

export async function createTask(data: {
  projectId: string
  projectDepartmentId: string
  name: string
  startDate?: Date | null
  endDate?: Date | null
}) {
  try {
    await requireRole(['ADMIN', 'GERENTE', 'TECNICO'])
    const { projectId, ...taskData } = data
    const task = await prisma.projectTask.create({ data: taskData })

    await recalcProjectProgress(projectId, data.projectDepartmentId)

    revalidatePath(`/proyectos/${projectId}`)
    return { success: true, task }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido'
    return { success: false, error: message }
  }
}

export async function updateTask(data: {
  id: string
  projectId: string
  projectDepartmentId: string
  name?: string
  startDate?: Date | null
  endDate?: Date | null
  progress?: number
  status?: string
}) {
  try {
    await requireRole(['ADMIN', 'GERENTE', 'TECNICO'])
    const { id, projectId, projectDepartmentId, ...rest } = data
    await prisma.projectTask.update({ where: { id }, data: rest })

    await recalcProjectProgress(projectId, projectDepartmentId)

    revalidatePath(`/proyectos/${projectId}`)
    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido'
    return { success: false, error: message }
  }
}

export async function deleteTask(id: string, projectId: string, projectDepartmentId: string) {
  try {
    await requireRole(['ADMIN', 'GERENTE'])
    await prisma.projectTask.delete({ where: { id } })

    await recalcProjectProgress(projectId, projectDepartmentId)

    revalidatePath(`/proyectos/${projectId}`)
    return { success: true }
  } catch (error) {
    if (error instanceof Error && error.message.includes('permisos')) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'No se pudo eliminar la tarea.' }
  }
}

async function recalcProjectProgress(projectId: string, departmentId: string) {
  const deptTasks = await prisma.projectTask.findMany({ where: { projectDepartmentId: departmentId } })
  const deptAvg = deptTasks.length === 0
    ? 0
    : Math.round(deptTasks.reduce((sum, t) => sum + t.progress, 0) / deptTasks.length)

  await prisma.projectDepartment.update({
    where: { id: departmentId },
    data: { progress: deptAvg }
  })

  const depts = await prisma.projectDepartment.findMany({ where: { projectId } })
  const projAvg = depts.length === 0
    ? 0
    : Math.round(depts.reduce((sum, d) => sum + d.progress, 0) / depts.length)

  await prisma.project.update({
    where: { id: projectId },
    data: { progress: projAvg }
  })
}
