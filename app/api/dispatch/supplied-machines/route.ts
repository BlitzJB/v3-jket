import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withPermission } from "@/lib/rbac/server"

export async function GET() {
  return withPermission('dispatch:read', async () => {
    try {
      // Get machines that have been supplied but not returned
      const machines = await prisma.machine.findMany({
        where: {
          AND: [
            {
              supply: {
                isNot: null,
              },
            },
            {
              return: {
                is: null,
              },
            },
          ],
        },
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
        orderBy: {
          supply: {
            supplyDate: 'desc',
          },
        },
      })

      return NextResponse.json(machines)
    } catch (error) {
      console.error("[SUPPLIED_MACHINES_GET]", error)
      return new NextResponse("Internal error", { status: 500 })
    }
  })
} 