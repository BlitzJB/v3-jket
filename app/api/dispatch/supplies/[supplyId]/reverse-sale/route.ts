
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withPermission } from "@/lib/rbac/server"

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ supplyId: string }> }
) {
  const { supplyId } = await params

  return withPermission('dispatch:manage', async () => {
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
          distributor: true,
        },
      })

      if (!supply || !supply.machine) {
        return new NextResponse("Supply not found", { status: 404 })
      }

      // Check if this is a D2C supply
      const isD2C = supply.distributor.organizationName === "JKET D2C"
      if (!isD2C) {
        return NextResponse.json(
          {
            message: "Only D2C supplies can be reversed using this endpoint."
          },
          { status: 400 }
        )
      }

      // Check if there's a sale record to reverse
      if (!supply.machine.sale) {
        return NextResponse.json(
          {
            message: "No sale record found for this D2C supply."
          },
          { status: 400 }
        )
      }

      // Check for other dependencies that prevent reversal
      const dependencies = []

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
            canReverse: false,
            dependencies,
            message: `Cannot reverse D2C sale. Machine has associated ${dependencies.join(", ")}.`
          },
          { status: 400 }
        )
      }

      // Use transaction to delete both sale and supply records
      await prisma.$transaction(async (tx) => {
        // Delete the sale record first
        await tx.sale.delete({
          where: {
            machineId: supply.machineId,
          },
        })

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
        canReverse: true,
        message: "D2C sale reversed successfully. Machine returned to inventory."
      })

    } catch (error) {
      console.error("[D2C_SALE_REVERSE]", error)
      return new NextResponse("Internal error", { status: 500 })
    }
  })
}
