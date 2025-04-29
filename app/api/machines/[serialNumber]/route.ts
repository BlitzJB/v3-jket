
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ serialNumber: string }> }
) {
    const { serialNumber } = await params
  try {
    const machine = await prisma.machine.findFirst({
      where: {
        serialNumber: serialNumber,
      },
      include: {
        machineModel: {
          select: {
            id: true,
            name: true,
            shortCode: true,
            description: true,
            warrantyPeriodMonths: true,
            coverImageUrl: true,
            catalogueFileUrl: true,
            userManualFileUrl: true,
            category: true,
          },
        },
        supply: {
          include: {
            distributor: {
              select: {
                organizationName: true,
                region: true
              }
            }
          }
        },
        sale: true,
        warrantyCertificate: true,
        serviceRequests: {
          include: {
            serviceVisit: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    })

    if (!machine) {
      return new NextResponse("Machine not found", { status: 404 })
    }

    return NextResponse.json(machine)
  } catch (error) {
    console.error("[MACHINE_GET]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
} 