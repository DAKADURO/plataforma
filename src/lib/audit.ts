import { prisma } from '@/lib/prisma'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function logAudit({
  userId,
  action,
  entity,
  entityId,
  details,
}: {
  userId?: string
  action: string
  entity: string
  entityId?: string
  details?: string
}) {
  try {
    let resolvedUserId = userId
    if (!resolvedUserId) {
      const supabase = await createSupabaseServerClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email },
          select: { id: true }
        })
        resolvedUserId = dbUser?.id
      }
    }

    if (!resolvedUserId) return

    await prisma.auditLog.create({
      data: {
        userId: resolvedUserId,
        action,
        entity,
        entityId,
        details,
      }
    })
  } catch (error) {
    // Fail silently in audit log to not interrupt main flow
    console.error('Audit logging failed:', error)
  }
}
