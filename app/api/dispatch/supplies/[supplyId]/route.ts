
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
      const { machineId, distributorId, supplyDate, sellBy, notes } = body

      // Check if supply exists
      const existingSupply = await prisma.supply.findUnique({
        where: { id: supplyId },
        include: {
          machine: true,
        },
      })

      if (!existingSupply) {
        return new NextResponse("Supply not found", { status: 404 })
      }

      // If machine is changing, validate the new machine is available
      if (machineId && machineId !== existingSupply.machineId) {
        const targetMachine = await prisma.machine.findUnique({
          where: { id: machineId },
          include: {
            supply: true,
            return: true,
          },
        })

        if (!targetMachine) {
          return new NextResponse("Target machine not found", { status: 400 })
        }

        // Check if target machine is available (not supplied to someone else and not returned)
        if (targetMachine.supply && targetMachine.supply.id !== supplyId) {
          return new NextResponse("Target machine is already supplied to another distributor", { status: 400 })
        }

        if (targetMachine.return) {
          return new NextResponse("Target machine has been returned and cannot be supplied", { status: 400 })
        }
      }

      // Update supply with transaction to handle machine changes
      const supply = await prisma.$transaction(async (tx) => {
        // If machine is changing, we need to handle the transition
        if (machineId && machineId !== existingSupply.machineId) {
          // First, disconnect the old machine from this supply
          await tx.machine.update({
            where: { id: existingSupply.machineId },
            data: {
              supply: {
                disconnect: true,
              },
            },
          })

          // Then update the supply with the new machine
          return await tx.supply.update({
            where: { id: supplyId },
            data: {
              machine: {
                connect: {
                  id: machineId,
                },
              },
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
        } else {
          // If machine is not changing, just update other fields
          return await tx.supply.update({
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
        }
      })

      return NextResponse.json(supply)
    } catch (error) {
      console.error("[SUPPLY_PATCH]", error)
      return new NextResponse("Internal error", { status: 500 })
    }
  })
} 