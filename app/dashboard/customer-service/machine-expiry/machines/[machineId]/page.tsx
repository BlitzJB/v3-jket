import { withPermission } from "@/lib/rbac/server"
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { format, formatDistanceToNow, isBefore } from "date-fns"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"
import {
  ArrowLeft,
  Box,
  Building2,
  Calendar,
  Clock,
  FileText,
  AlertTriangle,
  Edit,
  CheckCircle2,
  XCircle,
} from "lucide-react"
import { testCategories } from "@/app/dashboard/quality-testing/log-test/test-config"

async function getMachineData(machineId: string) {
  return withPermission("distributor:sales:read", async () => {
    const machine = await prisma.machine.findUnique({
      where: {
        id: machineId,
        sale: null, // Only show machines that haven't been sold
      },
      include: {
        machineModel: {
          include: {
            category: true,
          },
        },
        supply: {
          include: {
            distributor: true,
          },
        },
      },
    })

    if (!machine || !machine.supply) {
      return null
    }

    return machine
  })
}

function getExpiryStatus(date: Date) {
  const daysUntilExpiry = Math.ceil(
    (new Date(date).getTime() - new Date().getTime()) / 
    (1000 * 60 * 60 * 24)
  )

  if (daysUntilExpiry <= 0) return "destructive"
  if (daysUntilExpiry <= 7) return "destructive"
  if (daysUntilExpiry <= 30) return "secondary"
  return "default"
}

function TestResultSection({ name, result }: { name: string, result: { range?: string, condition: string, passed: boolean } }) {
  return (
    <div className="flex items-center justify-between py-2 border-b last:border-0">
      <div className="space-y-1">
        <div className="font-medium">{name}</div>
        {result.range && (
          <div className="text-sm text-muted-foreground">
            Range: {result.range}
          </div>
        )}
        {result.condition && (
          <div className="text-sm text-muted-foreground">
            Condition: {result.condition}
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        {result.passed ? (
          <>
            <CheckCircle2 className="h-5 w-5 text-success" />
            <span className="text-sm font-medium text-success">Pass</span>
          </>
        ) : (
          <>
            <XCircle className="h-5 w-5 text-destructive" />
            <span className="text-sm font-medium text-destructive">Fail</span>
          </>
        )}
      </div>
    </div>
  )
}

export default async function MachineDetailsPage({
  params,
}: {
  params: Promise<{ machineId: string }>
}) {
  const { machineId } = await params
  const machine = await getMachineData(machineId)

  if (!machine || !machine.supply) {
    notFound()
  }

  const today = new Date()
  const sellByStatus = getExpiryStatus(machine.supply.sellBy)
  const isExpired = isBefore(machine.supply.sellBy, today)
  const testResults = machine.testResultData as Record<string, { range?: string, condition: string, passed: boolean }>

  return (
    <div className="p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Button
              variant="ghost"
              className="mb-2"
              asChild
            >
              <Link href="/dashboard/sales/machines">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Machines
              </Link>
            </Button>
            <h1 className="text-2xl font-bold">Machine Details</h1>
            <p className="text-muted-foreground mt-1">
              View complete information about this machine
            </p>
          </div>
          <Button asChild>
            <Link href={`/dashboard/sales/machines/${machine.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Machine
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Main Info */}
          <Card className="col-span-2">
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4">Machine Information</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium mb-3 flex items-center gap-2">
                    <Box className="h-4 w-4" />
                    Machine Details
                  </h3>
                  <div className="bg-muted rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-muted-foreground">Serial Number</div>
                        <div className="font-medium">{machine.serialNumber}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Model</div>
                        <div className="font-medium">{machine.machineModel.name}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Category</div>
                        <div className="font-medium">{machine.machineModel.category.name}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Manufacturing Date</div>
                        <div className="font-medium">
                          {format(machine.manufacturingDate, "PPP")}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="font-medium mb-3 flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Distributor Information
                  </h3>
                  <div className="bg-muted rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-muted-foreground">Organization</div>
                        <div className="font-medium">{machine.supply.distributor.organizationName}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Contact Person</div>
                        <div className="font-medium">{machine.supply.distributor.name}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Region</div>
                        <div className="font-medium">{machine.supply.distributor.region}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Phone Number</div>
                        <div className="font-medium">{machine.supply.distributor.phoneNumber}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="font-medium mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Test Results
                  </h3>
                  <div className="space-y-6">
                    {testCategories.map((category) => (
                      <Card key={category.name}>
                        <div className="p-4">
                          <h4 className="font-medium mb-4">{category.name}</h4>
                          <div className="space-y-1">
                            {category.tests.map((test) => {
                              const result = testResults[test.name]
                              if (!result) return null
                              return (
                                <TestResultSection
                                  key={test.name}
                                  name={test.name}
                                  result={result}
                                />
                              )
                            })}
                          </div>
                        </div>
                      </Card>
                    ))}

                    {machine.testAdditionalNotes && (
                      <div className="bg-muted rounded-lg p-4">
                        <div className="text-sm font-medium mb-2">Additional Test Notes</div>
                        <p className="text-sm whitespace-pre-wrap">{machine.testAdditionalNotes}</p>
                      </div>
                    )}

                    {machine.supply.notes && (
                      <div className="bg-muted rounded-lg p-4">
                        <div className="text-sm font-medium mb-2">Supply Notes</div>
                        <p className="text-sm whitespace-pre-wrap">{machine.supply.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <div className="space-y-6">
            {/* Status Card */}
            <Card>
              <div className="p-6">
                <h2 className="text-lg font-semibold mb-4">Status</h2>
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1.5">Current Status</div>
                    <Badge variant={sellByStatus} className="text-sm">
                      {isExpired ? "Expired" : "Active"}
                    </Badge>
                  </div>

                  {isExpired && (
                    <div>
                      <div className="text-sm text-muted-foreground mb-1.5">Alert</div>
                      <div className="bg-destructive/10 text-destructive rounded-lg p-3 space-y-2">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4" />
                          <span className="font-medium">Machine has expired</span>
                        </div>
                        <div className="text-sm">
                          This machine's sell-by date has passed. Please update the date or take appropriate action.
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* Important Dates */}
            <Card>
              <div className="p-6">
                <h2 className="text-lg font-semibold mb-4">Important Dates</h2>
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1.5">Supply Date</div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-primary" />
                      <span>{format(machine.supply.supplyDate, "PPP")}</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1.5">Sell By Date</div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-primary" />
                      <span>{format(machine.supply.sellBy, "PPP")}</span>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {isExpired 
                        ? `Expired ${formatDistanceToNow(machine.supply.sellBy, { addSuffix: true })}` 
                        : `Expires ${formatDistanceToNow(machine.supply.sellBy, { addSuffix: true })}`
                      }
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Metadata */}
            <Card>
              <div className="p-6">
                <h2 className="text-lg font-semibold mb-4">Metadata</h2>
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1.5">Created At</div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{format(machine.createdAt, "PPP p")}</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1.5">Last Updated</div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{format(machine.updatedAt, "PPP p")}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
} 