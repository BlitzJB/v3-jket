import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { withPermission } from '@/lib/rbac/server'
import { ROLES } from '@/lib/rbac/roles'
import { z } from 'zod'
import { render } from '@react-email/render'
import { WelcomeEmail } from '@/components/emails/welcome-email'
import { transporter, emailConfig } from '@/lib/email/config'
import { createElement } from 'react'

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'QUALITY_TESTING', 'DISPATCH_MANAGER', 'MANUFACTURER', 'DISTRIBUTOR', 'SERVICE_ENGINEER', 'CUSTOMER_SERVICE', 'SALES', 'USER', 'GUEST']),
  phoneNumber: z.string().optional(),
  region: z.string().optional(),
  organizationName: z.string().optional(),
})

export async function POST(request: Request) {
  try {
    const json = await request.json()
    const body = createUserSchema.parse(json)

    return withPermission('users:write', async () => {
      const exists = await prisma.user.findUnique({
        where: { email: body.email },
      })

      if (exists) {
        return NextResponse.json(
          { error: 'User with this email already exists' },
          { status: 400 }
        )
      }

      const hashedPassword = await bcrypt.hash(body.password, 12)

      const user = await prisma.user.create({
        data: {
          ...body,
          password: hashedPassword,
          approved: true, // Auto-approve users created by admin
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          phoneNumber: true,
          region: true,
          organizationName: true,
          approved: true,
          emailVerified: true,
        },
      })

      // Send welcome email
      try {
        const loginUrl = 'https://care.jket.in/auth/login'
        const emailHtml = await render(
          createElement(WelcomeEmail, {
            name: body.name,
            email: body.email,
            password: body.password, // Send the original (non-hashed) password
            loginUrl: loginUrl,
          })
        )

        await transporter.sendMail({
          from: emailConfig.from,
          to: body.email,
          subject: 'Welcome to JKET Prime Care - Your Login Credentials',
          html: emailHtml,
        })
      } catch (emailError) {
        console.error('Failed to send welcome email:', emailError)
        // Don't fail the request if email sending fails
      }

      return NextResponse.json(user)
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' + error },
      { status: 500 }
    )
  }
} 