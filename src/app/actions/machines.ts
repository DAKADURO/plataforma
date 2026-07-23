/* eslint-disable @typescript-eslint/no-unused-vars */
'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/auth'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { createMachineSchema } from '@/lib/validations'
import { z } from 'zod'

const ACTIVE_ROLES = ['ADMIN', 'GERENTE', 'TECNICO']

export async function getMachines() {
  try {
    await requireRole(ACTIVE_ROLES)
    return await prisma.machine.findMany({
      orderBy: { name: 'asc' },
      include: {
        materials: {
          include: { product: true }
        },
        documents: true,
        maintenances: {
          orderBy: { date: 'desc' }
        }
      }
    })
  } catch (error) {
    // [SEC-FIX #8] No dejar que un rol insuficiente (ej. PENDIENTE) tumbe la página
    // con una excepción no controlada; devolver lista vacía como el resto de lecturas.
    return []
  }
}

export async function createMachine(data: { name: string, serialNumber: string, category: string, brand?: string, model?: string, imageUrl?: string, isImported?: boolean }) {
  try {
    await requireRole(['ADMIN', 'GERENTE'])
    const validData = createMachineSchema.parse(data)
    await prisma.machine.create({ data: validData })
    revalidatePath('/maquinas')
    return { success: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Datos de la máquina inválidos.' }
    }
    if (error instanceof Error && error.message.includes('permisos')) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'No se pudo crear la máquina. El número de serie podría estar duplicado.' }
  }
}

export async function addMachineMaterial(machineId: string, productId: string | undefined, name: string | undefined, quantity: number) {
  try {
    await requireRole(['ADMIN', 'GERENTE'])

    if (!Number.isFinite(quantity) || quantity <= 0) {
      return { success: false, error: 'La cantidad debe ser un número positivo mayor a cero.' }
    }

    await prisma.machineMaterial.create({
      data: { machineId, productId: productId || null, name: name || null, quantity }
    })
    revalidatePath('/maquinas')
    return { success: true }
  } catch (error) {
    if (error instanceof Error && error.message.includes('permisos')) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Error al vincular el material.' }
  }
}

export async function addMaintenanceLog(data: { machineId: string, type: string, description: string }) {
  try {
    await requireRole(ACTIVE_ROLES)

    // [SEC-FIX] performedBy ya NO se acepta del cliente — se resuelve en el servidor
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.email) {
      return { success: false, error: 'No se pudo verificar la identidad del usuario.' }
    }

    await prisma.maintenanceLog.create({ data: { ...data, performedBy: user.email } })
    // Optionally update machine status to ACTIVA if it was MANTENIMIENTO
    revalidatePath('/maquinas')
    return { success: true }
  } catch (error) {
    if (error instanceof Error && error.message.includes('permisos')) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Error al registrar el mantenimiento.' }
  }
}
