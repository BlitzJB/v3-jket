import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withPermission } from "@/lib/rbac/server"

export async function GET(
  request: Request,
  { params }: { params: { categoryId: string } }
) {
  return withPermission("equipment:read", async () => {
    const category = await prisma.category.findUnique({
      where: { id: params.categoryId },
      select: {
        id: true,
        name: true,
        testConfiguration: true,
      },
    })

    if (!category) {
      return new NextResponse("Category not found", { status: 404 })
    }

    return NextResponse.json(category)
  })
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  return withPermission("equipment:write", async () => {
    const { categoryId } = await params
    const body = await request.json()

    const category = await prisma.category.update({
      where: { id: categoryId },
      data: {
        testConfiguration: body.testConfiguration,
      },
      select: {
        id: true,
        name: true,
        testConfiguration: true,
      },
    })

    return NextResponse.json(category)
  })
} 