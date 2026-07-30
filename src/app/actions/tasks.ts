/* eslint-disable @typescript-eslint/no-explicit-any */
'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/auth'
import { createTaskMaterialSchema } from '@/lib/validations'
import { z } from 'zod'

export async function createTask(data: {
  projectId: string
  projectDepartmentId: string
  name: string
  startDate?: Date | null
  endDate?: Date | null
  dependsOnTaskId?: string | null
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

async function wouldCauseCycle(taskId: string, predecessorId: string): Promise<boolean> {
  let currId: string | null = predecessorId
  const visited = new Set<string>()

  while (currId) {
    if (currId === taskId) return true
    if (visited.has(currId)) break
    visited.add(currId)

    const parent: { dependsOnTaskId: string | null } | null = await prisma.projectTask.findUnique({
      where: { id: currId },
      select: { dependsOnTaskId: true },
    })
    currId = parent?.dependsOnTaskId || null
  }
  return false
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
  dependsOnTaskId?: string | null
}) {
  try {
    await requireRole(['ADMIN', 'GERENTE', 'TECNICO'])
    const { id, projectId, projectDepartmentId, ...rest } = data

    if (rest.dependsOnTaskId) {
      if (rest.dependsOnTaskId === id) {
        return { success: false, error: 'Una tarea no puede depender de sí misma.' }
      }
      const isCycle = await wouldCauseCycle(id, rest.dependsOnTaskId)
      if (isCycle) {
        return { success: false, error: 'No se puede asignar dependencia: crearía un ciclo circular.' }
      }
    }

    const existingTask = await prisma.projectTask.findUnique({
      where: { id },
      select: { dependsOnTaskId: true, progress: true }
    })

    const effectivePredecessorId = rest.dependsOnTaskId !== undefined ? rest.dependsOnTaskId : existingTask?.dependsOnTaskId

    if (effectivePredecessorId) {
      const predecessor = await prisma.projectTask.findUnique({
        where: { id: effectivePredecessorId },
        select: { name: true, progress: true }
      })

      const targetProgress = rest.progress !== undefined ? rest.progress : (existingTask?.progress || 0)

      if (targetProgress > 0 && predecessor && predecessor.progress < 100) {
        return {
          success: false,
          error: `No se puede iniciar: depende de "${predecessor.name}" que aún no está completada.`
        }
      }
    }

    await prisma.projectTask.update({ where: { id }, data: rest })

    if (rest.progress === 100) {
      const incompleteChecklists = await prisma.taskChecklistItem.count({
        where: { taskId: id, isCompleted: false }
      })
      if (incompleteChecklists > 0) {
        return { success: false, error: 'No se puede completar la tarea: hay items de control de calidad pendientes.' }
      }
      await consumeTaskMaterials(id, projectId)
    }

    await recalcProjectProgress(projectId, projectDepartmentId)

    revalidatePath(`/proyectos/${projectId}`)
    revalidatePath('/almacen')
    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido'
    return { success: false, error: message }
  }
}

// Descuenta del almacén los materiales de la tarea (BOM) al llegar a 100%. Idempotente:
// solo consume los que aún no tengan `consumed: true`, así que subir/bajar el progreso
// varias veces no descuenta el material más de una vez.
async function consumeTaskMaterials(taskId: string, projectId: string) {
  const pending = await prisma.taskMaterial.findMany({ where: { taskId, consumed: false } })
  if (pending.length === 0) return

  const { createSupabaseServerClient } = await import('@/lib/supabase-server')
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  const dbUser = user ? await prisma.user.findUnique({ where: { email: user.email! } }) : null

  const task = await prisma.projectTask.findUnique({ where: { id: taskId }, select: { name: true } })

  await prisma.$transaction(async (tx: any) => {
    for (const material of pending) {
      await tx.inventory.create({
        data: {
          productId: material.productId,
          quantity: material.quantity,
          type: 'SALIDA',
          projectId,
          userId: dbUser?.id,
          notes: `Consumo automático - tarea: ${task?.name || ''}`
        }
      })

      const product = await tx.product.update({
        where: { id: material.productId },
        data: { stock: { decrement: material.quantity } }
      })

      if (product?.isAlertEnabled && product.stock <= product.minStock) {
        const existingAlert = await tx.reorderAlert.findFirst({
          where: { productId: material.productId, status: 'ACTIVE' }
        })
        if (!existingAlert) {
          await tx.reorderAlert.create({
            data: {
              productId: material.productId,
              alertType: product.stock <= 0 ? 'OUT_OF_STOCK' : 'LOW_STOCK',
              severity: product.stock <= 0 ? 'CRITICAL' : 'WARNING'
            }
          })
        }
      }

      await tx.taskMaterial.update({ where: { id: material.id }, data: { consumed: true } })
    }
  })
}

export async function addTaskMaterial(data: { taskId: string, productId: string, quantity: number, projectId: string }) {
  try {
    await requireRole(['ADMIN', 'GERENTE', 'TECNICO'])
    const valid = createTaskMaterialSchema.parse(data)

    const material = await prisma.taskMaterial.create({
      data: valid,
      include: { product: { select: { id: true, name: true, sku: true } } }
    })

    revalidatePath(`/proyectos/${data.projectId}`)
    return { success: true, material }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0]?.message || 'Datos inválidos.' }
    }
    if (error instanceof Error && error.message.includes('permisos')) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'No se pudo vincular el material.' }
  }
}

export async function removeTaskMaterial(materialId: string, projectId: string) {
  try {
    await requireRole(['ADMIN', 'GERENTE', 'TECNICO'])
    const material = await prisma.taskMaterial.findUnique({ where: { id: materialId } })
    if (material?.consumed) {
      return { success: false, error: 'No se puede quitar: el material ya fue descontado del almacén.' }
    }
    await prisma.taskMaterial.delete({ where: { id: materialId } })
    revalidatePath(`/proyectos/${projectId}`)
    return { success: true }
  } catch (error) {
    if (error instanceof Error && error.message.includes('permisos')) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'No se pudo quitar el material.' }
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

export async function addTaskChecklistItem(data: { taskId: string, description: string, projectId: string }) {
  try {
    await requireRole(['ADMIN', 'GERENTE', 'TECNICO'])
    if (!data.description || data.description.trim() === '') {
      return { success: false, error: 'La descripción no puede estar vacía.' }
    }

    const item = await prisma.taskChecklistItem.create({
      data: {
        taskId: data.taskId,
        description: data.description.trim()
      }
    })

    revalidatePath(`/proyectos/${data.projectId}`)
    return { success: true, item }
  } catch (error) {
    return { success: false, error: 'No se pudo agregar el item al checklist.' }
  }
}

export async function removeTaskChecklistItem(itemId: string, projectId: string) {
  try {
    await requireRole(['ADMIN', 'GERENTE', 'TECNICO'])
    await prisma.taskChecklistItem.delete({ where: { id: itemId } })
    revalidatePath(`/proyectos/${projectId}`)
    return { success: true }
  } catch (error) {
    return { success: false, error: 'No se pudo eliminar el item del checklist.' }
  }
}

export async function toggleTaskChecklistItem(itemId: string, isCompleted: boolean, projectId: string) {
  try {
    await requireRole(['ADMIN', 'GERENTE', 'TECNICO'])
    
    const { createSupabaseServerClient } = await import('@/lib/supabase-server')
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    const dbUser = user ? await prisma.user.findUnique({ where: { email: user.email! } }) : null

    await prisma.taskChecklistItem.update({
      where: { id: itemId },
      data: { 
        isCompleted,
        completedAt: isCompleted ? new Date() : null,
        completedBy: isCompleted ? dbUser?.id : null
      }
    })

    revalidatePath(`/proyectos/${projectId}`)
    return { success: true }
  } catch (error) {
    return { success: false, error: 'No se pudo actualizar el estado del item.' }
  }
}
