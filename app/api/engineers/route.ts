
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withPermission } from "@/lib/rbac/server"

export async function GET() {
  return withPermission('support:read', async () => {
    const engineers = await prisma.user.findMany({
      where: {
        role: "SERVICE_ENGINEER",
        approved: true,
      },
      select: {
        id: true,
        name: true,
        region: true,
      },
      orderBy: {
        name: 'asc',
      },
    })

    return NextResponse.json(engineers)
  })
} 