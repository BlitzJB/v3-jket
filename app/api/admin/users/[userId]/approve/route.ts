
import { NextRequest } from "next/server"
import { withPermission } from "@/lib/rbac/server"
import { prisma } from "@/lib/prisma"

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  return withPermission("users:write", async () => {
    const { userId } = await params
    const { approved } = await req.json()

    const user = await prisma.user.update({
      where: { id: userId },
      data: { approved },
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

    return Response.json(user)
  })
} 