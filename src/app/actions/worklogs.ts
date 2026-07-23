'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/auth'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { createWorkLogSchema } from '@/lib/validations'
import { z } from 'zod'

const ACTIVE_ROLES = ['ADMIN', 'GERENTE', 'TECNICO']

export async function addWorkLog(data: { projectId: string, date: string | Date, hours: number, description?: string }) {
  try {
    await requireRole(ACTIVE_ROLES)
    const validData = createWorkLogSchema.parse(data)

    // La identidad se resuelve en el servidor — nunca se acepta del cliente
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.email) {
      return { success: false, error: 'No se pudo verificar la identidad del usuario.' }
    }
    const dbUser = await prisma.user.findUnique({ where: { email: user.email } })
    if (!dbUser) {
      return { success: false, error: 'Usuario no encontrado.' }
    }

    const workLog = await prisma.workLog.create({
      data: {
        projectId: validData.projectId,
        userId: dbUser.id,
        date: validData.date,
        hours: validData.hours,
        description: validData.description || null,
        hourlyCostSnapshot: dbUser.hourlyCost
      },
      include: { user: { select: { email: true } } }
    })

    revalidatePath(`/proyectos/${validData.projectId}`)
    return { success: true, workLog }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Datos del registro de horas inválidos.' }
    }
    if (error instanceof Error && error.message.includes('permisos')) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'No se pudo registrar las horas. Intente de nuevo.' }
  }
}

export async function deleteWorkLog(workLogId: string, projectId: string) {
  try {
    await requireRole(['ADMIN', 'GERENTE'])
    await prisma.workLog.delete({ where: { id: workLogId } })
    revalidatePath(`/proyectos/${projectId}`)
    return { success: true }
  } catch (error) {
    if (error instanceof Error && error.message.includes('permisos')) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'No se pudo eliminar el registro de horas.' }
  }
}
