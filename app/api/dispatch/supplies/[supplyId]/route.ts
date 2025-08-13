
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
              sale: true,
              warrantyCertificate: true,
              serviceRequests: true,
            },
          },
          distributor: true,
        },
      })

      if (!supply) {
        return new NextResponse("Supply not found", { status: 404 })
      }

      // Check for dependencies that would prevent supply deletion
      const dependencies = []
      
      if (supply.machine.sale) {
        dependencies.push("sale record")
      }
      
      if (supply.machine.return) {
        dependencies.push("return record")
      }
      
      if (supply.machine.warrantyCertificate) {
        dependencies.push("warranty certificate")
      }
      
      if (supply.machine.serviceRequests && supply.machine.serviceRequests.length > 0) {
        dependencies.push("service requests")
      }

      return NextResponse.json({
        ...supply,
        canDelete: dependencies.length === 0,
        dependencies
      })
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

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ supplyId: string }> }
) {
  const { supplyId } = await params

  return withPermission('*', async () => {
    try {
      // Check if supply exists with all related data
      const supply = await prisma.supply.findUnique({
        where: {
          id: supplyId,
        },
        include: {
          machine: {
            include: {
              sale: true,
              return: true,
              warrantyCertificate: true,
              serviceRequests: true,
            },
          },
        },
      })

      if (!supply) {
        return new NextResponse("Supply not found", { status: 404 })
      }

      // Check for dependencies that prevent supply deletion
      const dependencies = []
      
      if (supply.machine.sale) {
        dependencies.push("sale record")
      }
      
      if (supply.machine.return) {
        dependencies.push("return record")
      }
      
      if (supply.machine.warrantyCertificate) {
        dependencies.push("warranty certificate")
      }
      
      if (supply.machine.serviceRequests && supply.machine.serviceRequests.length > 0) {
        dependencies.push("service requests")
      }

      if (dependencies.length > 0) {
        return NextResponse.json(
          { 
            canDelete: false, 
            dependencies,
            message: `Cannot delete supply. Machine has associated ${dependencies.join(", ")}.`
          },
          { status: 400 }
        )
      }

      // Use transaction to delete supply and update machine
      await prisma.$transaction(async (tx) => {
        // Delete the supply record
        await tx.supply.delete({
          where: {
            id: supplyId,
          },
        })

        // Update the machine to remove supply relationship
        await tx.machine.update({
          where: {
            id: supply.machineId,
          },
          data: {
            supplyId: null,
          },
        })
      })

      return NextResponse.json({ 
        canDelete: true,
        message: "Supply deleted successfully. Machine returned to inventory." 
      })

    } catch (error) {
      console.error("[SUPPLY_DELETE]", error)
      return new NextResponse("Internal error", { status: 500 })
    }
  })
} 