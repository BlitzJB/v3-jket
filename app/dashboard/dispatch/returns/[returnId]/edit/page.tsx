'use client'

import { use, useState } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { CalendarIcon, Building2, Package } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { useEffect } from "react"

interface Return {
  id: string
  returnDate: string
  returnReason: string
  machine: {
    id: string
    serialNumber: string
    machineModel: {
      name: string
      category: {
        name: string
      }
    }
    supply: {
      id: string
      supplyDate: string
      distributor: {
        id: string
        name: string
        organizationName: string
        region: string
      }
    }
  }
}

export default function EditReturnPage({
  params,
}: {
  params: Promise<{ returnId: string }>
}) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [returnData, setReturnData] = useState<Return | null>(null)
  const [returnDate, setReturnDate] = useState<Date | null>(null)
  const [returnReason, setReturnReason] = useState("")
  const { returnId } = use(params)

  useEffect(() => {
    fetch(`/api/dispatch/returns/${returnId}`)
      .then((res) => res.json())
      .then((data) => {
        setReturnData(data)
        setReturnDate(new Date(data.returnDate))
        setReturnReason(data.returnReason)
      })
      .catch((error) => {
        console.error("Error fetching return:", error)
        toast.error("Failed to load return data")
      })
  }, [returnId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!returnData || !returnDate) {
      toast.error("Please select a return date")
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/dispatch/returns/${returnId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          returnDate,
          returnReason,
        }),
      })

      if (!res.ok) {
        throw new Error(await res.text())
      }

      toast.success("Return updated successfully")
      router.push(`/dashboard/dispatch/returns/${returnId}`)
      router.refresh()
    } catch (error) {
      console.error(error)
      toast.error(error instanceof Error ? error.message : "Failed to update return")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!returnData) {
    return (
      <div className="p-8">
        <div className="max-w-2xl mx-auto">
          <Card className="p-6">
            <div className="h-[400px] flex items-center justify-center">
              <div className="text-muted-foreground">Loading...</div>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Edit Return</h1>
          <p className="text-muted-foreground mt-1">
            Update the return details for this machine
          </p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div>
              <h3 className="text-sm font-medium mb-3">Machine Information</h3>
              <div className="bg-muted rounded-lg p-4 space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Package className="h-4 w-4 text-primary/60" />
                    <h4 className="font-medium">Machine Details</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Serial Number</div>
                      <div className="font-medium">{returnData.machine.serialNumber}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Model</div>
                      <div className="font-medium">
                        {returnData.machine.machineModel.name} - {returnData.machine.machineModel.category.name}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Building2 className="h-4 w-4 text-primary/60" />
                    <h4 className="font-medium">Distributor Details</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Organization</div>
                      <div className="font-medium">{returnData.machine.supply.distributor.organizationName}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Contact Person</div>
                      <div className="font-medium">{returnData.machine.supply.distributor.name}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Supply Date</div>
                      <div className="font-medium">{format(new Date(returnData.machine.supply.supplyDate), "PPP")}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Region</div>
                      <div className="font-medium">{returnData.machine.supply.distributor.region}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <label className="text-sm font-medium mb-2 block">Return Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !returnDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {returnDate ? format(returnDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={returnDate || undefined}
                    onSelect={(date: Date | undefined) => setReturnDate(date ?? null)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Return Reason</label>
              <Textarea
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
                placeholder="Explain why the machine is being returned..."
                className="min-h-[100px]"
              />
            </div>

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving Changes..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  )
}