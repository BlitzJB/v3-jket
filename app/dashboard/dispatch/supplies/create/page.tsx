'use client'

import { useState } from "react"
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
import { PickerDialog } from "../picker-dialog"

export default function CreateSupplyPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedMachine, setSelectedMachine] = useState<{
    id: string
    serialNumber: string
    modelName: string
  } | null>(null)
  const [selectedDistributor, setSelectedDistributor] = useState<{
    id: string
    organizationName: string
  } | null>(null)
  const [supplyDate, setSupplyDate] = useState<Date>(new Date())
  const [sellBy, setSellBy] = useState<Date>(addMonths(new Date(), 6))
  const [notes, setNotes] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedMachine || !selectedDistributor) {
      toast.error("Please select both machine and distributor")
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch("/api/dispatch/supplies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          machineId: selectedMachine.id,
          distributorId: selectedDistributor.id,
          supplyDate,
          sellBy,
          notes,
        }),
      })

      if (!res.ok) {
        throw new Error(await res.text())
      }

      toast.success("Supply logged successfully")
      router.push("/dashboard/dispatch/supplies")
      router.refresh()
    } catch (error) {
      console.error(error)
      toast.error(error instanceof Error ? error.message : "Failed to log supply")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Log New Supply</h1>
        <p className="text-muted-foreground mt-1">
          Record a new machine supply to a distributor
        </p>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Machine</label>
              <PickerDialog
                type="machine"
                buttonText={selectedMachine ? `${selectedMachine.serialNumber} - ${selectedMachine.modelName}` : "Select Machine"}
                onSelect={setSelectedMachine}
                selectedId={selectedMachine?.id}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Distributor</label>
              <PickerDialog
                type="distributor"
                buttonText={selectedDistributor ? selectedDistributor.organizationName : "Select Distributor"}
                onSelect={setSelectedDistributor}
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
              {isSubmitting ? "Logging Supply..." : "Log Supply"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
} 