import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withPermission } from "@/lib/rbac/server"

export async function GET(
  request: Request,
  { params }: { params: { returnId: string } }
) {
  return withPermission("dispatch:read", async () => {
    try {
      const returnData = await prisma.return.findUnique({
        where: { id: params.returnId },
        include: {
          machine: {
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
          },
        },
      })

      if (!returnData) {
        return new NextResponse("Return not found", { status: 404 })
      }

      return NextResponse.json(returnData)
    } catch (error) {
      console.error("[RETURN_GET]", error)
      return new NextResponse("Internal error", { status: 500 })
    }
  })
}

export async function PATCH(
  request: Request,
  { params }: { params: { returnId: string } }
) {
  return withPermission("dispatch:write", async () => {
    try {
      const body = await request.json()
      const { returnDate, returnReason } = body

      // Check if return exists
      const existingReturn = await prisma.return.findUnique({
        where: { id: params.returnId },
      })

      if (!existingReturn) {
        return new NextResponse("Return not found", { status: 404 })
      }

      // Update return
      const updatedReturn = await prisma.return.update({
        where: { id: params.returnId },
        data: {
          returnDate: new Date(returnDate),
          returnReason,
        },
        include: {
          machine: {
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
          },
        },
      })

      return NextResponse.json(updatedReturn)
    } catch (error) {
      console.error("[RETURN_PATCH]", error)
      return new NextResponse("Internal error", { status: 500 })
    }
  })
} 