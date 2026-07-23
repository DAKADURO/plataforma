import { describe, it, expect, vi, beforeEach } from 'vitest'

const getUser = vi.fn()
const findUnique = vi.fn()

vi.mock('@/lib/supabase-server', () => ({
  createSupabaseServerClient: async () => ({
    auth: { getUser },
  }),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findUnique },
  },
}))

const { getCurrentUserRole, requireRole } = await import('@/lib/auth')

describe('getCurrentUserRole', () => {
  beforeEach(() => {
    getUser.mockReset()
    findUnique.mockReset()
  })

  it('returns null when there is no authenticated user', async () => {
    getUser.mockResolvedValue({ data: { user: null } })
    expect(await getCurrentUserRole()).toBeNull()
    expect(findUnique).not.toHaveBeenCalled()
  })

  it('returns the role stored in the database for the session email', async () => {
    getUser.mockResolvedValue({ data: { user: { email: 'jefe@empresa.com' } } })
    findUnique.mockResolvedValue({ role: 'ADMIN' })
    expect(await getCurrentUserRole()).toBe('ADMIN')
    expect(findUnique).toHaveBeenCalledWith({ where: { email: 'jefe@empresa.com' } })
  })

  it('returns null when the session email has no matching User row', async () => {
    getUser.mockResolvedValue({ data: { user: { email: 'fantasma@empresa.com' } } })
    findUnique.mockResolvedValue(null)
    expect(await getCurrentUserRole()).toBeNull()
  })

  it('fails closed (returns null) instead of throwing when the lookup errors', async () => {
    getUser.mockRejectedValue(new Error('supabase down'))
    expect(await getCurrentUserRole()).toBeNull()
  })
})

describe('requireRole', () => {
  beforeEach(() => {
    getUser.mockReset()
    findUnique.mockReset()
  })

  it('throws when the user has no role (unauthenticated or unknown)', async () => {
    getUser.mockResolvedValue({ data: { user: null } })
    await expect(requireRole(['ADMIN'])).rejects.toThrow(/permisos/)
  })

  it('throws when the user role is PENDIENTE and PENDIENTE is not allowed', async () => {
    getUser.mockResolvedValue({ data: { user: { email: 'nuevo@empresa.com' } } })
    findUnique.mockResolvedValue({ role: 'PENDIENTE' })
    await expect(requireRole(['ADMIN', 'GERENTE', 'TECNICO'])).rejects.toThrow(/permisos/)
  })

  it('resolves with the role when it is in the allowed list', async () => {
    getUser.mockResolvedValue({ data: { user: { email: 'tecnico@empresa.com' } } })
    findUnique.mockResolvedValue({ role: 'TECNICO' })
    await expect(requireRole(['ADMIN', 'GERENTE', 'TECNICO'])).resolves.toBe('TECNICO')
  })
})
