
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const setupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
})

export async function POST(request: Request) {
  try {
    // Check if any super admin exists
    const existingSuperAdmin = await prisma.user.findFirst({
      where: { role: 'SUPER_ADMIN' }
    })

    if (existingSuperAdmin) {
      return NextResponse.json(
        { error: 'Super admin user already exists' },
        { status: 400 }
      )
    }

    const json = await request.json()
    const body = setupSchema.parse(json)

    // Check if email is already in use
    const existingUser = await prisma.user.findUnique({
      where: { email: body.email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      )
    }

    const hashedPassword = await bcrypt.hash(body.password, 12)

    // Create super admin user
    const superAdmin = await prisma.user.create({
      data: {
        email: body.email,
        password: hashedPassword,
        name: body.name,
        role: 'SUPER_ADMIN',
        approved: true,
        emailVerified: new Date(),
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        approved: true,
        emailVerified: true,
      },
    })

    return NextResponse.json(superAdmin)
  } catch (error) {
    console.error('[SETUP_ERROR]', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to setup super admin' },
      { status: 500 }
    )
  }
} 