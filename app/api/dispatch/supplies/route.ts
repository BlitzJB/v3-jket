import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withPermission } from "@/lib/rbac/server"

export async function POST(request: Request) {
  return withPermission('dispatch:write', async () => {
    try {
      const body = await request.json()
      const { machineId, distributorId, supplyDate, sellBy } = body

      // Check if machine is already supplied
      const existingSupply = await prisma.supply.findFirst({
        where: {
          machineId,
          machine: {
            return: {
              is: null,
            },
          },
        },
      })

      if (existingSupply) {
        return new NextResponse(
          "Machine is already supplied and not returned",
          { status: 400 }
        )
      }

      // Create supply
      const supply = await prisma.supply.create({
        data: {
          machineId,
          distributorId,
          supplyDate: new Date(supplyDate),
          sellBy: new Date(sellBy),
        },
        include: {
          machine: {
            include: {
              machineModel: {
                include: {
                  category: true,
                },
              },
              return: true,
            },
          },
          distributor: true,
        },
      })

      // Transform the response to include return information
      return NextResponse.json({
        ...supply,
        return: supply.machine?.return || null,
      })
    } catch (error) {
      console.error("[SUPPLIES_POST]", error)
      return new NextResponse("Internal error", { status: 500 })
    }
  })
}

export async function GET() {
  return withPermission('dispatch:read', async () => {
    try {
      const supplies = await prisma.supply.findMany({
        include: {
          machine: {
            include: {
              machineModel: {
                include: {
                  category: true,
                },
              },
              return: true,
            },
          },
          distributor: true,
        },
        orderBy: {
          supplyDate: 'desc',
        },
      })

      // Transform the response to include return information
      return NextResponse.json(
        supplies.map(supply => ({
          ...supply,
          return: supply.machine?.return || null,
        }))
      )
    } catch (error) {
      console.error("[SUPPLIES_GET]", error)
      return new NextResponse("Internal error", { status: 500 })
    }
  })
} 