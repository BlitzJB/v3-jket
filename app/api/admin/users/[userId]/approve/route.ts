
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

    // Use atomic update to prevent race conditions
    // Only update if not already approved (when approving)
    const user = await prisma.user.update({
      where: {
        id: userId,
        ...(approved && { approved: false }), // Only update if not already approved
      },
      data: {
        approved,
        // Clear the temporary password after approval
        ...(approved && { encryptedTemporaryPassword: null }),
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
        encryptedTemporaryPassword: true, // Get encrypted password in the same query
      },
    })

    // Send welcome email if user is being approved and has encrypted password
    if (approved && user.encryptedTemporaryPassword) {
      // Validate required fields exist before attempting to send email
      if (!user.email || !user.name) {
        console.error('Cannot send welcome email: missing user email or name')
        // Return success but skip email
        const { encryptedTemporaryPassword, ...userWithoutPassword } = user
        return Response.json(userWithoutPassword)
      }

      try {
        const decryptedPassword = await decryptPassword(user.encryptedTemporaryPassword)
        const loginUrl = 'https://care.jket.in/auth/login'
        const emailHtml = await render(
          createElement(WelcomeEmail, {
            name: user.name,
            email: user.email,
            password: decryptedPassword,
            loginUrl: loginUrl,
          })
        )

        await transporter.sendMail({
          from: emailConfig.from,
          to: user.email,
          subject: 'Welcome to JKET Prime Care - Your Login Credentials',
          html: emailHtml,
        })
      } catch (error) {
        console.error('Failed to decrypt password or send welcome email:', error)
        // Don't fail the request if decryption or email sending fails
      }
    }

    // Remove encryptedTemporaryPassword from response
    const { encryptedTemporaryPassword, ...userWithoutPassword } = user
    return Response.json(userWithoutPassword)
  })
} 