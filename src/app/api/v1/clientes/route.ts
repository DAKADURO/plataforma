import { NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import { prisma } from '@/lib/prisma'
import { createClientSchema } from '@/lib/validations'
import { z } from 'zod'

// Require API Key for these endpoints
const checkApiKey = (request: Request) => {
  const secret = process.env.API_SECRET_KEY
  // [SEC-FIX #6] Fail-closed: sin secreto configurado, la ruta se deniega siempre
  // (antes comparaba contra "Bearer undefined", lo que la dejaba abierta a cualquiera
  // que enviara ese literal si la variable de entorno no estaba definida).
  if (!secret) return false

  const authHeader = request.headers.get('authorization') ?? ''
  const expected = Buffer.from(`Bearer ${secret}`)
  const actual = Buffer.from(authHeader)
  if (actual.length !== expected.length) return false

  return timingSafeEqual(actual, expected)
}

export async function GET(request: Request) {
  if (!checkApiKey(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const clientes = await prisma.client.findMany({
    orderBy: { name: 'asc' }
  })

  return NextResponse.json({ data: clientes })
}

export async function POST(request: Request) {
  if (!checkApiKey(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const validData = createClientSchema.parse(body)

    const client = await prisma.client.create({ data: validData })

    return NextResponse.json({ data: client }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
