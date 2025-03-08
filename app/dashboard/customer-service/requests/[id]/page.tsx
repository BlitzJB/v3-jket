import { withPermission } from "@/lib/rbac/server"
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { ServiceRequestDetails } from "./service-request-details"

interface PageProps {
  params: Promise<{
    id: string
  }>
}

async function getRequestDetails(id: string) {
  return withPermission("support:read", async () => {
    const request = await prisma.serviceRequest.findUnique({
      where: { id },
      include: {
        machine: {
          include: {
            machineModel: {
              include: {
                category: true,
              },
            },
            warrantyCertificate: true,
            sale: true,
          },
        },
        serviceVisit: {
          include: {
            engineer: true,
            comments: {
              orderBy: {
                createdAt: 'desc',
              },
            },
          },
        },
      },
    })

    if (!request) {
      notFound()
    }

    // Transform the request data to handle attachments
    return {
      ...request,
      serviceVisit: request.serviceVisit ? {
        ...request.serviceVisit,
        comments: request.serviceVisit.comments.map(comment => {
          let attachmentArray: Array<{ id: string; name: string; objectName: string }> = [];
          
          try {
            if (typeof comment.attachments === 'string') {
              const parsed = JSON.parse(comment.attachments);
              attachmentArray = Array.isArray(parsed) ? parsed : [];
            } else if (Array.isArray(comment.attachments)) {
              // @ts-ignore
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
    }
  })
}

export default async function ServiceRequestDetailsPage({ params }: PageProps) {
  const { id } = await params
  const request = await getRequestDetails(id)
  // @ts-ignore
  return <ServiceRequestDetails request={request} />
} 