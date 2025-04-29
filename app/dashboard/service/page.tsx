
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
} from "lucide-react"
import { format, subDays } from "date-fns"

interface ServiceVisitStats {
  totalVisits: number
  pendingVisits: number
  completedVisits: number
  cancelledVisits: number
  recentVisits: Array<{
    id: string
    serviceVisitDate: Date
    status: string
    serviceVisitNotes: string | null
    serviceRequest: {
      complaint: string
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
  upcomingVisits: Array<{
    id: string
    serviceVisitDate: Date
    status: string
    serviceRequest: {
      complaint: string
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
  visitsByRegion: Array<{
    state: string
    _count: number
  }>
  commonComplaints: Array<{
    complaint: string
    _count: number
  }>
}

async function getDashboardData(): Promise<ServiceVisitStats> {
  return withPermission("service:read", async () => {
    const now = new Date()
    const thirtyDaysAgo = subDays(now, 30)

    const [
      totalVisits,
      pendingVisits,
      completedVisits,
      cancelledVisits,
      recentVisits,
      upcomingVisits,
      visitsByRegion,
      commonComplaints,
    ] = await Promise.all([
      // Total visits
      prisma.serviceVisit.count(),
      
      // Pending visits
      prisma.serviceVisit.count({
        where: {
          status: 'PENDING',
        },
      }),
      
      // Completed visits
      prisma.serviceVisit.count({
        where: {
          status: 'COMPLETED',
        },
      }),
      
      // Cancelled visits
      prisma.serviceVisit.count({
        where: {
          status: {
            in: ['CANCELLED', 'CLOSED'],
          },
        },
      }),
      
      // Recent visits
      prisma.serviceVisit.findMany({
        where: {
          serviceVisitDate: {
            gte: thirtyDaysAgo,
            lte: now,
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
          serviceVisitDate: 'desc',
        },
        take: 5,
      }),
      
      // Upcoming visits
      prisma.serviceVisit.findMany({
        where: {
          serviceVisitDate: {
            gt: now,
          },
          status: 'PENDING',
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
      
      // Visits by region
      prisma.warrantyCertificate.findMany({
        where: {
          state: { not: undefined },
          machine: {
            serviceRequests: {
              some: {
                serviceVisit: { isNot: null }
              }
            }
          }
        },
        include: {
          machine: {
            include: {
              serviceRequests: {
                include: {
                  serviceVisit: true
                }
              }
            }
          }
        }
      }).then(results => {
        const stateCounts = results.reduce((acc, curr) => {
          if (!curr.state) return acc;
          const state = curr.state;
          const count = curr.machine.serviceRequests.filter(sr => sr.serviceVisit !== null).length;
          if (!acc[state]) acc[state] = 0;
          acc[state] += count;
          return acc;
        }, {} as Record<string, number>);
        
        return Object.entries(stateCounts)
          .map(([state, count]) => ({ state, _count: count }))
          .sort((a, b) => b._count - a._count);
      }),
      
      // Common complaints
      prisma.serviceRequest.findMany({
        select: {
          complaint: true
        },
        where: {
          complaint: { not: undefined }
        }
      }).then(results => {
        const complaintCounts = results.reduce((acc, curr) => {
          const complaint = curr.complaint || 'No complaint specified';
          if (!acc[complaint]) acc[complaint] = 0;
          acc[complaint]++;
          return acc;
        }, {} as Record<string, number>);
        
        return Object.entries(complaintCounts)
          .map(([complaint, count]) => ({ complaint, _count: count }))
          .sort((a, b) => b._count - a._count)
          .slice(0, 5);
      }),
    ])

    return {
      totalVisits,
      pendingVisits,
      completedVisits,
      cancelledVisits,
      recentVisits: recentVisits.map(visit => ({
        id: visit.id,
        serviceVisitDate: visit.serviceVisitDate,
        status: visit.status,
        serviceVisitNotes: visit.serviceVisitNotes,
        serviceRequest: {
          complaint: visit.serviceRequest.complaint || 'No complaint specified',
          machine: {
            serialNumber: visit.serviceRequest.machine.serialNumber,
            machineModel: {
              name: visit.serviceRequest.machine.machineModel.name
            },
            warrantyCertificate: visit.serviceRequest.machine.warrantyCertificate
          }
        }
      })),
      upcomingVisits: upcomingVisits.map(visit => ({
        id: visit.id,
        serviceVisitDate: visit.serviceVisitDate,
        status: visit.status,
        serviceRequest: {
          complaint: visit.serviceRequest.complaint || 'No complaint specified',
          machine: {
            serialNumber: visit.serviceRequest.machine.serialNumber,
            machineModel: {
              name: visit.serviceRequest.machine.machineModel.name
            },
            warrantyCertificate: visit.serviceRequest.machine.warrantyCertificate
          }
        }
      })),
      visitsByRegion,
      commonComplaints,
    }
  })
}

export default async function ServiceDashboard() {
  const data = await getDashboardData()

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Service Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Overview of service visits and customer support
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
                <div className="text-sm text-muted-foreground">Total Visits</div>
                <div className="text-2xl font-bold">{data.totalVisits}</div>
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
                <div className="text-2xl font-bold">{data.pendingVisits}</div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/5 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Completed</div>
                <div className="text-2xl font-bold">{data.completedVisits}</div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/5 rounded-lg">
                <XCircle className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Cancelled</div>
                <div className="text-2xl font-bold">{data.cancelledVisits}</div>
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
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(visit.serviceVisitDate), "MMM d, yyyy")}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Regional Distribution */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <MapPin className="h-5 w-5 text-primary/60" />
              <h2 className="font-semibold">Service by Region</h2>
            </div>
            <div className="space-y-4">
              {data.visitsByRegion.map((region) => (
                <div key={region.state} className="flex items-center justify-between">
                  <div className="font-medium">{region.state}</div>
                  <div className="text-sm text-muted-foreground">
                    {region._count} visits
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Recent Activity */}
          <Card className="col-span-2 p-6">
            <div className="flex items-center gap-2 mb-6">
              <Timer className="h-5 w-5 text-primary/60" />
              <h2 className="font-semibold">Recent Activity</h2>
            </div>
            <div className="space-y-6">
              {data.recentVisits.length === 0 ? (
                <p className="text-muted-foreground">No recent activity</p>
              ) : (
                <div className="space-y-4">
                  {data.recentVisits.map((visit) => (
                    <div key={visit.id} className="flex items-start justify-between">
                      <div>
                        <div className="font-medium">
                          {visit.serviceRequest.machine.machineModel.name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {visit.serviceRequest.machine.serialNumber}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {visit.serviceVisitNotes || visit.serviceRequest.complaint}
                        </div>
                      </div>
                      <div className="text-sm">
                        <div className="text-right text-muted-foreground">
                          {format(new Date(visit.serviceVisitDate), "MMM d, yyyy")}
                        </div>
                        <div className={`text-right mt-1 ${
                          visit.status === 'COMPLETED' ? 'text-success' :
                          visit.status === 'CANCELLED' ? 'text-destructive' :
                          'text-muted-foreground'
                        }`}>
                          {visit.status}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Common Issues */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <AlertCircle className="h-5 w-5 text-primary/60" />
              <h2 className="font-semibold">Common Issues</h2>
            </div>
            <div className="space-y-4">
              {data.commonComplaints.map((complaint) => (
                <div key={complaint.complaint} className="flex items-center justify-between">
                  <div className="font-medium">{complaint.complaint}</div>
                  <div className="text-sm text-muted-foreground">
                    {complaint._count} times
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
} 