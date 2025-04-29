
import { prisma } from "@/lib/prisma"
import { withPermission } from "@/lib/rbac/server"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  ClipboardList,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Calendar,
  Building2,
  MapPin,
  Timer,
  PenTool,
  DollarSign,
} from "lucide-react"
import { format, subDays } from "date-fns"
import { ServiceRequestStatus } from "@prisma/client"

interface DashboardData {
  totalRequests: number
  pendingRequests: number
  scheduledVisits: number
  unscheduledRequests: number
  recentRequests: Array<{
    id: string
    complaint: string | null
    createdAt: Date
    machine: {
      serialNumber: string
      machineModel: {
        name: string
      }
      warrantyCertificate: {
        name: string
        address: string
        state: string
      } | null
    }
    serviceVisit: {
      id: string
      status: ServiceRequestStatus
      serviceVisitDate: Date
    } | null
  }>
  upcomingVisits: Array<{
    id: string
    serviceVisitDate: Date
    status: ServiceRequestStatus
    typeOfIssue: string | null
    totalCost: number | null
    serviceRequest: {
      complaint: string | null
      machine: {
        serialNumber: string
        machineModel: {
          name: string
        }
        warrantyCertificate: {
          name: string
          address: string
          state: string
        } | null
      }
    }
  }>
  issueTypes: Array<{
    typeOfIssue: string | null
    _count: number
  }>
  costAnalysis: {
    totalCost: number
    averageCost: number
    completedVisits: number
  }
}

async function getDashboardData(): Promise<DashboardData> {
  return withPermission("support:read", async () => {
    const now = new Date()
    const thirtyDaysAgo = subDays(now, 30)

    const [
      totalRequests,
      pendingRequests,
      scheduledVisits,
      unscheduledRequests,
      recentRequests,
      upcomingVisits,
      issueTypes,
      costAnalysis,
    ] = await Promise.all([
      // Total requests
      prisma.serviceRequest.count(),
      
      // Pending requests
      prisma.serviceRequest.count({
        where: {
          serviceVisit: {
            status: ServiceRequestStatus.PENDING,
          },
        },
      }),
      
      // Scheduled visits
      prisma.serviceVisit.count({
        where: {
          status: {
            in: [ServiceRequestStatus.PENDING, ServiceRequestStatus.IN_PROGRESS],
          },
        },
      }),
      
      // Unscheduled requests
      prisma.serviceRequest.count({
        where: {
          serviceVisit: null,
        },
      }),
      
      // Recent requests
      prisma.serviceRequest.findMany({
        where: {
          createdAt: {
            gte: thirtyDaysAgo,
          },
        },
        include: {
          machine: {
            include: {
              machineModel: true,
              warrantyCertificate: true,
            },
          },
          serviceVisit: {
            select: {
              id: true,
              status: true,
              serviceVisitDate: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 5,
      }),
      
      // Upcoming visits
      prisma.serviceVisit.findMany({
        where: {
          serviceVisitDate: {
            gt: now,
          },
          status: {
            in: [ServiceRequestStatus.PENDING, ServiceRequestStatus.IN_PROGRESS],
          },
        },
        include: {
          serviceRequest: {
            include: {
              machine: {
                include: {
                  machineModel: true,
                  warrantyCertificate: true,
                },
              },
            },
          },
        },
        orderBy: {
          serviceVisitDate: 'asc',
        },
        take: 5,
      }),
      
      // Issue types
      prisma.serviceVisit.groupBy({
        by: ['typeOfIssue'],
        where: {
          typeOfIssue: {
            not: null,
          },
        },
        _count: true,
      }),
      
      // Cost analysis
      prisma.serviceVisit.aggregate({
        where: {
          status: ServiceRequestStatus.COMPLETED,
          totalCost: {
            not: null,
          },
        },
        _count: {
          id: true,
        },
        _sum: {
          totalCost: true,
        },
        _avg: {
          totalCost: true,
        },
      }),
    ])

    return {
      totalRequests,
      pendingRequests,
      scheduledVisits,
      unscheduledRequests,
      recentRequests,
      upcomingVisits,
      issueTypes: issueTypes.map(({ typeOfIssue, _count }) => ({
        typeOfIssue,
        _count
      })),
      costAnalysis: {
        totalCost: costAnalysis._sum.totalCost || 0,
        averageCost: costAnalysis._avg.totalCost || 0,
        completedVisits: costAnalysis._count.id,
      },
    }
  })
}

export default async function SupportDashboard() {
  const data = await getDashboardData()

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Support Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Overview of service requests and visit management
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-4 gap-6 mb-6">
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/5 rounded-lg">
                <ClipboardList className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Total Requests</div>
                <div className="text-2xl font-bold">{data.totalRequests}</div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/5 rounded-lg">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Pending</div>
                <div className="text-2xl font-bold">{data.pendingRequests}</div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/5 rounded-lg">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Scheduled</div>
                <div className="text-2xl font-bold">{data.scheduledVisits}</div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/5 rounded-lg">
                <AlertCircle className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Unscheduled</div>
                <div className="text-2xl font-bold">{data.unscheduledRequests}</div>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Upcoming Visits */}
          <Card className="col-span-2 p-6">
            <div className="flex items-center gap-2 mb-6">
              <Calendar className="h-5 w-5 text-primary/60" />
              <h2 className="font-semibold">Upcoming Service Visits</h2>
            </div>
            <div className="space-y-6">
              {data.upcomingVisits.length === 0 ? (
                <p className="text-muted-foreground">No upcoming visits scheduled</p>
              ) : (
                <div className="space-y-4">
                  {data.upcomingVisits.map((visit) => (
                    <div key={visit.id} className="flex items-start justify-between">
                      <div>
                        <div className="font-medium">
                          {visit.serviceRequest.machine.machineModel.name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {visit.serviceRequest.machine.serialNumber}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {visit.serviceRequest.complaint}
                        </div>
                        {visit.typeOfIssue && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                            <PenTool className="h-3 w-3" />
                            {visit.typeOfIssue}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(visit.serviceVisitDate), "MMM d, yyyy")}
                        </div>
                        {visit.totalCost && (
                          <div className="flex items-center gap-1 text-sm font-medium mt-1 justify-end">
                            <DollarSign className="h-3 w-3" />
                            {visit.totalCost.toFixed(2)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Issue Types */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <PenTool className="h-5 w-5 text-primary/60" />
              <h2 className="font-semibold">Common Issues</h2>
            </div>
            <div className="space-y-4">
              {data.issueTypes.map((issue) => (
                <div key={issue.typeOfIssue} className="flex items-center justify-between">
                  <div className="font-medium">{issue.typeOfIssue}</div>
                  <div className="text-sm text-muted-foreground">
                    {issue._count} visits
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Recent Requests */}
          <Card className="col-span-2 p-6">
            <div className="flex items-center gap-2 mb-6">
              <Timer className="h-5 w-5 text-primary/60" />
              <h2 className="font-semibold">Recent Service Requests</h2>
            </div>
            <div className="space-y-6">
              {data.recentRequests.length === 0 ? (
                <p className="text-muted-foreground">No recent requests</p>
              ) : (
                <div className="space-y-4">
                  {data.recentRequests.map((request) => (
                    <div key={request.id} className="flex items-start justify-between">
                      <div>
                        <div className="font-medium">
                          {request.machine.machineModel.name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {request.machine.serialNumber}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {request.complaint}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(request.createdAt), "MMM d, yyyy")}
                        </div>
                        {request.serviceVisit && (
                          <div className={`text-sm mt-1 ${
                            request.serviceVisit.status === 'COMPLETED' ? 'text-success' :
                            request.serviceVisit.status === 'CANCELLED' ? 'text-destructive' :
                            'text-muted-foreground'
                          }`}>
                            {request.serviceVisit.status}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Cost Analysis */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <DollarSign className="h-5 w-5 text-primary/60" />
              <h2 className="font-semibold">Cost Analysis</h2>
            </div>
            <div className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground">Total Revenue</div>
                <div className="text-2xl font-bold">
                  ₹{data.costAnalysis.totalCost.toFixed(2)}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Average Cost</div>
                <div className="text-lg font-semibold">
                  ₹{data.costAnalysis.averageCost.toFixed(2)}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Completed Visits</div>
                <div className="text-lg font-semibold">
                  {data.costAnalysis.completedVisits}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
} 