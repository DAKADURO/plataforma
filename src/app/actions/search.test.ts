import { describe, it, expect, vi, beforeEach } from 'vitest'

const getCurrentUserRole = vi.fn()
const clientFindMany = vi.fn()
const projectFindMany = vi.fn()
const productFindMany = vi.fn()
const machineFindMany = vi.fn()

vi.mock('@/lib/auth', () => ({ getCurrentUserRole }))
vi.mock('@/lib/prisma', () => ({
  prisma: {
    client: { findMany: clientFindMany },
    project: { findMany: projectFindMany },
    product: { findMany: productFindMany },
    machine: { findMany: machineFindMany },
  },
}))

const { globalSearch } = await import('./search')

describe('globalSearch role gating', () => {
  beforeEach(() => {
    getCurrentUserRole.mockReset()
    clientFindMany.mockReset()
    projectFindMany.mockReset()
    productFindMany.mockReset()
    machineFindMany.mockReset()
  })

  it('returns nothing for unauthenticated users', async () => {
    getCurrentUserRole.mockResolvedValue(null)
    expect(await globalSearch('acme')).toEqual([])
    expect(clientFindMany).not.toHaveBeenCalled()
  })

  it('returns nothing for PENDIENTE users even though they have a role row (regression for SEC-FIX #7)', async () => {
    getCurrentUserRole.mockResolvedValue('PENDIENTE')
    expect(await globalSearch('acme')).toEqual([])
    expect(clientFindMany).not.toHaveBeenCalled()
    expect(projectFindMany).not.toHaveBeenCalled()
  })

  it('runs the search for active roles', async () => {
    getCurrentUserRole.mockResolvedValue('TECNICO')
    clientFindMany.mockResolvedValue([])
    projectFindMany.mockResolvedValue([])
    productFindMany.mockResolvedValue([])
    machineFindMany.mockResolvedValue([])

    const results = await globalSearch('acme')

    expect(results).toEqual([])
    expect(clientFindMany).toHaveBeenCalled()
    expect(projectFindMany).toHaveBeenCalled()
    expect(productFindMany).toHaveBeenCalled()
    expect(machineFindMany).toHaveBeenCalled()
  })

  it('ignores queries shorter than 2 characters', async () => {
    getCurrentUserRole.mockResolvedValue('ADMIN')
    expect(await globalSearch('a')).toEqual([])
    expect(clientFindMany).not.toHaveBeenCalled()
  })
})
