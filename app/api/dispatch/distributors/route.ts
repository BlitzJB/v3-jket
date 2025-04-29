
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withPermission } from "@/lib/rbac/server"

export async function GET() {
  return withPermission('dispatch:read', async () => {
    try {
      // Get all users with DISTRIBUTOR role
      const distributors = await prisma.user.findMany({
        where: {
          role: 'DISTRIBUTOR',
          approved: true,
        },
        select: {
          id: true,
          name: true,
          organizationName: true,
          region: true,
        },
        orderBy: {
          organizationName: 'asc',
        },
      })

      return NextResponse.json(distributors)
    } catch (error) {
      console.error("[DISTRIBUTORS_GET]", error)
      return new NextResponse("Internal error", { status: 500 })
    }
  })
} 