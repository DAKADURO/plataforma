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
