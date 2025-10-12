
import { NextRequest } from "next/server"
import { withPermission } from "@/lib/rbac/server"
import { prisma } from "@/lib/prisma"
import { decryptPassword } from "@/lib/crypto/edge-encryption"
import { render } from "@react-email/render"
import { WelcomeEmail } from "@/components/emails/welcome-email"
import { transporter, emailConfig } from "@/lib/email/config"
import { createElement } from "react"

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  return withPermission("users:approve", async () => {
    const { userId } = await params
    const { approved } = await req.json()

    // Get user with encrypted password before updating
    const userBeforeUpdate = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        encryptedTemporaryPassword: true,
        name: true,
        email: true,
      },
    })

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        approved,
        // Clear the temporary password after approval
        encryptedTemporaryPassword: approved ? null : undefined,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        approved: true,
        phoneNumber: true,
        region: true,
        organizationName: true,
      },
    })

    // Send welcome email if user is being approved and has encrypted password
    if (approved && userBeforeUpdate?.encryptedTemporaryPassword) {
      try {
        const decryptedPassword = await decryptPassword(userBeforeUpdate.encryptedTemporaryPassword)
        const loginUrl = 'https://care.jket.in/auth/login'
        const emailHtml = await render(
          createElement(WelcomeEmail, {
            name: userBeforeUpdate.name || 'User',
            email: userBeforeUpdate.email || '',
            password: decryptedPassword,
            loginUrl: loginUrl,
          })
        )

        await transporter.sendMail({
          from: emailConfig.from,
          to: userBeforeUpdate.email || '',
          subject: 'Welcome to JKET Prime Care - Your Login Credentials',
          html: emailHtml,
        })
      } catch (emailError) {
        console.error('Failed to send welcome email:', emailError)
        // Don't fail the request if email sending fails
      }
    }

    return Response.json(user)
  })
} 