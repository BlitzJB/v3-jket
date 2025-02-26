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

interface Props {
  params: {
    machineId: string
  }
}

async function getMachineData(machineId: string) {
  return withPermission("quality:read", async () => {
    const machine = await prisma.machine.findUnique({
      where: {
        id: machineId,
      },
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
            shortCode: true,
            category: {
              select: {
                id: true,
                name: true,
                shortCode: true,
              },
            },
          },
        },
      },
    })

    if (!machine) {
      notFound()
    }

    return machine
  })
}

const testCategories = [
  {
    name: "Mechanical Testing",
    tests: [
      { name: "Flow Rate", type: "both" },
      { name: "Suction Power", type: "both" },
      { name: "Temperature", type: "both" },
      { name: "Pressure", type: "both" },
      { name: "Hours of Running Test", type: "both" },
      { name: "Motor Bearing Condition", type: "both" },
      { name: "Shaft Movement", type: "both" },
      { name: "Leakages from Valves/Couplings", type: "both" },
      { name: "Hose Clamping Quality", type: "both" },
      { name: "Parts are Fit Where It Should", type: "both" },
      { name: "Bolting Quality", type: "both" },
      { name: "3 Way Valves Condition", type: "both" },
      { name: "Flow Direction", type: "both" }
    ]
  },
  {
    name: "Electrical Testing",
    tests: [
      { name: "Terminal Box Quality", type: "both" },
      { name: "Terminal Supply Pin", type: "both" },
      { name: "Wiring Condition", type: "both" },
      { name: "Motor Name Plate", type: "both" },
      { name: "Voltage Rating", type: "both" },
      { name: "Ampere Rating", type: "both" },
      { name: "Motor Power", type: "both" },
      { name: "Motor Sound", type: "both" },
      { name: "Winding Condition", type: "both" },
      { name: "Insulation Resistance Test", type: "both" },
      { name: "Stator Poles", type: "both" },
      { name: "Motor Efficiency", type: "both" },
      { name: "Polarity Test", type: "both" },
      { name: "Earth Continuity Test", type: "both" },
      { name: "Shaft Speed(rpm)", type: "both" }
    ]
  },
  {
    name: "Electronics Testing",
    tests: [
      { name: "Display Quality", type: "condition" },
      { name: "Sensor Reading", type: "condition" },
      { name: "Display Inches", type: "condition" },
      { name: "Operating Temperature", type: "condition" },
      { name: "Frequency as per Specification", type: "condition" },
      { name: "Power Source", type: "condition" },
      { name: "IF DC Battery Capacity", type: "condition" },
      { name: "Screen Touch Quality", type: "condition" }
    ]
  },
  {
    name: "Physical Observation",
    tests: [
      { name: "Visual Aesthetics", type: "condition" },
      { name: "No Dent or Damage", type: "condition" },
      { name: "SL No Sticker Placing", type: "condition" },
      { name: "Power Flush Sticker Placing", type: "condition" },
      { name: "Product Painting", type: "condition" },
      { name: "All Accessories Packed", type: "condition" },
      { name: "Openings Correctly Covered", type: "condition" },
      { name: "All Bolt Tightness", type: "condition" },
      { name: "Final Packing Quality", type: "condition" },
      { name: "Weight Checking", type: "condition" },
      { name: "Quantity Checking", type: "condition" },
      { name: "Check the Handling Process of Loading", type: "condition" }
    ]
  }
]

export default async function MachineDetailsPage({ params }: Props) {
  const machine = await getMachineData(params.machineId)
  const testResults = machine.testResultData as Record<string, any>

  const getTestResultStatus = (result: any) => {
    if (!result?.condition) return "default"
    const condition = result.condition.toLowerCase()
    return condition.includes('pass') || condition.includes('good') 
      ? undefined
      : undefined
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <Link href="/dashboard/quality-testing/history">
          <Button variant="ghost" className="gap-2 mb-4">
            <ArrowLeft className="h-4 w-4" />
            Back to History
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Machine Test Details</h1>
        <p className="text-muted-foreground mt-1">
          Detailed quality test results for machine
        </p>
      </div>

      <div className="grid gap-6">
        <Card className="p-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h2 className="font-semibold mb-4">Machine Information</h2>
              <dl className="space-y-2">
                <div className="flex gap-2">
                  <dt className="font-medium">Serial Number:</dt>
                  <dd>{machine.serialNumber}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="font-medium">Category:</dt>
                  <dd>{machine.machineModel.category.name}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="font-medium">Model:</dt>
                  <dd>{machine.machineModel.name}</dd>
                </div>
              </dl>
            </div>
            <div>
              <h2 className="font-semibold mb-4">Test Information</h2>
              <dl className="space-y-2">
                <div className="flex gap-2">
                  <dt className="font-medium">Manufacturing Date:</dt>
                  <dd>{format(new Date(machine.manufacturingDate), "PPP")}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="font-medium">Additional Notes:</dt>
                  <dd>{machine.testAdditionalNotes || "—"}</dd>
                </div>
              </dl>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="font-semibold mb-4">Test Results</h2>
          <Tabs defaultValue={testCategories[0].name} className="space-y-4">
            <TabsList className="grid grid-cols-4 gap-4">
              {testCategories.map(category => (
                <TabsTrigger
                  key={category.name}
                  value={category.name}
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  {category.name}
                </TabsTrigger>
              ))}
            </TabsList>

            {testCategories.map(category => (
              <TabsContent key={category.name} value={category.name}>
                <Card>
                  <div className="p-6 space-y-4">
                    {category.tests.map(test => {
                      const result = testResults[test.name]
                      if (!result) return null

                      return (
                        <div key={test.name} className="grid grid-cols-3 gap-4 py-2 border-b last:border-0">
                          <div>
                            <h3 className="font-medium">{test.name}</h3>
                          </div>
                          <div>
                            {test.type === 'both' && (
                              <div className="space-y-1">
                                <div className="text-sm text-muted-foreground">Range</div>
                                <div>{result.range || "—"}</div>
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="space-y-1">
                              <div className="text-sm text-muted-foreground">Condition</div>
                              <Badge variant={getTestResultStatus(result)}>
                                {result.condition || "Not Assessed"}
                              </Badge>
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
        </Card>
      </div>
    </div>
  )
} 