import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withPermission } from "@/lib/rbac/server"

export async function POST(req: Request) {
  return withPermission('equipment:write', async () => {
    try {
      const body = await req.json()
      const { name, shortCode, description, warrantyPeriodMonths, coverImageUrl, categoryId } = body

      // Check if shortCode is unique
      const existing = await prisma.machineModel.findFirst({
        where: {
          shortCode,
        },
      })

      if (existing) {
        return new NextResponse("Short code already exists", { status: 400 })
      }

      // Validate category exists
      const category = await prisma.category.findUnique({
        where: {
          id: categoryId,
        },
      })

      if (!category) {
        return new NextResponse("Category not found", { status: 400 })
      }

      const model = await prisma.machineModel.create({
        data: {
          name,
          shortCode,
          description,
          warrantyPeriodMonths,
          coverImageUrl,
          categoryId,
        },
      })

      return NextResponse.json(model)
    } catch (error) {
      console.error("[MACHINE_MODELS_POST]", error)
      return new NextResponse("Internal error", { status: 500 })
    }
  })
}

export async function GET() {
  return withPermission('equipment:read', async () => {
    try {
      const models = await prisma.machineModel.findMany({
        orderBy: {
          name: 'asc',
        },
      })

      return NextResponse.json(models)
    } catch (error) {
      console.error("[MACHINE_MODELS_GET]", error)
      return new NextResponse("Internal error", { status: 500 })
    }
  })
} 