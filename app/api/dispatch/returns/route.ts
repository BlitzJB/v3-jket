import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withPermission } from "@/lib/rbac/server"

export async function POST(request: Request) {
  return withPermission('dispatch:write', async () => {
    try {
      const body = await request.json()
      const { machineId, returnDate, returnReason } = body

      // Check if machine exists and is supplied
      const machine = await prisma.machine.findUnique({
        where: { id: machineId },
        include: {
          supply: true,
          return: true,
        },
      })

      if (!machine) {
        return new NextResponse("Machine not found", { status: 404 })
      }

      if (!machine.supply) {
        return new NextResponse(
          "Machine has not been supplied",
          { status: 400 }
        )
      }

      if (machine.return) {
        return new NextResponse(
          "Machine has already been returned",
          { status: 400 }
        )
      }

      // Create return
      const machineReturn = await prisma.return.create({
        data: {
          machineId,
          returnDate: new Date(returnDate),
          returnReason,
        },
        include: {
          machine: {
            include: {
              machineModel: {
                include: {
                  category: true,
                },
              },
              supply: {
                include: {
                  distributor: true,
                },
              },
            },
          },
        },
      })

      return NextResponse.json(machineReturn)
    } catch (error) {
      console.error("[RETURNS_POST]", error)
      return new NextResponse("Internal error", { status: 500 })
    }
  })
}

export async function GET() {
  return withPermission('dispatch:read', async () => {
    try {
      const returns = await prisma.return.findMany({
        include: {
          machine: {
            include: {
              machineModel: {
                include: {
                  category: true,
                },
              },
              supply: {
                include: {
                  distributor: true,
                },
              },
            },
          },
        },
        orderBy: {
          returnDate: 'desc',
        },
      })

      return NextResponse.json(returns)
    } catch (error) {
      console.error("[RETURNS_GET]", error)
      return new NextResponse("Internal error", { status: 500 })
    }
  })
} 