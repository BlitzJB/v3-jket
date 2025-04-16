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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

interface Machine {
  id: string
  serialNumber: string
  machineModel: {
    name: string
    category: {
      name: string
    }
  }
}

interface Distributor {
  id: string
  name: string
  organizationName: string
  region: string
}

function isMachine(item: any): item is Machine {
  return 'serialNumber' in item && 'machineModel' in item
}

function isDistributor(item: any): item is Distributor {
  return 'organizationName' in item && !('serialNumber' in item)
}

type SupplyType = 'distributor' | 'direct'

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
  // Sell by date is always calculated but not directly editable
  const sellBy = addMonths(supplyDate, 6)
  const [notes, setNotes] = useState("")
  const [supplyType, setSupplyType] = useState<SupplyType>("distributor")
  const [customerName, setCustomerName] = useState("")
  const [customerContactPersonName, setCustomerContactPersonName] = useState("")
  const [customerEmail, setCustomerEmail] = useState("")
  const [customerPhoneNumber, setCustomerPhoneNumber] = useState("")
  const [customerAddress, setCustomerAddress] = useState("")
  const [distributorInvoiceNumber, setDistributorInvoiceNumber] = useState("")
  const [saleDate, setSaleDate] = useState<Date>(new Date())

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedMachine) {
      toast.error("Please select a machine")
      return
    }

    if (supplyType === "distributor" && !selectedDistributor) {
      toast.error("Please select a distributor")
      return
    }

    if (supplyType === "direct") {
      if (!customerName.trim()) {
        toast.error("Please enter customer name")
        return
      }
      if (!customerPhoneNumber.trim()) {
        toast.error("Please enter customer phone number")
        return
      }
      if (!customerAddress.trim()) {
        toast.error("Please enter customer address")
        return
      }
      if (!customerContactPersonName.trim()) {
        toast.error("Please enter customer contact person name")
        return
      }
      if (!customerEmail.trim()) {
        toast.error("Please enter customer email")
        return
      }
    }

    setIsSubmitting(true)
    try {
      const res = await fetch("/api/dispatch/supplies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          machineId: selectedMachine.id,
          distributorId: selectedDistributor?.id,
          supplyDate,
          sellBy,
          notes,
          supplyType,
          // Customer info for direct sales
          customerName,
          customerContactPersonName,
          customerEmail,
          customerPhoneNumber,
          customerAddress,
          distributorInvoiceNumber: distributorInvoiceNumber || undefined,
          saleDate,
        }),
      })

      if (!res.ok) {
        throw new Error(await res.text())
      }

      toast.success(supplyType === "distributor" 
        ? "Supply logged successfully" 
        : "Direct-to-customer supply logged successfully")
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
          Record a new machine supply to a distributor or directly to a customer
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
                onSelect={(item) => {
                  if (isMachine(item)) {
                    setSelectedMachine({
                      id: item.id,
                      serialNumber: item.serialNumber,
                      modelName: item.machineModel.name,
                    })
                  }
                }}
                selectedId={selectedMachine?.id}
              />
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium block">Supply Type</label>
              <RadioGroup 
                value={supplyType} 
                onValueChange={(value) => setSupplyType(value as SupplyType)}
                className="flex space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="distributor" id="distributor" />
                  <Label htmlFor="distributor">To Distributor</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="direct" id="direct" />
                  <Label htmlFor="direct">Direct to Customer</Label>
                </div>
              </RadioGroup>
            </div>

            {supplyType === "distributor" && (
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
            )}

            {supplyType === "direct" && (
              <div className="space-y-4 border border-gray-200 rounded-md p-4">
                <h3 className="font-medium text-sm">Customer Information</h3>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Organization/Company Name</label>
                  <Input 
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Enter organization/company name"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Contact Person Name</label>
                  <Input 
                    value={customerContactPersonName}
                    onChange={(e) => setCustomerContactPersonName(e.target.value)}
                    placeholder="Enter contact person name"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Email</label>
                  <Input 
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="Enter email address"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Phone Number</label>
                  <Input 
                    value={customerPhoneNumber}
                    onChange={(e) => setCustomerPhoneNumber(e.target.value)}
                    placeholder="Enter phone number"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Address</label>
                  <Textarea 
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    placeholder="Enter address"
                    className="min-h-[80px]"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Invoice Number (Optional)</label>
                  <Input 
                    value={distributorInvoiceNumber}
                    onChange={(e) => setDistributorInvoiceNumber(e.target.value)}
                    placeholder="Enter invoice number (if applicable)"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Sale Date</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !saleDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {saleDate ? format(saleDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={saleDate}
                        onSelect={(date) => date && setSaleDate(date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            )}

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
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Sell By (Auto-calculated)</label>
                <div className="border border-gray-200 rounded-md px-3 py-2 bg-gray-50">
                  <div className="flex items-center">
                    <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{format(sellBy, "PPP")}</span>
                  </div>
                </div>
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