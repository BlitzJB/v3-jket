import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withPermission } from "@/lib/rbac/server"

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  return withPermission('service:write', async () => {
    const { status, notes } = await request.json()

    const visit = await prisma.serviceVisit.update({
      where: { id: params.id },
      data: {
        status,
        serviceVisitNotes: notes,
      },
    })

    return NextResponse.json(visit)
  })
} 