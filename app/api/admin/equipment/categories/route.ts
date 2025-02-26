import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withPermission } from "@/lib/rbac/server"

export async function POST(req: Request) {
  return withPermission('equipment:write', async () => {
    try {
      const body = await req.json()
      const { name, shortCode, description } = body

      // Check if shortCode is unique
      const existing = await prisma.category.findFirst({
        where: {
          shortCode,
        },
      })

      if (existing) {
        return new NextResponse("Short code already exists", { status: 400 })
      }

      const category = await prisma.category.create({
        data: {
          name,
          shortCode,
          description,
        },
      })

      return NextResponse.json(category)
    } catch (error) {
      console.error("[CATEGORIES_POST]", error)
      return new NextResponse("Internal error", { status: 500 })
    }
  })
}

export async function GET() {
  return withPermission('equipment:read', async () => {
    try {
      const categories = await prisma.category.findMany({
        include: {
          machineModels: {
            select: {
              id: true,
            },
          },
        },
        orderBy: {
          name: 'asc',
        },
      })

      return NextResponse.json(categories)
    } catch (error) {
      console.error("[CATEGORIES_GET]", error)
      return new NextResponse("Internal error", { status: 500 })
    }
  })
} 