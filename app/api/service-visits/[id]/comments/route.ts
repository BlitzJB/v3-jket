import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withPermission } from "@/lib/rbac/server"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return withPermission('service:write', async () => {
    const { id } = await params
    const { comment, attachments } = await request.json()

    const visitComment = await prisma.serviceVisitComment.create({
      data: {
        comment: comment,
        serviceVisitId: id,
        attachments: {
          create: attachments.map((attachment: { name: string; objectName: string }) => ({
            name: attachment.name,
            objectName: attachment.objectName,
          })),
        },
      },
    })

    return NextResponse.json(visitComment)
  })
} 