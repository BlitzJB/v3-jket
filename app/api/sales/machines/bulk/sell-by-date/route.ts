
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withPermission } from "@/lib/rbac/server"
import { z } from "zod"

const updateSchema = z.object({
  supplyIds: z.array(z.string()),
  newDate: z.string().datetime(),
  reason: z.string().optional(),
  notes: z.string().optional(),
})

export async function PATCH(request: Request) {
  try {
    const json = await request.json()
    const body = updateSchema.parse(json)

    return withPermission("distributor:sales:write", async () => {
      // Update all supplies in a single transaction
      const updatedSupplies = await prisma.$transaction(async (tx) => {
        // Update each supply's sell-by date
        const updates = body.supplyIds.map((id) =>
          tx.supply.update({
            where: { id },
            data: {
              sellBy: new Date(body.newDate),
              // Create a history record if needed
              notes: body.notes || undefined,
            },
            include: {
              machine: {
                include: {
                  machineModel: {
                    include: {
                      category: true,
                    },
                  },
                },
              },
              distributor: true,
            },
          })
        )

        return Promise.all(updates)
      })

      return NextResponse.json(updatedSupplies)
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors },
        { status: 400 }
      )
    }

    console.error("Error updating supplies:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
} 