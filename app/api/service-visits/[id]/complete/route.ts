import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withPermission } from "@/lib/rbac/server"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return withPermission("support:write", async () => {
    try {
      const { id } = await params
      const { typeOfIssue, totalCost } = await req.json()

      // Update service visit
      const serviceVisit = await prisma.serviceVisit.update({
        where: { id },
        data: {
          status: 'CLOSED',
          typeOfIssue,
          totalCost,
        },
      })

      return NextResponse.json(serviceVisit)
    } catch (error) {
      console.error("[SERVICE_VISIT_COMPLETE]", error)
      return new NextResponse("Internal error", { status: 500 })
    }
  })
} 