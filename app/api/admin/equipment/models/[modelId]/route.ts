
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withPermission } from "@/lib/rbac/server"

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ modelId: string }> }
) {
  const { modelId } = await params
  
  return withPermission('equipment:write', async () => {
    try {
      const body = await req.json()
      const { name, shortCode, description, warrantyPeriodMonths, coverImageUrl, catalogueFileUrl, userManualFileUrl } = body

      // Check if shortCode is unique (excluding current model)
      const existing = await prisma.machineModel.findFirst({
        where: {
          shortCode,
          NOT: {
            id: modelId,
          },
        },
      })

      if (existing) {
        return new NextResponse("Short code already exists", { status: 400 })
      }

      const model = await prisma.machineModel.update({
        where: {
          id: modelId,
        },
        data: {
          name,
          shortCode,
          description,
          warrantyPeriodMonths,
          coverImageUrl,
          catalogueFileUrl,
          userManualFileUrl,
        },
      })

      return NextResponse.json(model)
    } catch (error) {
      console.error("[MACHINE_MODEL_PATCH]", error)
      return new NextResponse("Internal error", { status: 500 })
    }
  })
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ modelId: string }> }
) {
  const { modelId } = await params

  return withPermission('equipment:delete', async () => {
    try {
      // Check if model exists
      const model = await prisma.machineModel.findUnique({
        where: {
          id: modelId,
        },
      })

      if (!model) {
        return new NextResponse("Machine model not found", { status: 404 })
      }

      await prisma.machineModel.delete({
        where: {
          id: modelId,
        },
      })

      return new NextResponse(null, { status: 204 })
    } catch (error) {
      console.error("[MACHINE_MODEL_DELETE]", error)
      return new NextResponse("Internal error", { status: 500 })
    }
  })
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ modelId: string }> }
) {
  const { modelId } = await params

  return withPermission('equipment:read', async () => {
    try {
      const model = await prisma.machineModel.findUnique({
        where: {
          id: modelId,
        },
      })

      if (!model) {
        return new NextResponse("Machine model not found", { status: 404 })
      }

      return NextResponse.json(model)
    } catch (error) {
      console.error("[MACHINE_MODEL_GET]", error)
      return new NextResponse("Internal error", { status: 500 })
    }
  })
} 