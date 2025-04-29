'use client'

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { format, addMonths } from "date-fns"
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
import { CalendarIcon } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { PickerDialog } from "../../picker-dialog"

interface Supply {
  id: string
  supplyDate: string
  sellBy: string
  notes: string
  machine: {
    id: string
    serialNumber: string
    machineModel: {
      name: string
      category: {
        name: string
      }
    }
  }
  distributor: {
    id: string
    organizationName: string
  }
}

interface Distributor {
  id: string
  name: string
  organizationName: string
  region: string
}

function isDistributor(item: any): item is Distributor {
  return 'organizationName' in item && !('serialNumber' in item)
}

interface PageProps {
  params: Promise<{
    supplyId: string
  }>
}

export default function EditSupplyPage({ params }: PageProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [supply, setSupply] = useState<Supply | null>(null)
  const [selectedDistributor, setSelectedDistributor] = useState<{
    id: string
    organizationName: string
  } | null>(null)
  const [supplyDate, setSupplyDate] = useState<Date>(new Date())
  const [sellBy, setSellBy] = useState<Date>(addMonths(new Date(), 6))
  const [notes, setNotes] = useState("")
  const { supplyId } = use(params)

  useEffect(() => {
    async function fetchSupply() {
      try {
        const res = await fetch(`/api/dispatch/supplies/${supplyId}`)
        if (!res.ok) throw new Error("Failed to fetch supply")
        
        const data = await res.json()
        setSupply(data)
        setSelectedDistributor({
          id: data.distributor.id,
          organizationName: data.distributor.organizationName,
        })
        setSupplyDate(new Date(data.supplyDate))
        setSellBy(new Date(data.sellBy))
        setNotes(data.notes || "")
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedDistributor || !supply) {
      toast.error("Please select a distributor")
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/dispatch/supplies/${supplyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          distributorId: selectedDistributor.id,
          supplyDate,
          sellBy,
          notes,
        }),
      })

      if (!res.ok) {
        throw new Error(await res.text())
      }

      toast.success("Supply updated successfully")
      router.push("/dashboard/dispatch/supplies")
      router.refresh()
    } catch (error) {
      console.error(error)
      toast.error(error instanceof Error ? error.message : "Failed to update supply")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 w-48 bg-gray-200 rounded mb-4" />
          <div className="h-4 w-64 bg-gray-200 rounded mb-8" />
          <div className="space-y-6">
            <div className="h-[400px] bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    )
  }

  if (!supply) return null

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Edit Supply</h1>
        <p className="text-muted-foreground mt-1">
          Update supply details for machine {supply.machine.serialNumber}
        </p>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Machine</label>
              <div className="p-3 bg-muted rounded-md">
                <div className="font-medium">{supply.machine.serialNumber}</div>
                <div className="text-sm text-muted-foreground">
                  {supply.machine.machineModel.name} - {supply.machine.machineModel.category.name}
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Distributor</label>
              <PickerDialog
                type="distributor"
                buttonText={selectedDistributor ? selectedDistributor.organizationName : "Select Distributor"}
                onSelect={(item) => {
                  if (isDistributor(item)) {
                    setSelectedDistributor({
                      id: item.id,
                      organizationName: item.organizationName,
                    })
                  }
                }}
                selectedId={selectedDistributor?.id}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Supply Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !supplyDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {supplyDate ? format(supplyDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={supplyDate}
                      onSelect={(date) => {
                        setSupplyDate(date || new Date())
                        setSellBy(addMonths(date || new Date(), 6))
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Sell By</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !sellBy && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {sellBy ? format(sellBy, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={sellBy}
                      onSelect={(date) => date && setSellBy(date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Additional Notes</label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional notes about this supply..."
                className="min-h-[100px]"
              />
            </div>
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
  )
}