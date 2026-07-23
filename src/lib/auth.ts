import { createSupabaseServerClient } from './supabase-server'
import { prisma } from './prisma'

export async function getCurrentUserRole() {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || !user.email) return null

    const dbUser = await prisma.user.findUnique({
      where: { email: user.email }
    })

    return dbUser?.role || null
  } catch {
    return null
  }
}

export async function requireRole(allowedRoles: string[]) {
  const role = await getCurrentUserRole()
  if (!role || !allowedRoles.includes(role)) {
    throw new Error('No tienes permisos suficientes para realizar esta acción.')
  }
  return role
}
