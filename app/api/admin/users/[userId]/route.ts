
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { withPermission } from '@/lib/rbac/server'
import { z } from 'zod'

const updateUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'QUALITY_TESTING', 'DISPATCH_MANAGER', 'MANUFACTURER', 'DISTRIBUTOR', 'SERVICE_ENGINEER', 'CUSTOMER_SERVICE', 'SALES', 'USER', 'GUEST']),
  phoneNumber: z.string().optional(),
  region: z.string().optional(),
  organizationName: z.string().optional(),
  password: z.string().min(8).optional(),
})

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    return withPermission('users:read', async () => {
      const { userId } = await params
      const user = await prisma.user.findUnique({
        where: { id: userId },
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

      if (!user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        )
      }

      return NextResponse.json(user)
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const json = await request.json()
    const body = updateUserSchema.parse(json)

    return withPermission('users:write', async () => {
      const { userId } = await params
      // Check if email is taken by another user
      if (body.email) {
        const exists = await prisma.user.findFirst({
          where: {
            email: body.email,
            NOT: {
              id: userId,
            },
          },
        })

        if (exists) {
          return NextResponse.json(
            { error: 'Email is already taken' },
            { status: 400 }
          )
        }
      }

      // Prepare update data
      const updateData: any = { ...body }
      if (body.password) {
        updateData.password = await bcrypt.hash(body.password, 12)
      } else {
        delete updateData.password
      }

      const user = await prisma.user.update({
        where: { id: userId },
        data: updateData,
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

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    return withPermission('users:delete', async () => {
      const { userId } = await params
      await prisma.user.delete({
        where: { id: userId },
      })

      return NextResponse.json({ success: true })
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    )
  }
} 