"use client"

import { useState } from "react"
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
import { PickerDialog } from "../../supplies/picker-dialog"

interface Distributor {
  id: string
  name: string
  organizationName: string
  region: string
}

interface Machine {
  id: string
  serialNumber: string
  machineModel: {
    name: string
    category: {
      name: string
    }
  }
  supply?: {
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

function isMachine(item: Machine | Distributor): item is Machine {
  return 'serialNumber' in item && 'machineModel' in item
}

export default function CreateReturnPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null)
  const [returnDate, setReturnDate] = useState<Date>(new Date())
  const [returnReason, setReturnReason] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedMachine) {
      toast.error("Please select a machine")
      return
    }

    if (!selectedMachine.supply) {
      toast.error("Selected machine has no supply information")
      return
    }

    if (!returnReason.trim()) {
      toast.error("Please provide a return reason")
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch("/api/dispatch/returns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          machineId: selectedMachine.id,
          returnDate,
          returnReason,
        }),
      })

      if (!res.ok) {
        throw new Error(await res.text())
      }

      toast.success("Return logged successfully")
      router.push("/dashboard/dispatch/returns")
      router.refresh()
    } catch (error) {
      console.error(error)
      toast.error(error instanceof Error ? error.message : "Failed to log return")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Log Machine Return</h1>
        <p className="text-muted-foreground mt-1">
          Record a machine return from a distributor
        </p>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Machine</label>
              <PickerDialog
                type="supplied-machine"
                buttonText={selectedMachine ? `${selectedMachine.serialNumber} - ${selectedMachine.machineModel.name}` : "Select Machine"}
                onSelect={(item) => {
                  if (isMachine(item)) {
                    setSelectedMachine(item)
                  }
                }}
                selectedId={selectedMachine?.id}
              />
            </div>

            {selectedMachine && (
              <>
                <Separator />
                
                <div>
                  <h3 className="text-sm font-medium mb-3">Supply Information</h3>
                  <div className="bg-muted rounded-lg p-4 space-y-4">
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Package className="h-4 w-4 text-primary/60" />
                        <h4 className="font-medium">Machine Details</h4>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm text-muted-foreground">Serial Number</div>
                          <div className="font-medium">{selectedMachine.serialNumber}</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Model</div>
                          <div className="font-medium">
                            {selectedMachine.machineModel.name} - {selectedMachine.machineModel.category.name}
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
                          <div className="font-medium">{selectedMachine.supply?.distributor.organizationName}</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Contact Person</div>
                          <div className="font-medium">{selectedMachine.supply?.distributor.name}</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Supply Date</div>
                          <div className="font-medium">{selectedMachine.supply?.supplyDate && format(new Date(selectedMachine.supply.supplyDate), "PPP")}</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Region</div>
                          <div className="font-medium">{selectedMachine.supply?.distributor.region}</div>
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
                        selected={returnDate}
                        onSelect={(date) => date && setReturnDate(date)}
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
              </>
            )}
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
            <Button type="submit" disabled={isSubmitting || !selectedMachine}>
              {isSubmitting ? "Logging Return..." : "Log Return"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
} 