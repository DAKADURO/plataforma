'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/auth'

export async function getUsers() {
  await requireRole(['ADMIN'])
  
  return await prisma.user.findMany({
    orderBy: { email: 'asc' }
  })
}

export async function updateUserRole(userId: string, newRole: string) {
  await requireRole(['ADMIN'])

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { role: newRole }
    })
    
    revalidatePath('/usuarios')
    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido'
    return { success: false, error: message }
  }
}
