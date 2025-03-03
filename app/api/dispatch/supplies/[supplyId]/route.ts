import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withPermission } from "@/lib/rbac/server"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ supplyId: string }> }
) {
  return withPermission('dispatch:read', async () => {
    try {
      const { supplyId } = await params
      const supply = await prisma.supply.findUnique({
        where: { id: supplyId },
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

      if (!supply) {
        return new NextResponse("Supply not found", { status: 404 })
      }

      return NextResponse.json(supply)
    } catch (error) {
      console.error("[SUPPLY_GET]", error)
      return new NextResponse("Internal error", { status: 500 })
    }
  })
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ supplyId: string }> }
) {
  return withPermission('dispatch:write', async () => {
    try {
      const { supplyId } = await params
      const body = await request.json()
      const { distributorId, supplyDate, sellBy, notes } = body

      // Check if supply exists
      const existingSupply = await prisma.supply.findUnique({
        where: { id: supplyId },
      })

      if (!existingSupply) {
        return new NextResponse("Supply not found", { status: 404 })
      }

      // Update supply
      const supply = await prisma.supply.update({
        where: { id: supplyId },
        data: {
          distributor: {
            connect: {
              id: distributorId,
            },
          },
          supplyDate: new Date(supplyDate),
          sellBy: new Date(sellBy),
          notes: notes,
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

      return NextResponse.json(supply)
    } catch (error) {
      console.error("[SUPPLY_PATCH]", error)
      return new NextResponse("Internal error", { status: 500 })
    }
  })
} 