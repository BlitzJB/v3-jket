import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withPermission } from "@/lib/rbac/server"

export async function GET() {
  return withPermission('dispatch:read', async () => {
    try {
      // Get machines that haven't been supplied or returned
      const machines = await prisma.machine.findMany({
        where: {
          AND: [
            {
              supply: {
                is: null,
              },
            },
            {
              return: {
                is: null,
              },
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
        },
        orderBy: {
          manufacturingDate: 'desc',
        },
      })

      return NextResponse.json(machines)
    } catch (error) {
      console.error("[MACHINES_GET]", error)
      return new NextResponse("Internal error", { status: 500 })
    }
  })
} 