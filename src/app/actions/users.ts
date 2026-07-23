/* eslint-disable @typescript-eslint/no-unused-vars */
'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/auth'
import { updateUserRoleSchema } from '@/lib/validations'
import { z } from 'zod'

export async function getUsers() {
  await requireRole(['ADMIN'])

  return await prisma.user.findMany({
    orderBy: { email: 'asc' }
  })
}

export async function updateUserRole(userId: string, newRole: string) {
  try {
    await requireRole(['ADMIN'])
    // [SEC-FIX #9] Validar el rol contra el enum real en vez de aceptar cualquier string
    const { userId: validUserId, newRole: validRole } = updateUserRoleSchema.parse({ userId, newRole })

    await prisma.user.update({
      where: { id: validUserId },
      data: { role: validRole }
    })

    revalidatePath('/usuarios')
    return { success: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Datos inválidos.' }
    }
    if (error instanceof Error && error.message.includes('permisos')) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'No se pudo actualizar el rol.' }
  }
}

export async function registerUserInDb(email: string) {
  try {
    const existing = await prisma.user.findUnique({ where: { email } })
    if (!existing) {
      await prisma.user.create({
        data: {
          email,
          role: 'PENDIENTE'
        }
      })
    }
    return { success: true }
  } catch (error) {
    return { success: false }
  }
}
