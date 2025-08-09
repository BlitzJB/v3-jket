
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withPermission } from "@/lib/rbac/server"

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  return withPermission("users:approve", async () => {
    try {
      const { userId } = await params
      const { approved } = await req.json()

      const user = await prisma.user.update({
        where: { id: userId },
        data: { approved },
        select: {
          id: true,
          approved: true,
        },
      })

      return NextResponse.json(user)
    } catch (error) {
      console.error("[USER_APPROVE]", error)
      return new NextResponse("Internal error", { status: 500 })
    }
  })
} 