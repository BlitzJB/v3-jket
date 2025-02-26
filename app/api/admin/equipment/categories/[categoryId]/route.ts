import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withPermission } from "@/lib/rbac/server"

export async function PATCH(
  req: Request,
  context: { params: { categoryId: string } }
) {
  const { categoryId } = context.params
  
  return withPermission('equipment:write', async () => {
    try {
      const body = await req.json()
      const { name, shortCode, description } = body

      // Check if shortCode is unique (excluding current category)
      const existing = await prisma.category.findFirst({
        where: {
          shortCode,
          NOT: {
            id: categoryId,
          },
        },
      })

      if (existing) {
        return new NextResponse("Short code already exists", { status: 400 })
      }

      const category = await prisma.category.update({
        where: {
          id: categoryId,
        },
        data: {
          name,
          shortCode,
          description,
        },
      })

      return NextResponse.json(category)
    } catch (error) {
      console.error("[CATEGORY_PATCH]", error)
      return new NextResponse("Internal error", { status: 500 })
    }
  })
}

export async function DELETE(
  req: Request,
  context: { params: { categoryId: string } }
) {
  const { categoryId } = context.params

  return withPermission('equipment:delete', async () => {
    try {
      // Check if category has any machine models
      const category = await prisma.category.findUnique({
        where: {
          id: categoryId,
        },
        include: {
          machineModels: {
            select: {
              id: true,
            },
          },
        },
      })

      if (!category) {
        return new NextResponse("Category not found", { status: 404 })
      }

      if (category.machineModels.length > 0) {
        return new NextResponse(
          "Cannot delete category with associated machine models",
          { status: 400 }
        )
      }

      await prisma.category.delete({
        where: {
          id: categoryId,
        },
      })

      return new NextResponse(null, { status: 204 })
    } catch (error) {
      console.error("[CATEGORY_DELETE]", error)
      return new NextResponse("Internal error", { status: 500 })
    }
  })
}

export async function GET(
  req: Request,
  context: { params: { categoryId: string } }
) {
  const { categoryId } = context.params

  return withPermission('equipment:read', async () => {
    try {
      const category = await prisma.category.findUnique({
        where: {
          id: categoryId,
        },
      })

      if (!category) {
        return new NextResponse("Category not found", { status: 404 })
      }

      return NextResponse.json(category)
    } catch (error) {
      console.error("[CATEGORY_GET]", error)
      return new NextResponse("Internal error", { status: 500 })
    }
  })
} 