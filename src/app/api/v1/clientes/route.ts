import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClientSchema } from '@/lib/validations'
import { z } from 'zod'

// Require API Key for these endpoints (simplified for demo)
const checkApiKey = (request: Request) => {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.API_SECRET_KEY}`) {
    return false
  }
  return true
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
