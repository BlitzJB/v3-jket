
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withPermission } from "@/lib/rbac/server"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ serialNumber: string }> }
) {
  return withPermission('service:read', async () => {
    const { serialNumber } = await params

    const serviceHistory = await prisma.serviceRequest.findMany({
      where: {
        machine: {
          serialNumber: serialNumber
        },
        serviceVisit: {
          isNot: null
        }
      },
      include: {
        serviceVisit: {
          include: {
            engineer: {
              select: {
                name: true,
                email: true
              }
            },
            comments: {
              orderBy: {
                createdAt: 'desc'
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Transform the data to include parsed attachments
    const transformedHistory = serviceHistory.map(request => ({
      ...request,
      serviceVisit: request.serviceVisit ? {
        ...request.serviceVisit,
        comments: request.serviceVisit.comments.map(comment => {
          let attachmentArray = [];
          try {
            if (typeof comment.attachments === 'string') {
              const parsed = JSON.parse(comment.attachments);
              attachmentArray = Array.isArray(parsed) ? parsed : [];
            } else if (Array.isArray(comment.attachments)) {
              attachmentArray = comment.attachments;
            }
          } catch (e) {
            console.error('Error parsing attachments:', e);
          }

          return {
            ...comment,
            attachments: attachmentArray.map(attachment => ({
              id: attachment.id,
              name: attachment.name,
              url: `/api/media/${attachment.objectName}`,
              type: attachment.name.split('.').pop()?.toLowerCase() || 'unknown'
            }))
          };
        })
      } : null
    }))

    return NextResponse.json(transformedHistory)
  })
} 