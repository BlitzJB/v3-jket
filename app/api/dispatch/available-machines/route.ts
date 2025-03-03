import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withPermission } from "@/lib/rbac/server"

export async function GET() {
  return withPermission('dispatch:read', async () => {
    try {
      // Get machines that haven't been supplied yet
      const machines = await prisma.machine.findMany({
        where: {
          supply: null, // No supply record
          return: null, // No return record
        },
        select: {
          id: true,
          serialNumber: true,
          machineModel: {
            select: {
              name: true,
              shortCode: true,
              category: {
                select: {
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
      console.error("[AVAILABLE_MACHINES_GET]", error)
      return new NextResponse("Internal error", { status: 500 })
    }
  })
} 