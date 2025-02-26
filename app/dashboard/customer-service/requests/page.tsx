import { withPermission } from "@/lib/rbac/server"
import { prisma } from "@/lib/prisma"
import { RequestsTable } from "./requests-table"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import Link from "next/link"

async function getRequestsData() {
  return withPermission("support:read", async () => {
    return prisma.serviceRequest.findMany({
      where: {
        OR: [
          { serviceVisit: null },
          {
            serviceVisit: {
              status: {
                in: ['PENDING', 'IN_PROGRESS', 'CANCELLED', 'COMPLETED']
              }
            }
          }
        ]
      },
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
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
  })
}

export default async function ServiceRequestsPage() {
  const requests = await getRequestsData()

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Service Requests</h1>
          <p className="text-muted-foreground mt-1">
            Manage service requests and schedule visits
          </p>
        </div>
        <Link href="/dashboard/customer-service/requests/create">
          <Button>
            <PlusCircle className="h-4 w-4 mr-2" />
            Create Request
          </Button>
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow">
        <RequestsTable initialRequests={requests} />
      </div>
    </div>
  )
} 