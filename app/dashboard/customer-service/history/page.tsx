import { withPermission } from "@/lib/rbac/server"
import { prisma } from "@/lib/prisma"
import { HistoryTable } from "./history-table"

async function getClosedRequests() {
  return withPermission("support:read", async () => {
    return prisma.serviceRequest.findMany({
      where: {
        serviceVisit: {
          status: 'CLOSED'
        }
      },
      include: {
        machine: {
          include: {
            machineModel: {
              include: {
                category: true
              }
            },
            warrantyCertificate: true,
            sale: true
          }
        },
        serviceVisit: {
          include: {
            engineer: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })
  })
}

export default async function HistoryPage() {
  const requests = await getClosedRequests()

  return (
    <div className="container py-8 space-y-8 md:px-12 px-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Service History</h1>
        <p className="text-muted-foreground">
          View history of closed service requests
        </p>
      </div>

      <HistoryTable requests={requests} />
    </div>
  )
} 