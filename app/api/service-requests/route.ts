import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const { machineId, complaint } = await req.json()

    // Validate machine exists and has been sold
    const machine = await prisma.machine.findFirst({
      where: {
        id: machineId,
        sale: {
          isNot: null,
        },
      },
    })

    if (!machine) {
      return new NextResponse(
        "Machine not found or not eligible for service requests",
        { status: 404 }
      )
    }

    // Create service request
    const serviceRequest = await prisma.serviceRequest.create({
      data: {
        machineId,
        complaint,
      },
      include: {
        machine: {
          include: {
            machineModel: {
              include: {
                category: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json(serviceRequest)
  } catch (error) {
    console.error("[SERVICE_REQUEST_POST]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
} 