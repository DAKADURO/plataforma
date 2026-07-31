/* eslint-disable @typescript-eslint/no-unused-vars */
'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/auth'
import { createClientSchema, createProjectSchema, updateProjectContractAmountSchema } from '@/lib/validations'
import { logAudit } from '@/lib/audit'
import { z } from 'zod'

// [SEC-FIX #1] Proteger lecturas: usuarios con rol PENDIENTE no tienen acceso a datos
const ACTIVE_ROLES = ['ADMIN', 'GERENTE', 'TECNICO']

export async function getProjects() {
  await requireRole(ACTIVE_ROLES)
  return await prisma.project.findMany({
    include: {
      client: true,
      notes: {
        orderBy: { createdAt: 'desc' },
        take: 3
      },
      departments: {
        include: {
          tasks: {
            select: { id: true, name: true, status: true, endDate: true }
          }
        }
      }
    },
    orderBy: { name: 'asc' }
  })
}
export async function getProjectById(id: string) {
  // [SEC-FIX #1] Solo roles activos pueden leer el detalle de un proyecto
  await requireRole(ACTIVE_ROLES)
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      client: true,
      team: { select: { id: true, email: true, role: true } },
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
      departments: {
        include: {
          tasks: {
            include: {
              materials: {
                include: { product: { select: { id: true, name: true, sku: true } } }
              },
              dependsOnTask: { select: { id: true, name: true, progress: true } }
            },
            orderBy: { createdAt: 'asc' }
          }
        },
        orderBy: { name: 'asc' }
      },
      notes: {
        orderBy: { createdAt: 'desc' }
      },
      workLogs: {
        include: { user: { select: { email: true } } },
        orderBy: { date: 'desc' }
      },
      machineAssignments: {
        include: { machine: { select: { id: true, name: true, category: true } } },
        orderBy: { startDate: 'desc' }
      },
      payments: {
        orderBy: { createdAt: 'desc' }
      },
      statusEvents: {
        orderBy: { createdAt: 'desc' }
      }
    }
  })

  if (!project) return null

  const auditLogs = await prisma.auditLog.findMany({
    where: { entity: 'Project', entityId: id },
    include: { user: { select: { email: true } } },
    orderBy: { createdAt: 'desc' }
  })

  return { ...project, auditLogs }
}

export async function getClients() {
  // [SEC-FIX #1] Solo roles activos pueden leer el directorio de clientes
  await requireRole(ACTIVE_ROLES)
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
      return { success: false, error: 'Datos del formulario inválidos.' }
    }
    // [SEC-FIX #5] Exponer solo errores de autorización; sanitizar el resto
    if (error instanceof Error && error.message.includes('permisos')) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'No se pudo completar la operación. Intente de nuevo.' }
  }
}

export async function createProject(data: z.infer<typeof createProjectSchema>) {
  try {
    await requireRole(['ADMIN', 'GERENTE'])
    const validData = createProjectSchema.parse(data)
    const newProj = await prisma.project.create({ 
      data: {
        ...validData,
        departments: {
          create: [
            { name: 'Mecánico' },
            { name: 'Eléctrico' },
            { name: 'Fabricación' },
            { name: 'Integración' }
          ]
        }
      } 
    })
    await logAudit({
      action: 'CREATE_PROJECT',
      entity: 'Project',
      entityId: newProj.id,
      details: JSON.stringify({ name: newProj.name })
    })
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

export async function updateProjectStatus(data: { 
  id: string, 
  status: string, 
  category?: string | null,
  blockReason?: string | null,
  reason?: string | null,
}) {
  try {
    await requireRole(['ADMIN', 'GERENTE'])
    const { createSupabaseServerClient } = await import('@/lib/supabase-server')
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    const dbUser = user?.email ? await prisma.user.findUnique({ where: { email: user.email }, select: { id: true } }) : null

    const effectiveBlockReason = data.status === 'ATORADO' || data.status === 'RIESGO'
      ? (data.reason || data.blockReason || data.category || null)
      : null

    await prisma.project.update({
      where: { id: data.id },
      data: {
        status: data.status,
        blockReason: effectiveBlockReason,
      }
    })

    await prisma.projectStatusEvent.create({
      data: {
        projectId: data.id,
        status: data.status,
        category: data.category || null,
        reason: data.reason || data.blockReason || null,
        userId: dbUser?.id || null,
      }
    })

    await logAudit({
      userId: dbUser?.id,
      action: 'STATUS_CHANGE',
      entity: 'Project',
      entityId: data.id,
      details: JSON.stringify({ status: data.status, category: data.category, reason: data.reason || data.blockReason })
    })

    revalidatePath('/proyectos')
    revalidatePath(`/proyectos/${data.id}`)
    revalidatePath('/analiticas')
    return { success: true }
  } catch (error) {
    if (error instanceof Error && error.message.includes('permisos')) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'No se pudo actualizar el estado. Intente de nuevo.' }
  }
}

export async function addProjectNote(projectId: string, content: string, author: string) {
  try {
    await requireRole(ACTIVE_ROLES)
    await prisma.projectNote.create({
      data: { projectId, content, author }
    })
    revalidatePath('/visor')
    revalidatePath('/proyectos')
    revalidatePath(`/proyectos/${projectId}`)
    return { success: true }
  } catch (error) {
    if (error instanceof Error && error.message.includes('permisos')) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Error al agregar la nota rápida.' }
  }
}

export async function updateProjectBudget(id: string, budget: number) {
  try {
    await requireRole(['ADMIN', 'GERENTE'])
    await prisma.project.update({
      where: { id },
      data: { budget }
    })
    await logAudit({
      action: 'UPDATE_BUDGET',
      entity: 'Project',
      entityId: id,
      details: JSON.stringify({ budget })
    })
    revalidatePath(`/proyectos/${id}`)
    return { success: true }
  } catch (error) {
    return { success: false, error: 'No se pudo actualizar el presupuesto.' }
  }
}

export async function updateProjectContractAmount(projectId: string, contractAmount: number) {
  try {
    await requireRole(['ADMIN', 'GERENTE'])
    const valid = updateProjectContractAmountSchema.parse({ projectId, contractAmount })
    await prisma.project.update({
      where: { id: valid.projectId },
      data: { contractAmount: valid.contractAmount }
    })
    await logAudit({
      action: 'UPDATE_CONTRACT_AMOUNT',
      entity: 'Project',
      entityId: projectId,
      details: JSON.stringify({ contractAmount: valid.contractAmount })
    })
    revalidatePath(`/proyectos/${projectId}`)
    revalidatePath('/analiticas')
    return { success: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Monto inválido.' }
    }
    if (error instanceof Error && error.message.includes('permisos')) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'No se pudo actualizar el monto contratado.' }
  }
}

export async function assignTeamMember(projectId: string, userId: string) {
  try {
    await requireRole(['ADMIN', 'GERENTE'])
    await prisma.project.update({
      where: { id: projectId },
      data: {
        team: { connect: { id: userId } }
      }
    })
    await logAudit({
      action: 'ASSIGN_TEAM',
      entity: 'Project',
      entityId: projectId,
      details: JSON.stringify({ userId })
    })
    revalidatePath(`/proyectos/${projectId}`)
    return { success: true }
  } catch (error) {
    return { success: false, error: 'No se pudo asignar el miembro.' }
  }
}

export async function removeTeamMember(projectId: string, userId: string) {
  try {
    await requireRole(['ADMIN', 'GERENTE'])
    await prisma.project.update({
      where: { id: projectId },
      data: {
        team: { disconnect: { id: userId } }
      }
    })
    await logAudit({
      action: 'REMOVE_TEAM',
      entity: 'Project',
      entityId: projectId,
      details: JSON.stringify({ userId })
    })
    revalidatePath(`/proyectos/${projectId}`)
    return { success: true }
  } catch (error) {
    if (error instanceof Error && error.message.includes('permisos')) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'No se pudo remover el miembro.' }
  }
}

export async function addProjectDepartment(projectId: string, name: string) {
  try {
    await requireRole(['ADMIN', 'GERENTE'])
    const trimmed = name.trim()
    if (!trimmed) return { success: false, error: 'Nombre de departamento requerido.' }

    const existing = await prisma.projectDepartment.findUnique({
      where: { projectId_name: { projectId, name: trimmed } }
    })
    if (existing) {
      return { success: false, error: `El departamento "${trimmed}" ya existe en este proyecto.` }
    }

    const dept = await prisma.projectDepartment.create({
      data: {
        projectId,
        name: trimmed,
        progress: 0,
        status: 'NORMAL'
      }
    })

    await logAudit({
      action: 'ADD_PROJECT_DEPARTMENT',
      entity: 'Project',
      entityId: projectId,
      details: JSON.stringify({ departmentName: trimmed })
    })

    revalidatePath(`/proyectos/${projectId}`)
    return { success: true, department: { ...dept, tasks: [] } }
  } catch (error) {
    if (error instanceof Error && error.message.includes('permisos')) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'No se pudo crear el departamento.' }
  }
}

export async function deleteProjectDepartment(projectId: string, departmentId: string) {
  try {
    await requireRole(['ADMIN', 'GERENTE'])
    await prisma.projectDepartment.delete({
      where: { id: departmentId }
    })

    const depts = await prisma.projectDepartment.findMany({ where: { projectId } })
    const newProgress = depts.length === 0 ? 0 : Math.round(depts.reduce((s, d) => s + d.progress, 0) / depts.length)
    await prisma.project.update({ where: { id: projectId }, data: { progress: newProgress } })

    await logAudit({
      action: 'DELETE_PROJECT_DEPARTMENT',
      entity: 'Project',
      entityId: projectId,
      details: JSON.stringify({ departmentId })
    })

    revalidatePath(`/proyectos/${projectId}`)
    return { success: true }
  } catch (error) {
    if (error instanceof Error && error.message.includes('permisos')) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'No se pudo eliminar el departamento.' }
  }
}


