
import { withPermission } from "@/lib/rbac/server"
import { prisma } from "@/lib/prisma"
import { VisitsTable } from "./visits-table"

async function getVisitsData() {
  return withPermission("service:read", async () => {
    const visits = await prisma.serviceVisit.findMany({
      where: {
        status: {
          in: ['PENDING', 'IN_PROGRESS']
        }
      },
      include: {
        serviceRequest: {
          include: {
            machine: {
              include: {
                machineModel: {
                  include: {
                    category: true,
                  },
                },
                warrantyCertificate: true,
              },
            },
          },
        },
        comments: {
          include: {
            serviceVisit: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
      orderBy: {
        serviceVisitDate: 'asc',
      },
    })

    // Transform the data to handle null complaints
    return visits.map(visit => ({
      ...visit,
      serviceRequest: {
        ...visit.serviceRequest,
        complaint: visit.serviceRequest.complaint || 'No complaint specified'
      }
    }))
  })
}

export default async function ServiceVisitsPage() {
  const visits = await getVisitsData()

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Assigned Service Visits</h1>
        <p className="text-muted-foreground mt-1">
          View and manage your assigned service visits
        </p>
      </div>

      <div className="bg-white rounded-lg shadow">
        <VisitsTable initialVisits={visits} />
      </div>
    </div>
  )
} 