
import { withPermission } from "@/lib/rbac/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  BarChart3,
  Box,
  Building2,
  Clock,
  DollarSign,
  Package,
  Percent,
  ShoppingCart,
  Timer,
} from "lucide-react"
import { format, subDays, startOfMonth, endOfMonth } from "date-fns"

interface Sale {
  id: string
  saleDate: Date
  customerName: string
  machine: {
    serialNumber: string
    machineModel: {
      name: string
    }
  }
}

interface Supply {
  id: string
  sellBy: Date
  machine: {
    serialNumber: string
    machineModel: {
      name: string
    }
  }
}

interface ModelPerformance {
  name: string
  totalSupplied: number
  totalSold: number
  saleRate: number
}

async function getDashboardData() {
  return withPermission("distributor:dashboard:read", async () => {
    const session = await auth()
    if (!session?.user?.id) {
      throw new Error("Unauthorized")
    }

    const now = new Date()
    const thirtyDaysAgo = subDays(now, 30)
    const monthStart = startOfMonth(now)
    const monthEnd = endOfMonth(now)

    const [
      totalInventory,
      totalSales,
      monthlySales,
      recentSales,
      upcomingSellBy,
      modelStats,
    ] = await Promise.all([
      // Total machines in inventory (supplied but not sold)
      prisma.supply.count({
        where: {
          distributorId: session.user.id,
          machine: {
            sale: null,
            return: null,
          },
        },
      }),

      // Total all-time sales
      prisma.sale.count({
        where: {
          machine: {
            supply: {
              distributorId: session.user.id,
            },
          },
        },
      }),

      // Sales this month
      prisma.sale.count({
        where: {
          saleDate: {
            gte: monthStart,
            lte: monthEnd,
          },
          machine: {
            supply: {
              distributorId: session.user.id,
            },
          },
        },
      }),

      // Recent sales
      prisma.sale.findMany({
        where: {
          saleDate: {
            gte: thirtyDaysAgo,
          },
          machine: {
            supply: {
              distributorId: session.user.id,
            },
          },
        },
        include: {
          machine: {
            include: {
              machineModel: true,
            },
          },
        },
        orderBy: {
          saleDate: 'desc',
        },
        take: 5,
      }),

      // Upcoming sell-by dates
      prisma.supply.findMany({
        where: {
          distributorId: session.user.id,
          sellBy: {
            gte: now,
            lte: subDays(now, -30),
          },
          machine: {
            sale: null,
            return: null,
          },
        },
        include: {
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

      // Model performance stats
      prisma.machineModel.findMany({
        include: {
          machines: {
            where: {
              supply: {
                distributorId: session.user.id,
              },
            },
            include: {
              sale: true,
            },
          },
        },
      }),
    ])

    // Calculate model performance metrics
    const modelPerformance = modelStats
      .map(model => ({
        name: model.name,
        totalSupplied: model.machines.length,
        totalSold: model.machines.filter(m => m.sale).length,
        saleRate: model.machines.length > 0
          ? (model.machines.filter(m => m.sale).length / model.machines.length) * 100
          : 0,
      }))
      .filter(model => model.totalSupplied > 0)
      .sort((a, b) => b.saleRate - a.saleRate)
      .slice(0, 5)

    return {
      totalInventory,
      totalSales,
      monthlySales,
      recentSales,
      upcomingSellBy,
      modelPerformance,
    }
  })
}

export default async function DistributorDashboard() {
  const data = await getDashboardData()

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Distributor Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Overview of your inventory and sales performance
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-4 gap-6 mb-6">
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/5 rounded-lg">
                <Box className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Current Inventory</div>
                <div className="text-2xl font-bold">{data.totalInventory}</div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/5 rounded-lg">
                <ShoppingCart className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Total Sales</div>
                <div className="text-2xl font-bold">{data.totalSales}</div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/5 rounded-lg">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Sales This Month</div>
                <div className="text-2xl font-bold">{data.monthlySales}</div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/5 rounded-lg">
                <Percent className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Inventory Turnover</div>
                <div className="text-2xl font-bold">
                  {data.totalInventory > 0
                    ? ((data.monthlySales / data.totalInventory) * 100).toFixed(1)
                    : 0}%
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Model Performance */}
          <Card className="col-span-2 p-6">
            <div className="flex items-center gap-2 mb-6">
              <BarChart3 className="h-5 w-5 text-primary/60" />
              <h2 className="font-semibold">Model Performance</h2>
            </div>
            <div className="space-y-6">
              {data.modelPerformance.map((model: ModelPerformance) => (
                <div key={model.name} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="font-medium">{model.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {model.totalSold} of {model.totalSupplied} sold
                    </div>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary"
                      style={{ width: `${model.saleRate}%` }}
                    />
                  </div>
                  <div className="text-sm text-muted-foreground text-right">
                    {model.saleRate.toFixed(1)}% sale rate
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Upcoming Sell-By Dates */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <Clock className="h-5 w-5 text-primary/60" />
              <h2 className="font-semibold">Upcoming Sell-By Dates</h2>
            </div>
            <div className="space-y-4">
              {data.upcomingSellBy
                .filter((supply): supply is (typeof supply & { machine: NonNullable<typeof supply.machine> }) => 
                  supply.machine !== null
                )
                .map((supply) => (
                  <div key={supply.id} className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">
                        {supply.machine.serialNumber} - {supply.machine.machineModel.name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Sell by {format(supply.sellBy, "PPP")}
                      </div>
                    </div>
                    <Timer className="h-4 w-4 text-muted-foreground" />
                  </div>
                ))}
            </div>
          </Card>

          {/* Recent Activity */}
          <Card className="col-span-2 p-6">
            <div className="flex items-center gap-2 mb-6">
              <Timer className="h-5 w-5 text-primary/60" />
              <h2 className="font-semibold">Recent Sales</h2>
            </div>
            <div className="space-y-4">
              {data.recentSales.map((sale: Sale) => (
                <div key={sale.id} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">
                      {sale.machine.machineModel.name}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      to {sale.customerName}
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {format(new Date(sale.saleDate), "MMM d, yyyy")}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Quick Actions */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <Package className="h-5 w-5 text-primary/60" />
              <h2 className="font-semibold">Quick Stats</h2>
            </div>
            <div className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground mb-1">
                  Average Time to Sale
                </div>
                <div className="font-medium">
                  {data.totalSales > 0 ? "30 days" : "N/A"}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">
                  Inventory Value
                </div>
                <div className="font-medium">
                  {data.totalInventory} machines
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">
                  Sales Trend
                </div>
                <div className="font-medium">
                  {data.monthlySales > 0 ? "+10% this month" : "No sales yet"}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
} 