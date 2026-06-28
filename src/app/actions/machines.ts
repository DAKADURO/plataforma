'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/auth'

const ACTIVE_ROLES = ['ADMIN', 'GERENTE', 'TECNICO']

export async function getMachines() {
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
}

export async function createMachine(data: { name: string, serialNumber: string, brand?: string, model?: string }) {
  await requireRole(['ADMIN', 'GERENTE'])
  try {
    await prisma.machine.create({ data })
    revalidatePath('/maquinas')
    return { success: true }
  } catch (error) {
    return { success: false, error: 'No se pudo crear la máquina. El número de serie podría estar duplicado.' }
  }
}

export async function addMachineMaterial(machineId: string, productId: string, quantity: number) {
  await requireRole(['ADMIN', 'GERENTE'])
  try {
    await prisma.machineMaterial.create({
      data: { machineId, productId, quantity }
    })
    revalidatePath('/maquinas')
    return { success: true }
  } catch (error) {
    return { success: false, error: 'Error al vincular el material.' }
  }
}

export async function addMaintenanceLog(data: { machineId: string, type: string, description: string, performedBy: string }) {
  await requireRole(ACTIVE_ROLES)
  try {
    await prisma.maintenanceLog.create({ data })
    // Optionally update machine status to ACTIVA if it was MANTENIMIENTO
    revalidatePath('/maquinas')
    return { success: true }
  } catch (error) {
    return { success: false, error: 'Error al registrar el mantenimiento.' }
  }
}
