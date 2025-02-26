import Link from "next/link"
import { format } from "date-fns"
import { prisma } from "@/lib/prisma"
import { withPermission } from "@/lib/rbac/server"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  ArrowLeft,
  Building2,
  Calendar,
  Clock,
  Edit,
  Package,
  Tag,
  Truck,
} from "lucide-react"

async function getReturnData(returnId: string) {
  return withPermission("dispatch:read", async () => {
    const returnData = await prisma.return.findUnique({
      where: { id: returnId },
      include: {
        machine: {
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
        },
      },
    })

    if (!returnData) {
      throw new Error("Return not found")
    }

    return returnData
  })
}

export default async function ReturnDetailsPage({
  params,
}: {
  params: { returnId: string }
}) {
  const returnData = await getReturnData(params.returnId)

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/dispatch/returns">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Return Details</h1>
              <p className="text-muted-foreground">
                View details of machine return
              </p>
            </div>
          </div>
          <Link href={`/dashboard/dispatch/returns/${returnData.id}/edit`}>
            <Button>
              <Edit className="mr-2 h-4 w-4" />
              Edit Return
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-6">
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <Package className="h-5 w-5 text-primary/60" />
                <h2 className="font-semibold">Machine Information</h2>
              </div>
              <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">
                    Serial Number
                  </div>
                  <div className="font-medium">
                    {returnData.machine.serialNumber}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">
                    Model
                  </div>
                  <div className="font-medium">
                    {returnData.machine.machineModel.name}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">
                    Category
                  </div>
                  <div className="font-medium">
                    {returnData.machine.machineModel.category.name}
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <Building2 className="h-5 w-5 text-primary/60" />
                <h2 className="font-semibold">Distributor Information</h2>
              </div>
              <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">
                    Organization
                  </div>
                  <div className="font-medium">
                    {returnData.machine.supply.distributor.organizationName}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">
                    Contact Person
                  </div>
                  <div className="font-medium">
                    {returnData.machine.supply.distributor.name}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">
                    Region
                  </div>
                  <div className="font-medium">
                    {returnData.machine.supply.distributor.region}
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <Tag className="h-5 w-5 text-primary/60" />
                <h2 className="font-semibold">Return Reason</h2>
              </div>
              <p className="text-sm leading-relaxed">
                {returnData.returnReason}
              </p>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <Calendar className="h-5 w-5 text-primary/60" />
                <h2 className="font-semibold">Important Dates</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">
                    Supply Date
                  </div>
                  <div className="font-medium">
                    {format(new Date(returnData.machine.supply.supplyDate), "PPP")}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">
                    Return Date
                  </div>
                  <div className="font-medium">
                    {format(new Date(returnData.returnDate), "PPP")}
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <Clock className="h-5 w-5 text-primary/60" />
                <h2 className="font-semibold">Metadata</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">
                    Created At
                  </div>
                  <div className="font-medium">
                    {format(new Date(returnData.createdAt), "PPP")}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">
                    Last Updated
                  </div>
                  <div className="font-medium">
                    {format(new Date(returnData.updatedAt), "PPP")}
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