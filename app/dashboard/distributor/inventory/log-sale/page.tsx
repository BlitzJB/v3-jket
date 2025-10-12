'use client'

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Box, Building2, Calendar, Search } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"

interface Machine {
  id: string
  serialNumber: string
  manufacturingDate: Date
  machineModel: {
    id: string
    name: string
    category: {
      id: string
      name: string
    }
  }
  supply: {
    id: string
    supplyDate: Date
    sellBy: Date
  }
}

export default function LogSaleSelectionPage() {
  const router = useRouter()
  const [machines, setMachines] = useState<Machine[]>([])
  const [filteredMachines, setFilteredMachines] = useState<Machine[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState("")

  useEffect(() => {
    async function loadMachines() {
      try {
        const res = await fetch('/api/distributor/inventory')
        if (!res.ok) throw new Error("Failed to fetch inventory")
        const data = await res.json()
        setMachines(data)
        setFilteredMachines(data)
      } catch (error) {
        console.error(error)
        toast.error("Failed to load inventory")
      } finally {
        setIsLoading(false)
      }
    }
    loadMachines()
  }, [])

  useEffect(() => {
    if (search.trim() === "") {
      setFilteredMachines(machines)
    } else {
      const searchLower = search.toLowerCase()
      setFilteredMachines(
        machines.filter(
          (machine) =>
            machine.serialNumber.toLowerCase().includes(searchLower) ||
            machine.machineModel.name.toLowerCase().includes(searchLower) ||
            machine.machineModel.category.name.toLowerCase().includes(searchLower)
        )
      )
    }
  }, [search, machines])

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <Card className="p-6">
            <div className="h-[400px] flex items-center justify-center">
              <div className="text-muted-foreground">Loading inventory...</div>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/dashboard/distributor/inventory">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Log Sale</h1>
            <p className="text-muted-foreground mt-1">
              Select a machine from your inventory to log a sale
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by serial number, model, or category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {filteredMachines.length === 0 ? (
            <Card className="p-12">
              <div className="text-center text-muted-foreground">
                {machines.length === 0 ? (
                  <>
                    <Box className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p className="text-lg font-medium">No machines in inventory</p>
                    <p className="text-sm mt-2">
                      You don't have any machines available to sell
                    </p>
                  </>
                ) : (
                  <>
                    <Search className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p className="text-lg font-medium">No machines found</p>
                    <p className="text-sm mt-2">
                      Try adjusting your search criteria
                    </p>
                  </>
                )}
              </div>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredMachines.map((machine) => {
                const sellBy = new Date(machine.supply.sellBy)
                const now = new Date()
                const isExpired = sellBy < now

                return (
                  <Card
                    key={machine.id}
                    className={`p-6 transition-all hover:shadow-md ${
                      isExpired ? "opacity-60" : "cursor-pointer hover:border-primary"
                    }`}
                    onClick={() => {
                      if (!isExpired) {
                        router.push(
                          `/dashboard/distributor/inventory/${machine.id}/log-sale`
                        )
                      }
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-4">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-primary/5 rounded-lg">
                            <Box className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <div className="font-semibold text-lg">
                              {machine.serialNumber}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Serial Number
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="flex items-center gap-3">
                            <Building2 className="h-4 w-4 text-primary/60" />
                            <div>
                              <div className="text-sm text-muted-foreground">
                                Model
                              </div>
                              <div className="font-medium">
                                {machine.machineModel.name}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <Box className="h-4 w-4 text-primary/60" />
                            <div>
                              <div className="text-sm text-muted-foreground">
                                Category
                              </div>
                              <div className="font-medium">
                                {machine.machineModel.category.name}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <Calendar className="h-4 w-4 text-primary/60" />
                            <div>
                              <div className="text-sm text-muted-foreground">
                                Sell By
                              </div>
                              <div
                                className={`font-medium ${
                                  isExpired ? "text-destructive" : ""
                                }`}
                              >
                                {format(sellBy, "PP")}
                                {isExpired && " (Expired)"}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
