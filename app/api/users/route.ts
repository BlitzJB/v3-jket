import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hash } from 'bcryptjs'
import { z } from 'zod'

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.string(),
  phoneNumber: z.string().optional(),
  region: z.string().optional(),
  organizationName: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { name, email, password, role, phoneNumber, region, organizationName } = body as FormValues

  const parsedBody = formSchema.safeParse(body)

  if (!parsedBody.success) {
    return NextResponse.json({ error: parsedBody.error.message }, { status: 400 })
  }

  const hashedPassword = await hash(password, 10)

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role,
      phoneNumber,
      region,
      organizationName,
    },
  })

  return NextResponse.json(user)
}

