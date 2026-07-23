import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const clientFindMany = vi.fn()
const clientCreate = vi.fn()

vi.mock('@/lib/prisma', () => ({
  prisma: {
    client: { findMany: clientFindMany, create: clientCreate },
  },
}))

const { GET, POST } = await import('./route')

const ORIGINAL_ENV = process.env.API_SECRET_KEY

describe('/api/v1/clientes auth', () => {
  beforeEach(() => {
    clientFindMany.mockReset()
    clientCreate.mockReset()
  })

  afterEach(() => {
    if (ORIGINAL_ENV === undefined) delete process.env.API_SECRET_KEY
    else process.env.API_SECRET_KEY = ORIGINAL_ENV
  })

  it('fails closed when API_SECRET_KEY is not configured, even against the historical "Bearer undefined" bypass', async () => {
    delete process.env.API_SECRET_KEY
    const request = new Request('http://localhost/api/v1/clientes', {
      headers: { authorization: 'Bearer undefined' },
    })

    const response = await GET(request)

    expect(response.status).toBe(401)
    expect(clientFindMany).not.toHaveBeenCalled()
  })

  it('rejects requests with no Authorization header', async () => {
    process.env.API_SECRET_KEY = 'super-secret'
    const request = new Request('http://localhost/api/v1/clientes')

    const response = await GET(request)

    expect(response.status).toBe(401)
  })

  it('rejects an incorrect key', async () => {
    process.env.API_SECRET_KEY = 'super-secret'
    const request = new Request('http://localhost/api/v1/clientes', {
      headers: { authorization: 'Bearer wrong-key' },
    })

    const response = await GET(request)

    expect(response.status).toBe(401)
  })

  it('allows the correct key through', async () => {
    process.env.API_SECRET_KEY = 'super-secret'
    clientFindMany.mockResolvedValue([{ id: '1', name: 'Acme' }])
    const request = new Request('http://localhost/api/v1/clientes', {
      headers: { authorization: 'Bearer super-secret' },
    })

    const response = await GET(request)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.data).toHaveLength(1)
  })

  it('rejects POST with an invalid payload even with a valid key', async () => {
    process.env.API_SECRET_KEY = 'super-secret'
    const request = new Request('http://localhost/api/v1/clientes', {
      method: 'POST',
      headers: { authorization: 'Bearer super-secret', 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'A' }), // too short per createClientSchema
    })

    const response = await POST(request)

    expect(response.status).toBe(400)
    expect(clientCreate).not.toHaveBeenCalled()
  })
})
