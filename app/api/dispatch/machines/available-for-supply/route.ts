import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withPermission } from "@/lib/rbac/server"

export async function GET(request: Request) {
  return withPermission('dispatch:read', async () => {
    try {
      const { searchParams } = new URL(request.url)
      const currentSupplyId = searchParams.get('currentSupplyId')

      // Get machines that are either:
      // 1. Not supplied at all (supply is null)
      // 2. Not returned (return is null)  
      // 3. Currently supplied by the supply being edited (so it can stay with the same supply)
      const machines = await prisma.machine.findMany({
        where: {
          AND: [
            {
              return: {
                is: null,
              },
            },
            {
              OR: [
                {
                  supply: {
                    is: null,
                  },
                },
                ...(currentSupplyId ? [{
                  supply: {
                    id: currentSupplyId,
                  },
                }] : [])
              ],
            },
          ],
        },
        select: {
          id: true,
          serialNumber: true,
          manufacturingDate: true,
          machineModel: {
            select: {
              id: true,
              name: true,
              shortCode: true,
              category: {
                select: {
                  id: true,
                  name: true,
                  shortCode: true,
                },
              },
            },
          },
          supply: {
            select: {
              id: true,
              distributor: {
                select: {
                  organizationName: true,
                },
              },
            },
          },
        },
        orderBy: {
          manufacturingDate: 'desc',
        },
      })

      return NextResponse.json(machines)
    } catch (error) {
      console.error("[MACHINES_AVAILABLE_FOR_SUPPLY_GET]", error)
      return new NextResponse("Internal error", { status: 500 })
    }
  })
}