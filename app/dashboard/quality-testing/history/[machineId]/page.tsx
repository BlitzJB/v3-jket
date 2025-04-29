
import { Metadata } from "next"
import { withPermission } from "@/lib/rbac/server"
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { format } from "date-fns"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { defaultTestConfig } from "@/app/dashboard/admin/equipment/test-config/test-config-manager"

interface Test {
  id: string
  name: string
  type: "both" | "condition"
}

interface TestGroup {
  id: string
  name: string
  tests: Test[]
}

interface TestConfig {
  groups: TestGroup[]
}

interface TestResult {
  range?: string
  condition: string
  passed: boolean
}

interface TestResults {
  [key: string]: TestResult
}

interface Machine {
  id: string
  serialNumber: string
  manufacturingDate: Date
  testResultData: TestResults
  testAdditionalNotes: string | null
  machineModel: {
    id: string
    name: string
    category: {
      id: string
      name: string
      testConfiguration: TestConfig | null
    }
  }
}

async function getMachineData(machineId: string): Promise<Machine | null> {
  return withPermission("quality:read", async () => {
    const machine = await prisma.machine.findUnique({
      where: { id: machineId },
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
                testConfiguration: true
              },
            },
          },
        },
      },
    })

    if (!machine) {
      return null
    }

    const testResultData = machine.testResultData as unknown as TestResults
    const testConfiguration = machine.machineModel.category.testConfiguration as unknown as TestConfig | null

    return {
      ...machine,
      testResultData,
      machineModel: {
        ...machine.machineModel,
        category: {
          ...machine.machineModel.category,
          testConfiguration
        }
      }
    }
  })
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ machineId: string }>
}): Promise<Metadata> {
  const { machineId } = await params
  const machine = await getMachineData(machineId)

  if (!machine) {
    return {
      title: "Not Found | Quality Testing Dashboard",
      description: "The requested machine could not be found",
    }
  }

  return {
    title: `${machine.serialNumber} | Quality Testing Dashboard`,
    description: `Quality test results for machine ${machine.serialNumber}`,
  }
}

export default async function MachineTestDetailPage({
  params,
}: {
  params: Promise<{ machineId: string }>
}) {
  const { machineId } = await params
  const machine = await getMachineData(machineId)

  if (!machine) {
    notFound()
  }

  const testConfig = (machine.machineModel.category.testConfiguration || defaultTestConfig) as TestConfig
  const testResults = machine.testResultData
  const totalTests = Object.keys(testResults).length
  const passedTests = Object.values(testResults).filter(result => result.passed).length
  const isPassed = totalTests > 0 && passedTests === totalTests

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <Link href="/dashboard/quality-testing/history">
          <Button variant="ghost" className="gap-2 mb-4">
            <ArrowLeft className="h-4 w-4" />
            Back to History
          </Button>
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{machine.serialNumber}</h1>
            <p className="text-muted-foreground mt-1">
              {machine.machineModel.category.name} - {machine.machineModel.name}
            </p>
          </div>
          <Badge variant={isPassed ? "success" : "destructive"}>
            {isPassed ? "Passed" : "Failed"}
          </Badge>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Manufacturing Date</p>
            <p className="font-medium">{format(new Date(machine.manufacturingDate), "PPP")}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Test Results</p>
            <p className="font-medium">{passedTests} of {totalTests} tests passed</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue={testConfig.groups[0]?.name} className="space-y-4">
        <TabsList className="grid" style={{ gridTemplateColumns: `repeat(${testConfig.groups.length}, 1fr)` }}>
          {testConfig.groups.map((group: TestGroup) => (
            <TabsTrigger
              key={group.name}
              value={group.name}
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              {group.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {testConfig.groups.map((group: TestGroup) => (
          <TabsContent key={group.name} value={group.name} className="space-y-4">
            <Card>
              <div className="p-6 space-y-4">
                {group.tests.map((test: Test) => {
                  const result = testResults[test.name]
                  if (!result) return null

                  return (
                    <div key={test.name} className="space-y-4 pb-4 border-b last:border-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium">{test.name}</h3>
                        <Badge variant={result.passed ? "success" : "destructive"}>
                          {result.passed ? "Pass" : "Fail"}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        {test.type === 'both' && result.range && (
                          <div>
                            <p className="text-sm text-muted-foreground">Range</p>
                            <p className="font-medium">{result.range}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-sm text-muted-foreground">Condition</p>
                          <p className="font-medium">{result.condition}</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {machine.testAdditionalNotes && (
        <Card className="mt-6">
          <div className="p-6">
            <h3 className="font-medium mb-2">Additional Notes</h3>
            <p className="text-muted-foreground whitespace-pre-wrap">
              {machine.testAdditionalNotes}
            </p>
          </div>
        </Card>
      )}
    </div>
  )
} 