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

    return request
  })
}

export default async function ServiceRequestDetailsPage({ params }: PageProps) {
  const { id } = await params
  const request = await getRequestDetails(id)
  return <ServiceRequestDetails request={request} />
} 