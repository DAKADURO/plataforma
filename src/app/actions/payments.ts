'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/auth'
import { createProjectPaymentSchema } from '@/lib/validations'
import { z } from 'zod'

// Los cobros son información financiera sensible: solo ADMIN/GERENTE los gestionan.
const FINANCE_ROLES = ['ADMIN', 'GERENTE']

export async function addPayment(data: { projectId: string, concept: string, amount: number, dueDate?: string | Date, notes?: string }) {
  try {
    await requireRole(FINANCE_ROLES)
    const validData = createProjectPaymentSchema.parse(data)

    const payment = await prisma.projectPayment.create({
      data: {
        projectId: validData.projectId,
        concept: validData.concept,
        amount: validData.amount,
        dueDate: validData.dueDate || null,
        notes: validData.notes || null
      }
    })

    revalidatePath(`/proyectos/${validData.projectId}`)
    revalidatePath('/analiticas')
    return { success: true, payment }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0]?.message || 'Datos de cobro inválidos.' }
    }
    if (error instanceof Error && error.message.includes('permisos')) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'No se pudo registrar el cobro. Intente de nuevo.' }
  }
}

export async function markPaymentPaid(paymentId: string, projectId: string, paidDate: string | Date = new Date()) {
  try {
    await requireRole(FINANCE_ROLES)
    await prisma.projectPayment.update({
      where: { id: paymentId },
      data: { status: 'PAGADO', paidDate: new Date(paidDate) }
    })
    revalidatePath(`/proyectos/${projectId}`)
    revalidatePath('/analiticas')
    return { success: true }
  } catch (error) {
    if (error instanceof Error && error.message.includes('permisos')) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'No se pudo actualizar el cobro.' }
  }
}

export async function markPaymentPending(paymentId: string, projectId: string) {
  try {
    await requireRole(FINANCE_ROLES)
    await prisma.projectPayment.update({
      where: { id: paymentId },
      data: { status: 'PENDIENTE', paidDate: null }
    })
    revalidatePath(`/proyectos/${projectId}`)
    revalidatePath('/analiticas')
    return { success: true }
  } catch (error) {
    if (error instanceof Error && error.message.includes('permisos')) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'No se pudo actualizar el cobro.' }
  }
}

export async function deletePayment(paymentId: string, projectId: string) {
  try {
    await requireRole(FINANCE_ROLES)
    await prisma.projectPayment.delete({ where: { id: paymentId } })
    revalidatePath(`/proyectos/${projectId}`)
    revalidatePath('/analiticas')
    return { success: true }
  } catch (error) {
    if (error instanceof Error && error.message.includes('permisos')) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'No se pudo eliminar el cobro.' }
  }
}

// Vista global de cuentas por cobrar de toda la empresa (Analíticas)
export async function getAccountsReceivable() {
  try {
    await requireRole(FINANCE_ROLES)

    const pending = await prisma.projectPayment.findMany({
      where: { status: 'PENDIENTE' },
      include: { project: { select: { id: true, name: true, client: { select: { name: true } } } } },
      orderBy: { dueDate: 'asc' }
    })

    const totalPending = pending.reduce((sum, p) => sum + p.amount, 0)
    const overdue = pending.filter(p => p.dueDate && p.dueDate < new Date())
    const totalOverdue = overdue.reduce((sum, p) => sum + p.amount, 0)

    return {
      success: true,
      summary: {
        totalPending,
        totalOverdue,
        overdueCount: overdue.length,
        pending
      }
    }
  } catch (error) {
    return { success: false, error: 'No se pudo obtener cuentas por cobrar.', summary: null }
  }
}

function daysBetweenUTC(start: Date, end: Date): number {
  const sUTC = Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate())
  const eUTC = Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate())
  return Math.max(1, Math.round((eUTC - sUTC) / (1000 * 60 * 60 * 24)) + 1)
}

// Margen bruto por proyecto y promedio de la empresa (Analíticas). Solo considera
// proyectos con monto contratado > 0 (sin eso el margen no tiene sentido).
export async function getProjectsMarginSummary() {
  try {
    await requireRole(FINANCE_ROLES)

    const projects = await prisma.project.findMany({
      where: { contractAmount: { gt: 0 } },
      select: {
        id: true,
        name: true,
        contractAmount: true,
        inventory: { select: { quantity: true, product: { select: { cost: true } } } },
        workLogs: { select: { hours: true, hourlyCostSnapshot: true } },
        machineAssignments: { select: { startDate: true, endDate: true, dailyRateSnapshot: true } }
      }
    })

    const results = projects.map(p => {
      const materialCost = p.inventory.reduce((sum, i) => sum + i.quantity * (i.product?.cost || 0), 0)
      const laborCost = p.workLogs.reduce((sum, w) => sum + w.hours * w.hourlyCostSnapshot, 0)
      const machineCost = p.machineAssignments.reduce(
        (sum, a) => sum + daysBetweenUTC(a.startDate, a.endDate || new Date()) * a.dailyRateSnapshot, 0
      )
      const totalCost = materialCost + laborCost + machineCost
      const margin = ((p.contractAmount - totalCost) / p.contractAmount) * 100
      return { id: p.id, name: p.name, contractAmount: p.contractAmount, totalCost, margin }
    })

    const avgMargin = results.length > 0 ? results.reduce((sum, r) => sum + r.margin, 0) / results.length : null
    const lowMargin = results.filter(r => r.margin < 20).sort((a, b) => a.margin - b.margin)

    return { success: true, summary: { avgMargin, lowMargin, total: results.length } }
  } catch (error) {
    return { success: false, error: 'No se pudo calcular márgenes.', summary: null }
  }
}
