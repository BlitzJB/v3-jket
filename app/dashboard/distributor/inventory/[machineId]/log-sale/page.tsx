"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Box, Building2, Calendar } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"

interface Machine {
  id: string
  serialNumber: string
  manufacturingDate: Date
  machineModel: {
    name: string
    category: {
      name: string
    }
  }
  supply: {
    supplyDate: Date
    sellBy: Date
  }
}

async function getMachineData(machineId: string) {
  const res = await fetch(`/api/distributor/inventory/${machineId}`)
  if (!res.ok) throw new Error("Failed to fetch machine data")
  return res.json()
}

export default function LogSalePage({
  params,
}: {
  params: { machineId: string }
}) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [machine, setMachine] = useState<Machine | null>(null)
  const [customerName, setCustomerName] = useState("")
  const [customerPhoneNumber, setCustomerPhoneNumber] = useState("")
  const [customerAddress, setCustomerAddress] = useState("")

  // Load machine data
  useState(() => {
    getMachineData(params.machineId)
      .then(setMachine)
      .catch(() => {
        toast.error("Failed to load machine data")
        router.push("/dashboard/distributor/inventory")
      })
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    // Basic validation
    if (!customerName.trim()) {
      toast.error("Customer name is required")
      return
    }
    if (!customerPhoneNumber.trim()) {
      toast.error("Phone number is required")
      return
    }
    if (!customerAddress.trim()) {
      toast.error("Address is required")
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/distributor/inventory/${params.machineId}/sale`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName,
          customerPhoneNumber,
          customerAddress,
          saleDate: new Date(),
        }),
      })

      if (!res.ok) {
        throw new Error(await res.text())
      }

      toast.success("Sale logged successfully")
      router.push("/dashboard/distributor/inventory")
      router.refresh()
    } catch (error) {
      console.error(error)
      toast.error(error instanceof Error ? error.message : "Failed to log sale")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!machine) {
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
        <div className="flex items-center gap-4 mb-8">
          <Link href="/dashboard/distributor/inventory">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Log Sale</h1>
            <p className="text-muted-foreground mt-1">
              Record the sale of this machine
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Machine Information</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/5 rounded-lg">
                  <Box className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Serial Number</div>
                  <div className="font-medium">{machine.serialNumber}</div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/5 rounded-lg">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Model</div>
                  <div className="font-medium">
                    {machine.machineModel.name} - {machine.machineModel.category.name}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/5 rounded-lg">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Supply Date</div>
                  <div className="font-medium">
                    {format(new Date(machine.supply.supplyDate), "PPP")}
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Customer Name
                </label>
                <Input
                  placeholder="Enter customer name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Phone Number
                </label>
                <Input
                  placeholder="Enter phone number"
                  value={customerPhoneNumber}
                  onChange={(e) => setCustomerPhoneNumber(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Address
                </label>
                <Input
                  placeholder="Enter customer address"
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Logging Sale..." : "Log Sale"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  )
} 