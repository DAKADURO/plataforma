'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/auth'
import { createMachineAssignmentSchema } from '@/lib/validations'
import { z } from 'zod'

export async function assignMachineToProject(data: { machineId: string, projectId: string, startDate: string | Date, endDate?: string | Date, notes?: string }) {
  try {
    await requireRole(['ADMIN', 'GERENTE'])
    const validData = createMachineAssignmentSchema.parse(data)

    const machine = await prisma.machine.findUnique({ where: { id: validData.machineId } })
    if (!machine) {
      return { success: false, error: 'Máquina no encontrada.' }
    }

    // Choque de agenda: la misma máquina no puede estar en dos proyectos en fechas que se traslapan.
    // Una asignación sin endDate se considera abierta/indefinida (bloquea cualquier fecha posterior).
    const existing = await prisma.machineAssignment.findMany({
      where: { machineId: validData.machineId },
      include: { project: { select: { name: true } } }
    })
    const newEnd = validData.endDate ?? null
    const conflict = existing.find(a => {
      const existingEnd = a.endDate
      const startsBeforeExistingEnds = !existingEnd || validData.startDate <= existingEnd
      const endsAfterExistingStarts = !newEnd || newEnd >= a.startDate
      return startsBeforeExistingEnds && endsAfterExistingStarts
    })
    if (conflict) {
      return { success: false, error: `La máquina ya está asignada al proyecto "${conflict.project.name}" en esas fechas.` }
    }

    const assignment = await prisma.machineAssignment.create({
      data: {
        machineId: validData.machineId,
        projectId: validData.projectId,
        startDate: validData.startDate,
        endDate: validData.endDate || null,
        notes: validData.notes || null,
        dailyRateSnapshot: machine.dailyRate
      },
      include: { project: { select: { id: true, name: true } } }
    })

    revalidatePath('/maquinas')
    revalidatePath(`/proyectos/${validData.projectId}`)
    return { success: true, assignment }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0]?.message || 'Datos de asignación inválidos.' }
    }
    if (error instanceof Error && error.message.includes('permisos')) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'No se pudo asignar la máquina. Intente de nuevo.' }
  }
}

export async function endMachineAssignment(assignmentId: string, endDate: string | Date = new Date()) {
  try {
    await requireRole(['ADMIN', 'GERENTE'])
    const assignment = await prisma.machineAssignment.update({
      where: { id: assignmentId },
      data: { endDate: new Date(endDate) }
    })
    revalidatePath('/maquinas')
    revalidatePath(`/proyectos/${assignment.projectId}`)
    return { success: true }
  } catch (error) {
    if (error instanceof Error && error.message.includes('permisos')) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'No se pudo finalizar la asignación.' }
  }
}

export async function deleteMachineAssignment(assignmentId: string, projectId: string) {
  try {
    await requireRole(['ADMIN', 'GERENTE'])
    await prisma.machineAssignment.delete({ where: { id: assignmentId } })
    revalidatePath('/maquinas')
    revalidatePath(`/proyectos/${projectId}`)
    return { success: true }
  } catch (error) {
    if (error instanceof Error && error.message.includes('permisos')) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'No se pudo eliminar la asignación.' }
  }
}
