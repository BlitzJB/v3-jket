import { prisma } from "@/lib/prisma"
import { withPermission } from "@/lib/rbac/server"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  BarChart3,
  Box,
  Building2,
  Globe,
  PackageCheck,
  PackageX,
  Percent,
  RotateCcw,
  Timer,
  Truck,
  Users,
} from "lucide-react"
import { format, subDays } from "date-fns"

interface Distributor {
  id: string
  name: string
  organizationName: string
  region: string
  supplies: Supply[]
}

interface Supply {
  id: string
  supplyDate: Date
  distributor: {
    id: string
    name: string
    organizationName: string
    region: string
  }
  machine: {
    id: string
    serialNumber: string
    machineModel: {
      id: string
      name: string
      category: {
        id: string
        name: string
      }
    }
  }
}

interface Return {
  id: string
  returnDate: Date
  returnReason: string
  machine: {
    id: string
    serialNumber: string
    machineModel: {
      name: string
    }
    supply: {
      distributor: {
        organizationName: string
      }
    }
  }
}

interface MachineModel {
  name: string
  machines: {
    return: Return | null
  }[]
}

interface RegionStat {
  region: string
  _count: number
}

interface ReturnReason {
  returnReason: string
  _count: number
}

async function getDashboardData() {
  return withPermission("dispatch:read", async () => {
    const now = new Date()
    const thirtyDaysAgo = subDays(now, 30)

    // Get all supplies and returns
    const [
      totalSupplies,
      totalReturns,
      activeSupplies,
      recentSupplies,
      recentReturns,
      distributors,
      returnReasons,
      modelStats,
      upcomingSellBy,
      regionStats,
    ] = await Promise.all([
      prisma.supply.count(),
      prisma.return.count(),
      prisma.supply.count({
        where: {
          machine: {
            return: null,
          },
        },
      }),
      prisma.supply.findMany({
        where: {
          supplyDate: {
            gte: thirtyDaysAgo,
          },
        },
        include: {
          distributor: true,
          machine: {
            include: {
              machineModel: {
                include: {
                  category: true,
                },
              },
            },
          },
        },
        orderBy: {
          supplyDate: 'desc',
        },
      }),
      prisma.return.findMany({
        where: {
          returnDate: {
            gte: thirtyDaysAgo,
          },
        },
        include: {
          machine: {
            include: {
              machineModel: true,
              supply: {
                include: {
                  distributor: true,
                },
              },
            },
          },
        },
        orderBy: {
          returnDate: 'desc',
        },
      }),
      prisma.user.findMany({
        where: {
          role: 'DISTRIBUTOR',
          approved: true,
        },
        select: {
          id: true,
          name: true,
          organizationName: true,
          region: true,
          _count: {
            select: {
              supplies: {
                where: {
                  machine: {
                    return: null,
                  },
                },
              },
            },
          },
        },
      }),
      prisma.return.groupBy({
        by: ['returnReason'],
        _count: true,
        orderBy: {
          _count: {
            returnReason: 'desc',
          },
        },
        take: 5,
      }),
      prisma.machineModel.findMany({
        include: {
          machines: {
            include: {
              return: true,
            },
          },
        },
      }),
      prisma.supply.findMany({
        where: {
          sellBy: {
            gte: now,
            lte: subDays(now, -30),
          },
          machine: {
            return: null,
          },
        },
        include: {
          distributor: true,
          machine: {
            include: {
              machineModel: true,
            },
          },
        },
        orderBy: {
          sellBy: 'asc',
        },
        take: 5,
      }),
      prisma.user.groupBy({
        where: {
          role: 'DISTRIBUTOR',
          approved: true,
        },
        by: ['region'],
        _count: true,
      }),
    ])

    // Calculate additional metrics
    const returnRate = totalSupplies > 0 ? (totalReturns / totalSupplies) * 100 : 0
    const activeDistributors = distributors.filter(d => d._count.supplies > 0).length
    const avgMachinesPerDistributor = activeDistributors > 0 ? activeSupplies / activeDistributors : 0
    
    // Sort distributors by active machine count
    const topDistributors = distributors
      .map(d => ({
        name: d.organizationName ?? 'Unknown',
        region: d.region ?? 'Unknown',
        machineCount: d._count.supplies,
      }))
      .sort((a, b) => b.machineCount - a.machineCount)
      .slice(0, 5)

    // Calculate return rates by model
    const modelReturnRates = modelStats.map(model => ({
      name: model.name,
      totalMachines: model.machines.length,
      returnedMachines: model.machines.filter(m => m.return).length,
      returnRate: model.machines.length > 0
        ? (model.machines.filter(m => m.return).length / model.machines.length) * 100
        : 0,
    }))
    .sort((a, b) => b.returnRate - a.returnRate)
    .slice(0, 5)

    return {
      totalSupplies,
      totalReturns,
      activeSupplies,
      returnRate,
      activeDistributors,
      avgMachinesPerDistributor,
      recentSupplies,
      recentReturns,
      topDistributors,
      returnReasons,
      modelReturnRates,
      upcomingSellBy,
      regionStats,
    }
  })
}

export default async function DispatchDashboard() {
  const data = await getDashboardData()

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Dispatch Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Overview of machine distribution and returns
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-4 gap-6 mb-6">
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/5 rounded-lg">
                <Truck className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Total Supplies</div>
                <div className="text-2xl font-bold">{data.totalSupplies}</div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/5 rounded-lg">
                <PackageCheck className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Active Supplies</div>
                <div className="text-2xl font-bold">{data.activeSupplies}</div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/5 rounded-lg">
                <RotateCcw className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Total Returns</div>
                <div className="text-2xl font-bold">{data.totalReturns}</div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/5 rounded-lg">
                <Percent className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Return Rate</div>
                <div className="text-2xl font-bold">{data.returnRate.toFixed(1)}%</div>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Distribution Network */}
          <Card className="col-span-2 p-6">
            <div className="flex items-center gap-2 mb-6">
              <Building2 className="h-5 w-5 text-primary/60" />
              <h2 className="font-semibold">Distribution Network</h2>
            </div>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">
                    Active Distributors
                  </div>
                  <div className="text-2xl font-bold">{data.activeDistributors}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">
                    Avg. Machines per Distributor
                  </div>
                  <div className="text-2xl font-bold">
                    {data.avgMachinesPerDistributor.toFixed(1)}
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-sm font-medium mb-4">Top Distributors</h3>
                <div className="space-y-4">
                  {data.topDistributors.map((distributor) => (
                    <div key={distributor.name} className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{distributor.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {distributor.region}
                        </div>
                      </div>
                      <div className="font-medium">{distributor.machineCount} machines</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Regional Distribution */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <Globe className="h-5 w-5 text-primary/60" />
              <h2 className="font-semibold">Regional Distribution</h2>
            </div>
            <div className="space-y-4">
              {data.regionStats.map((region) => (
                <div key={region.region} className="flex items-center justify-between">
                  <div className="font-medium">{region.region}</div>
                  <div className="text-sm text-muted-foreground">
                    {region._count} distributors
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Recent Activity */}
          <Card className="col-span-2 p-6">
            <div className="flex items-center gap-2 mb-6">
              <Timer className="h-5 w-5 text-primary/60" />
              <h2 className="font-semibold">Recent Activity (Last 30 Days)</h2>
            </div>
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium mb-4">Recent Supplies</h3>
                <div className="space-y-4">
                  {data.recentSupplies.slice(0, 5).map((supply) => (
                    <div key={supply.id} className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">
                          {supply.machine?.machineModel.name ?? 'Unknown Model'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          to {supply.distributor.organizationName}
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(supply.supplyDate), "MMM d, yyyy")}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-sm font-medium mb-4">Recent Returns</h3>
                <div className="space-y-4">
                  {data.recentReturns.slice(0, 5).map((ret) => (
                    <div key={ret.id} className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">
                          {ret.machine.machineModel.name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          from {ret.machine.supply?.distributor.organizationName ?? 'Unknown'}
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(ret.returnDate), "MMM d, yyyy")}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Return Analysis */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <PackageX className="h-5 w-5 text-primary/60" />
              <h2 className="font-semibold">Return Analysis</h2>
            </div>
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium mb-4">Common Return Reasons</h3>
                <div className="space-y-4">
                  {data.returnReasons.map((reason) => (
                    <div key={reason.returnReason} className="flex items-center justify-between">
                      <div className="font-medium">{reason.returnReason}</div>
                      <div className="text-sm text-muted-foreground">
                        {reason._count} returns
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-sm font-medium mb-4">Model Return Rates</h3>
                <div className="space-y-4">
                  {data.modelReturnRates.map((model) => (
                    <div key={model.name} className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{model.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {model.returnedMachines} of {model.totalMachines} returned
                        </div>
                      </div>
                      <div className="font-medium">
                        {model.returnRate.toFixed(1)}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
} 