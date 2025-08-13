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
import { Input } from "@/components/ui/input"
import { PickerDialog } from "../../picker-dialog"

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
    sale?: {
      id: string
      saleDate: string
      customerName: string
      customerContactPersonName: string
      customerEmail: string
      customerPhoneNumber: string
      customerAddress: string
      distributorInvoiceNumber?: string
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

function isMachine(item: any): item is Machine {
  return 'serialNumber' in item && !('organizationName' in item)
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
  const [selectedMachine, setSelectedMachine] = useState<{
    id: string
    serialNumber: string
    machineModel: {
      name: string
      category: {
        name: string
      }
    }
  } | null>(null)
  const [supplyDate, setSupplyDate] = useState<Date>(new Date())
  const [sellBy, setSellBy] = useState<Date>(addMonths(new Date(), 6))
  const [notes, setNotes] = useState("")
  const [isDirectToCustomer, setIsDirectToCustomer] = useState(false)
  // Customer information state for D2C supplies
  const [customerName, setCustomerName] = useState("")
  const [customerContactPersonName, setCustomerContactPersonName] = useState("")
  const [customerEmail, setCustomerEmail] = useState("")
  const [customerPhoneNumber, setCustomerPhoneNumber] = useState("")
  const [customerAddress, setCustomerAddress] = useState("")
  const [distributorInvoiceNumber, setDistributorInvoiceNumber] = useState("")
  const [saleDate, setSaleDate] = useState<Date>(new Date())
  // Error states for customer fields
  const [customerFieldErrors, setCustomerFieldErrors] = useState<{
    customerName?: string
    customerContactPersonName?: string
    customerPhoneNumber?: string
    customerAddress?: string
  }>({})
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
        setSelectedMachine({
          id: data.machine.id,
          serialNumber: data.machine.serialNumber,
          machineModel: {
            name: data.machine.machineModel.name,
            category: {
              name: data.machine.machineModel.category.name
            }
          }
        })
        setSupplyDate(new Date(data.supplyDate))
        setSellBy(new Date(data.sellBy))
        setNotes(data.notes || "")

        // Check if this is a direct-to-customer supply
        const isDirect = data.distributor.organizationName === "JKET D2C"
        setIsDirectToCustomer(isDirect)

        // If D2C, populate customer information from sale record
        if (isDirect && data.machine.sale) {
          const sale = data.machine.sale
          setCustomerName(sale.customerName || "")
          setCustomerContactPersonName(sale.customerContactPersonName || "")
          setCustomerEmail(sale.customerEmail || "")
          setCustomerPhoneNumber(sale.customerPhoneNumber || "")
          setCustomerAddress(sale.customerAddress || "")
          setDistributorInvoiceNumber(sale.distributorInvoiceNumber || "")
          setSaleDate(new Date(sale.saleDate || data.supplyDate))
        }
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

  // Helper function to clear specific field error when user starts typing
  const clearFieldError = (fieldName: keyof typeof customerFieldErrors) => {
    if (customerFieldErrors[fieldName]) {
      setCustomerFieldErrors(prev => ({
        ...prev,
        [fieldName]: undefined
      }))
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    // Basic validation - machine and supply are always required
    if (!selectedMachine || !supply) {
      toast.error("Missing required information")
      return
    }
    
    // For non-D2C supplies, distributor is required
    if (!isDirectToCustomer && !selectedDistributor) {
      toast.error("Please select a distributor")
      return
    }

    // Validate D2C customer information if this is a direct supply
    if (isDirectToCustomer) {
      const errors: typeof customerFieldErrors = {}
      let hasErrors = false

      if (!customerName.trim()) {
        errors.customerName = "Organization/Company name is required"
        hasErrors = true
      }
      
      if (!customerContactPersonName.trim()) {
        errors.customerContactPersonName = "Contact person name is required"
        hasErrors = true
      }
      
      if (!customerPhoneNumber.trim()) {
        errors.customerPhoneNumber = "Phone number is required"
        hasErrors = true
      }
      
      if (!customerAddress.trim()) {
        errors.customerAddress = "Address is required"
        hasErrors = true
      }

      setCustomerFieldErrors(errors)
      
      if (hasErrors) {
        toast.error("Please fill in all required customer information")
        return
      }
    }

    // Clear any existing errors if validation passes
    setCustomerFieldErrors({})

    setIsSubmitting(true)
    try {
      const requestBody = {
        machineId: selectedMachine.id,
        distributorId: selectedDistributor?.id || supply.distributor.id, // Use existing distributor ID if selectedDistributor is null
        supplyDate,
        sellBy,
        notes,
        // Include customer information if D2C supply
        ...(isDirectToCustomer && {
          isDirectToCustomer: true,
          customerName,
          customerContactPersonName,
          customerEmail,
          customerPhoneNumber,
          customerAddress,
          distributorInvoiceNumber: distributorInvoiceNumber || undefined,
          saleDate,
        })
      }

      const res = await fetch(`/api/dispatch/supplies/${supplyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
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
          Update supply details and assigned machine
        </p>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Machine</label>
              <PickerDialog
                type="editable-machine"
                buttonText={selectedMachine ? `${selectedMachine.serialNumber} - ${selectedMachine.machineModel.name}` : "Select Machine"}
                onSelect={(item) => {
                  if (isMachine(item)) {
                    setSelectedMachine({
                      id: item.id,
                      serialNumber: item.serialNumber,
                      machineModel: {
                        name: item.machineModel.name,
                        category: {
                          name: item.machineModel.category.name
                        }
                      }
                    })
                  }
                }}
                selectedId={selectedMachine?.id}
                currentSupplyId={supplyId}
              />
            </div>

            {!isDirectToCustomer ? (
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
            ) : (
              <div className="space-y-4 border border-gray-200 rounded-md p-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-sm">Customer Information</h3>
                  <span className="text-xs text-muted-foreground bg-blue-100 px-2 py-1 rounded">Direct to Customer</span>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Organization/Company Name</label>
                  <Input 
                    value={customerName}
                    onChange={(e) => {
                      setCustomerName(e.target.value)
                      clearFieldError('customerName')
                    }}
                    placeholder="Enter organization/company name"
                    className={customerFieldErrors.customerName ? "border-destructive focus-visible:ring-destructive" : ""}
                  />
                  {customerFieldErrors.customerName && (
                    <p className="text-sm text-destructive mt-1">{customerFieldErrors.customerName}</p>
                  )}
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Contact Person Name</label>
                  <Input 
                    value={customerContactPersonName}
                    onChange={(e) => {
                      setCustomerContactPersonName(e.target.value)
                      clearFieldError('customerContactPersonName')
                    }}
                    placeholder="Enter contact person name"
                    className={customerFieldErrors.customerContactPersonName ? "border-destructive focus-visible:ring-destructive" : ""}
                  />
                  {customerFieldErrors.customerContactPersonName && (
                    <p className="text-sm text-destructive mt-1">{customerFieldErrors.customerContactPersonName}</p>
                  )}
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
                    onChange={(e) => {
                      setCustomerPhoneNumber(e.target.value)
                      clearFieldError('customerPhoneNumber')
                    }}
                    placeholder="Enter phone number"
                    className={customerFieldErrors.customerPhoneNumber ? "border-destructive focus-visible:ring-destructive" : ""}
                  />
                  {customerFieldErrors.customerPhoneNumber && (
                    <p className="text-sm text-destructive mt-1">{customerFieldErrors.customerPhoneNumber}</p>
                  )}
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Address</label>
                  <Textarea 
                    value={customerAddress}
                    onChange={(e) => {
                      setCustomerAddress(e.target.value)
                      clearFieldError('customerAddress')
                    }}
                    placeholder="Enter address"
                    className={`min-h-[80px] ${customerFieldErrors.customerAddress ? "border-destructive focus-visible:ring-destructive" : ""}`}
                  />
                  {customerFieldErrors.customerAddress && (
                    <p className="text-sm text-destructive mt-1">{customerFieldErrors.customerAddress}</p>
                  )}
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