/* eslint-disable @typescript-eslint/no-unused-vars */
'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/auth'
import { createClientSchema, createProjectSchema, updateProjectContractAmountSchema } from '@/lib/validations'
import { z } from 'zod'

// [SEC-FIX #1] Proteger lecturas: usuarios con rol PENDIENTE no tienen acceso a datos
const ACTIVE_ROLES = ['ADMIN', 'GERENTE', 'TECNICO']

export async function getProjects() {
  await requireRole(ACTIVE_ROLES)
  return await prisma.project.findMany({
    include: {
      client: true,
      departments: {
        include: {
          tasks: {
            select: { status: true }
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
  return await prisma.project.findUnique({
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
      }
    }
  })
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
    await prisma.project.create({ 
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
    // [SEC-FIX #5] Sanitizar errores internos de Prisma/BD
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
    revalidatePath(`/proyectos/${projectId}`)
    return { success: true }
  } catch (error) {
    if (error instanceof Error && error.message.includes('permisos')) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'No se pudo remover el miembro.' }
  }
}
