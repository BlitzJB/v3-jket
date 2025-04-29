'use client'

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Building2,
  Calendar,
  Clock,
  Edit,
  Globe,
  Package,
  Tag,
  User,
  ArrowLeft,
  Boxes,
} from "lucide-react"
import { Separator } from "@/components/ui/separator"

interface Supply {
  id: string
  supplyDate: string
  sellBy: string
  notes: string | null
  createdAt: string
  updatedAt: string
  machine: {
    id: string
    serialNumber: string
    machineModel: {
      id: string
      name: string
      shortCode: string
      category: {
        id: string
        name: string
        shortCode: string
      }
    }
    return: {
      id: string
      returnDate: string
      returnReason: string
    } | null
  }
  distributor: {
    id: string
    name: string
    organizationName: string
    region: string
  }
}

interface PageProps {
  params: Promise<{
    supplyId: string
  }>
}

export default function SupplyDetailsPage({ params }: PageProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [supply, setSupply] = useState<Supply | null>(null)
  const { supplyId } = use(params)

  useEffect(() => {
    async function fetchSupply() {
      try {
        const res = await fetch(`/api/dispatch/supplies/${supplyId}`)
        if (!res.ok) throw new Error("Failed to fetch supply")
        
        const data = await res.json()
        setSupply(data)
      } catch (error) {
        console.error(error)
        toast.error("Failed to fetch supply details")
        router.push("/dashboard/dispatch/supplies")
      } finally {
        setIsLoading(false)
      }
    }

    fetchSupply()
  }, [supplyId, router])

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse max-w-5xl mx-auto">
          <div className="h-8 w-48 bg-gray-200 rounded mb-4" />
          <div className="h-4 w-64 bg-gray-200 rounded mb-8" />
          <div className="grid grid-cols-2 gap-6">
            <div className="h-[200px] bg-gray-200 rounded" />
            <div className="h-[200px] bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    )
  }

  if (!supply) return null

  const hasReturn = supply.machine.return !== null

  return (
    <div className="p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Button
              variant="ghost"
              className="mb-2"
              onClick={() => router.back()}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Supplies
            </Button>
            <h1 className="text-2xl font-bold">Supply Details</h1>
            <p className="text-muted-foreground">
              View complete information about this supply
            </p>
          </div>
          <Button onClick={() => router.push(`/dashboard/dispatch/supplies/${supply.id}/edit`)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Supply
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <Card className="col-span-2">
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4">Supply Information</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium mb-3 flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Machine Details
                  </h3>
                  <div className="bg-muted rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-muted-foreground">Serial Number</div>
                        <div className="font-medium">{supply.machine.serialNumber}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Model</div>
                        <div className="font-medium">{supply.machine.machineModel.name}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Category</div>
                        <div className="font-medium">{supply.machine.machineModel.category.name}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Model Code</div>
                        <div className="font-medium">{supply.machine.machineModel.shortCode}</div>
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
                        <div className="font-medium">{supply.distributor.organizationName}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Contact Person</div>
                        <div className="font-medium">{supply.distributor.name}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Region</div>
                        <div className="font-medium">{supply.distributor.region}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />
                
                <div>
                  <h3 className="font-medium mb-3 flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    Additional Notes
                  </h3>
                  <div className="bg-muted rounded-lg p-4">
                    {supply.notes ? (
                      <p className="text-sm whitespace-pre-wrap">{supply.notes}</p>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">No additional notes provided</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <div className="space-y-6">
            <Card>
              <div className="p-6">
                <h2 className="text-lg font-semibold mb-4">Status</h2>
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1.5">Current Status</div>
                    <Badge variant={hasReturn ? "destructive" : "success"} className="text-sm">
                      {hasReturn ? "Returned" : "Active"}
                    </Badge>
                  </div>

                  {hasReturn && supply.machine.return && (
                    <div>
                      <div className="text-sm text-muted-foreground mb-1.5">Return Information</div>
                      <div className="bg-muted rounded-lg p-3 space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>Returned on {format(new Date(supply.machine.return.returnDate), "PPP")}</span>
                        </div>
                        <div className="text-sm">
                          Reason: {supply.machine.return.returnReason}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            <Card>
              <div className="p-6">
                <h2 className="text-lg font-semibold mb-4">Important Dates</h2>
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1.5">Supply Date</div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-primary" />
                      <span>{format(new Date(supply.supplyDate), "PPP")}</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1.5">Sell By Date</div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-primary" />
                      <span>{format(new Date(supply.sellBy), "PPP")}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <div className="p-6">
                <h2 className="text-lg font-semibold mb-4">Metadata</h2>
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1.5">Created At</div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{format(new Date(supply.createdAt), "PPP p")}</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1.5">Last Updated</div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{format(new Date(supply.updatedAt), "PPP p")}</span>
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