import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withPermission } from "@/lib/rbac/server"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withPermission('support:write', async () => {
    const { id } = await params
    const { engineerId, serviceVisitDate, typeOfIssue, customerSupportNotes } = await req.json()

    // Validate request exists
    const request = await prisma.serviceRequest.findUnique({
      where: { id },
      include: {
        serviceVisit: true,
      },
    })

    if (!request) {
      return new NextResponse('Service request not found', { status: 404 })
    }

    if (request.serviceVisit) {
      return new NextResponse('Service visit already exists for this request', { status: 400 })
    }

    // Create service visit
    const visit = await prisma.serviceVisit.create({
      data: {
        serviceRequest: {
          connect: { id },
        },
        engineer: {
          connect: { id: engineerId },
        },
        serviceVisitDate: new Date(serviceVisitDate),
        typeOfIssue,
        customerSupportNotes,
        status: 'PENDING',
      },
    })

    return NextResponse.json(visit)
  })
} 