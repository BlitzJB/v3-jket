import { withPermission } from "@/lib/rbac/server"
import { prisma } from "@/lib/prisma"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { format, subDays, startOfMonth } from "date-fns"
import {
  ArrowUpIcon,
  ArrowDownIcon,
  ClipboardCheck,
  AlertTriangle,
  Activity,
  BarChart3,
} from "lucide-react"
import { DataTable } from "@/components/ui/data-table"
import Link from "next/link"

interface TestResult {
  range?: string
  condition: string
  passed: boolean
}

async function getDashboardData() {
  return withPermission("quality:read", async () => {
    const today = new Date()
    const monthStart = startOfMonth(today)
    const lastMonth = subDays(monthStart, 30)

    // Get all machines with test results
    const machines = await prisma.machine.findMany({
      select: {
        id: true,
        serialNumber: true,
        manufacturingDate: true,
        testResultData: true,
        testAdditionalNotes: true,
        machineModel: {
          select: {
            id: true,
            name: true,
            category: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        manufacturingDate: "desc",
      },
    })

    // Calculate metrics
    const totalMachines = machines.length
    const thisMonthMachines = machines.filter(
      m => new Date(m.manufacturingDate) >= monthStart
    ).length
    const lastMonthMachines = machines.filter(
      m => {
        const date = new Date(m.manufacturingDate)
        return date >= lastMonth && date < monthStart
      }
    ).length

    // Calculate pass rates and test statistics
    const machineStats = machines.map(machine => {
      const testResults = (machine.testResultData as unknown) as Record<string, TestResult>
      const totalTests = Object.keys(testResults || {}).length
      const passedTests = Object.values(testResults || {}).filter(result => result.passed).length

      return {
        totalTests,
        passedTests,
        isPassed: totalTests > 0 && passedTests === totalTests,
        category: machine.machineModel.category.name,
        tests: testResults || {},
      }
    })

    const passRate = (machineStats.filter(m => m.isPassed).length / totalMachines * 100).toFixed(1)
    const avgTestsPerMachine = (machineStats.reduce((acc, curr) => acc + curr.totalTests, 0) / totalMachines).toFixed(1)

    // Calculate category statistics
    const categoryStats = machineStats.reduce((acc, curr) => {
      if (!acc[curr.category]) {
        acc[curr.category] = {
          total: 0,
          passed: 0,
          tests: {},
        }
      }

      acc[curr.category].total++
      if (curr.isPassed) acc[curr.category].passed++

      // Aggregate test results
      Object.entries(curr.tests).forEach(([testName, result]) => {
        if (!acc[curr.category].tests[testName]) {
          acc[curr.category].tests[testName] = {
            total: 0,
            passed: 0,
          }
        }

        acc[curr.category].tests[testName].total++
        if (result.passed) {
          acc[curr.category].tests[testName].passed++
        }
      })

      return acc
    }, {} as Record<string, any>)

    // Get most problematic tests
    const testStats = Object.entries(categoryStats).flatMap(([category, data]: [string, any]) => 
      Object.entries(data.tests).map(([test, stats]: [string, any]) => ({
        category,
        test,
        ...stats,
        failRate: ((stats.total - stats.passed) / stats.total * 100).toFixed(1),
      }))
    ).sort((a, b) => Number(b.failRate) - Number(a.failRate))

    return {
      metrics: {
        totalMachines,
        thisMonthMachines,
        lastMonthMachines,
        passRate,
        avgTestsPerMachine,
      },
      categoryStats,
      testStats: testStats.slice(0, 5),
      recentMachines: machines.slice(0, 5),
    }
  })
}

export default async function QualityTestingDashboard() {
  const data = await getDashboardData()
  const monthlyGrowth = ((data.metrics.thisMonthMachines - data.metrics.lastMonthMachines) / 
    data.metrics.lastMonthMachines * 100).toFixed(1)

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Quality Testing Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Overview of quality testing metrics and insights
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-6 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground">Total Machines Tested</h3>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex items-baseline justify-between">
            <p className="text-2xl font-bold">{data.metrics.totalMachines}</p>
            <div className="flex items-center gap-1">
              {Number(monthlyGrowth) > 0 ? (
                <>
                  <ArrowUpIcon className="h-4 w-4 text-success" />
                  <span className="text-sm text-success">{monthlyGrowth}%</span>
                </>
              ) : (
                <>
                  <ArrowDownIcon className="h-4 w-4 text-destructive" />
                  <span className="text-sm text-destructive">{monthlyGrowth}%</span>
                </>
              )}
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            {data.metrics.thisMonthMachines} this month
          </p>
        </Card>

        <Card className="p-6 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground">Overall Pass Rate</h3>
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-2xl font-bold">{data.metrics.passRate}%</p>
          <p className="text-sm text-muted-foreground">
            of all machines tested
          </p>
        </Card>

        <Card className="p-6 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground">Avg Tests per Machine</h3>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-2xl font-bold">{data.metrics.avgTestsPerMachine}</p>
          <p className="text-sm text-muted-foreground">
            tests conducted per machine
          </p>
        </Card>

        <Card className="p-6 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground">Critical Issues</h3>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-2xl font-bold">
            {data.testStats.filter(t => Number(t.failRate) > 10).length}
          </p>
          <p className="text-sm text-muted-foreground">
            tests with &gt;10% failure rate
          </p>
        </Card>
      </div>

      {/* Category Performance */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Most Problematic Tests</h3>
          <div className="space-y-4">
            {data.testStats.map((stat: any) => (
              <div key={stat.test} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{stat.test}</p>
                    <p className="text-sm text-muted-foreground">{stat.category}</p>
                  </div>
                  <Badge variant="destructive">
                    {stat.failRate}% Failure Rate
                  </Badge>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary"
                    style={{ width: `${100 - Number(stat.failRate)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Category Performance</h3>
          <div className="space-y-4">
            {Object.entries(data.categoryStats).map(([category, stats]: [string, any]) => (
              <div key={category} className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{category}</p>
                  <Badge variant={stats.passed / stats.total >= 0.9 ? "success" : "secondary"}>
                    {((stats.passed / stats.total) * 100).toFixed(1)}% Pass Rate
                  </Badge>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary"
                    style={{ width: `${(stats.passed / stats.total) * 100}%` }}
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  {stats.total} machines tested
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Recent Tests */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Tests</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 font-medium">Serial Number</th>
                <th className="text-left py-2 font-medium">Category</th>
                <th className="text-left py-2 font-medium">Model</th>
                <th className="text-left py-2 font-medium">Date</th>
                <th className="text-left py-2 font-medium">Status</th>
                <th className="text-left py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {data.recentMachines.map((machine: any) => {
                const testResults = machine.testResultData as Record<string, TestResult>
                const totalTests = Object.keys(testResults).length
                const passedTests = Object.values(testResults).filter(result => result.passed).length
                const isPassed = totalTests > 0 && passedTests === totalTests

                return (
                  <tr key={machine.id} className="border-b last:border-0">
                    <td className="py-2">{machine.serialNumber}</td>
                    <td className="py-2">{machine.machineModel.category.name}</td>
                    <td className="py-2">{machine.machineModel.name}</td>
                    <td className="py-2">{format(new Date(machine.manufacturingDate), "PP")}</td>
                    <td className="py-2">
                      <Badge variant={isPassed ? "success" : "secondary"}>
                        {isPassed ? "Passed" : "Issues Found"}
                      </Badge>
                    </td>
                    <td className="py-2">
                      <Link 
                        href={`/dashboard/quality-testing/history/${machine.id}`}
                        className="text-sm text-primary hover:underline"
                      >
                        View Details
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}