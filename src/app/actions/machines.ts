/* eslint-disable @typescript-eslint/no-unused-vars */
'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/auth'

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

export async function createMachine(data: { name: string, serialNumber: string, category: string, brand?: string, model?: string, imageUrl?: string }) {
  try {
    await requireRole(['ADMIN', 'GERENTE'])
    await prisma.machine.create({ data })
    revalidatePath('/maquinas')
    return { success: true }
  } catch (error) {
    if (error instanceof Error && error.message.includes('permisos')) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'No se pudo crear la máquina. El número de serie podría estar duplicado.' }
  }
}

export async function addMachineMaterial(machineId: string, productId: string | undefined, name: string | undefined, quantity: number) {
  try {
    await requireRole(['ADMIN', 'GERENTE'])
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

export async function addMaintenanceLog(data: { machineId: string, type: string, description: string, performedBy: string }) {
  try {
    await requireRole(ACTIVE_ROLES)
    await prisma.maintenanceLog.create({ data })
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
