import { prisma } from "@/lib/prisma"
import { withPermission } from "@/lib/rbac/server"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  BarChart3,
  Building2,
  Calendar,
  Clock,
  Package2,
  Timer,
  AlertTriangle,
  ArrowRight,
} from "lucide-react"
import { format, addDays, isAfter, isBefore } from "date-fns"
import Link from "next/link"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

async function getDashboardStats() {
  return withPermission("distributor:sales:read", async () => {
    const today = new Date()
    const thirtyDaysFromNow = addDays(today, 30)
    const sixtyDaysFromNow = addDays(today, 60)

    // Get all machines with their supply information
    const supplies = await prisma.supply.findMany({
      where: {
        machine: {
          isNot: undefined,
          sale: null // Exclude machines that have been sold
        }
      },
      select: {
        id: true,
        sellBy: true,
        machine: {
          select: {
            id: true,
            serialNumber: true,
            machineModel: {
              select: {
                name: true,
                category: {
                  select: {
                    name: true
                  }
                }
              }
            }
          }
        },
        distributor: {
          select: {
            organizationName: true,
            region: true
          }
        }
      }
    })

    console.log(supplies)

    // Calculate statistics
    const totalMachines = supplies.length
    const expiredMachines = supplies.filter(supply => 
      isBefore(supply.sellBy, today)
    ).length
    const expiring30Days = supplies.filter(supply => 
      isAfter(supply.sellBy, today) && 
      isBefore(supply.sellBy, thirtyDaysFromNow)
    ).length
    const expiring60Days = supplies.filter(supply => 
      isAfter(supply.sellBy, today) && 
      isBefore(supply.sellBy, sixtyDaysFromNow)
    ).length

    // Get critical machines (expiring in next 7 days)
    const criticalMachines = supplies
      .filter(supply => 
        supply.machine &&
        supply.machine.machineModel &&
        isAfter(supply.sellBy, today) && 
        isBefore(supply.sellBy, addDays(today, 7))
      )
      .map(supply => ({
        id: supply.machine!.id,
        serialNumber: supply.machine!.serialNumber,
        modelName: supply.machine!.machineModel.name,
        sellBy: supply.sellBy,
        distributor: supply.distributor.organizationName || 'Unknown'
      }))

    // Get expired machines details
    const expiredMachineDetails = supplies
      .filter(supply => 
        supply.machine &&
        supply.machine.machineModel &&
        isBefore(supply.sellBy, today)
      )
      .map(supply => ({
        id: supply.machine!.id,
        serialNumber: supply.machine!.serialNumber,
        modelName: supply.machine!.machineModel.name,
        sellBy: supply.sellBy,
        distributor: supply.distributor.organizationName || 'Unknown'
      }))
      .sort((a, b) => new Date(a.sellBy).getTime() - new Date(b.sellBy).getTime())

    // Get top distributors by expiring machines
    const distributorStats = supplies.reduce((acc, supply) => {
      const orgName = supply.distributor.organizationName || 'Unknown'
      
      if (!acc[orgName]) {
        acc[orgName] = {
          name: orgName,
          region: supply.distributor.region || 'Unknown',
          expiringCount: 0,
          totalMachines: 0,
          expiredCount: 0
        }
      }
      
      acc[orgName].totalMachines++
      if (isAfter(supply.sellBy, today) && isBefore(supply.sellBy, thirtyDaysFromNow)) {
        acc[orgName].expiringCount++
      }
      if (isBefore(supply.sellBy, today)) {
        acc[orgName].expiredCount++
      }
      return acc
    }, {} as Record<string, { 
      name: string
      region: string
      expiringCount: number
      expiredCount: number
      totalMachines: number 
    }>)

    const topDistributors = Object.values(distributorStats)
      .sort((a, b) => (b.expiringCount + b.expiredCount) - (a.expiringCount + a.expiredCount))
      .slice(0, 5)

    return {
      totalMachines,
      expiring30Days,
      expiring60Days,
      expiredMachines,
      criticalMachines,
      expiredMachineDetails,
      topDistributors
    }
  })
}

export default async function SalesDashboard() {
  const stats = await getDashboardStats()

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Sales Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Monitor machine sell-by dates and distribution status
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-5 gap-6 mb-6">
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/5 rounded-lg">
                <Package2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Total Machines</div>
                <div className="text-2xl font-bold">{stats.totalMachines}</div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/5 rounded-lg">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Expiring (30 Days)</div>
                <div className="text-2xl font-bold">{stats.expiring30Days}</div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/5 rounded-lg">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Expiring (60 Days)</div>
                <div className="text-2xl font-bold">{stats.expiring60Days}</div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/5 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Critical</div>
                <div className="text-2xl font-bold">{stats.criticalMachines.length}</div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-destructive/10 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Expired</div>
                <div className="text-2xl font-bold">{stats.expiredMachines}</div>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Critical Machines */}
          <Card className="col-span-2 p-6">
            <div className="flex items-center gap-2 mb-6">
              <AlertTriangle className="h-5 w-5 text-primary/60" />
              <h2 className="font-semibold">Critical Attention Required</h2>
            </div>
            <div className="space-y-4">
              {stats.criticalMachines.length > 0 ? (
                stats.criticalMachines.map((machine) => (
                  <div key={machine.id} className="flex items-center justify-between bg-muted p-4 rounded-lg">
                    <div>
                      <div className="font-medium">{machine.modelName}</div>
                      <div className="text-sm text-muted-foreground">
                        SN: {machine.serialNumber} • {machine.distributor}
                      </div>
                    </div>
                    <div className="text-sm text-destructive font-medium">
                      Expires {format(new Date(machine.sellBy), "MMM d, yyyy")}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-muted-foreground italic">
                  No machines requiring critical attention
                </div>
              )}
            </div>
          </Card>

          {/* Distribution Network */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <Building2 className="h-5 w-5 text-primary/60" />
              <h2 className="font-semibold">Top Distributors</h2>
            </div>
            <div className="space-y-4">
              {stats.topDistributors.map((distributor) => (
                <div key={distributor.name} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{distributor.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {distributor.region}
                    </div>
                  </div>
                  <div className="text-sm space-y-1 text-right">
                    <div className="font-medium text-destructive">
                      {distributor.expiredCount} expired
                    </div>
                    <div className="font-medium">
                      {distributor.expiringCount} expiring
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Expired Machines */}
          <Card className="col-span-2 p-6">
            <div className="flex items-center gap-2 mb-6">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <h2 className="font-semibold">Expired Machines</h2>
            </div>
            <div className="space-y-4">
              {stats.expiredMachineDetails.length > 0 ? (
                stats.expiredMachineDetails.slice(0, 5).map((machine) => (
                  <div key={machine.id} className="flex items-center justify-between bg-muted p-4 rounded-lg">
                    <div>
                      <div className="font-medium">{machine.modelName}</div>
                      <div className="text-sm text-muted-foreground">
                        SN: {machine.serialNumber} • {machine.distributor}
                      </div>
                    </div>
                    <div className="text-sm text-destructive font-medium">
                      Expired {format(new Date(machine.sellBy), "MMM d, yyyy")}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-muted-foreground italic">
                  No expired machines
                </div>
              )}
            </div>
          </Card>

          {/* Quick Actions */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <Timer className="h-5 w-5 text-primary/60" />
              <h2 className="font-semibold">Quick Actions</h2>
            </div>
            <div className="space-y-4">
              <Link href="/dashboard/customer-service/machine-expiry/machines">
                <Card className="p-4 hover:bg-accent transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">View All Machines</div>
                    <ArrowRight className="h-5 w-5" />
                  </div>
                </Card>
              </Link>
              <Link href="/dashboard/customer-service/machine-expiry/machines/expiring">
                <Card className="p-4 hover:bg-accent transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">View Expiring Machines</div>
                    <ArrowRight className="h-5 w-5" />
                  </div>
                </Card>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
} 