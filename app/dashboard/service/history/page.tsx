import { withPermission } from "@/lib/rbac/server"
import { prisma } from "@/lib/prisma"
import { VisitsTable } from "./visits-table"

async function getHistoryData() {
  return withPermission("service:read", async () => {
    return prisma.serviceVisit.findMany({
      where: {
        status: {
          in: ['COMPLETED', 'CANCELLED']
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
        serviceVisitDate: 'desc',
      },
    })
  })
}

export default async function ServiceHistoryPage() {
  const visits = await getHistoryData()

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Service History</h1>
        <p className="text-muted-foreground mt-1">
          View past service visits and their outcomes
        </p>
      </div>

      <div className="bg-white rounded-lg shadow">
        <VisitsTable initialVisits={visits} />
      </div>
    </div>
  )
} 