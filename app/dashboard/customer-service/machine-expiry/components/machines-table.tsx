"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { format, formatDistanceToNow, isAfter, isBefore, addDays } from "date-fns"
import { DataTable } from "@/components/ui/data-table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import {
  Search,
  MoreVertical,
  Clock,
  Filter,
  ArrowUpDown,
  Box,
  Building2,
} from "lucide-react"

interface Machine {
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
    sellBy: Date
    distributor: {
      name: string
      organizationName: string
    }
  }
}

type FilterStatus = "all" | "active" | "expiring" | "expired"

interface MachinesTableProps {
  initialMachines: Machine[]
  showBulkActions?: boolean
}

export function MachinesTable({ 
  initialMachines,
  showBulkActions = true,
}: MachinesTableProps) {
  const router = useRouter()
  const [machines, setMachines] = useState(initialMachines)
  const [selectedMachines, setSelectedMachines] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all")
  const [isUpdating, setIsUpdating] = useState(false)
  const [showUpdateDialog, setShowUpdateDialog] = useState(false)
  const [newDate, setNewDate] = useState<Date>()

  const today = new Date()

  const filteredMachines = machines.filter(machine => {
    const matchesSearch = 
      machine.serialNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      machine.machineModel.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      machine.supply.distributor.name.toLowerCase().includes(searchQuery.toLowerCase())

    if (!matchesSearch) return false

    const sellBy = new Date(machine.supply.sellBy)
    
    switch (filterStatus) {
      case "active":
        return isAfter(sellBy, today)
      case "expiring":
        return isAfter(sellBy, today) && isBefore(sellBy, addDays(today, 30))
      case "expired":
        return isBefore(sellBy, today)
      default:
        return true
    }
  })

  const handleBulkUpdate = async () => {
    if (!newDate) {
      toast.error("Please select a new date")
      return
    }

    setIsUpdating(true)
    try {
      const response = await fetch("/api/sales/machines/bulk/sell-by-date", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          supplyIds: selectedMachines.map(id => 
            machines.find(m => m.id === id)?.supply.id
          ).filter(Boolean),
          newDate: newDate.toISOString(),
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update machines")
      }

      const updatedSupplies = await response.json()
      
      // Update local state
      setMachines(prevMachines => 
        prevMachines.map(machine => {
          if (selectedMachines.includes(machine.id)) {
            return { 
              ...machine, 
              supply: {
                ...machine.supply,
                sellBy: newDate
              }
            }
          }
          return machine
        })
      )

      setSelectedMachines([])
      setShowUpdateDialog(false)
      toast.success("Successfully updated sell-by dates")
    } catch (error) {
      toast.error("Failed to update sell-by dates")
    } finally {
      setIsUpdating(false)
    }
  }

  const getExpiryStatus = (date: Date) => {
    const daysUntilExpiry = Math.ceil(
      (new Date(date).getTime() - new Date().getTime()) / 
      (1000 * 60 * 60 * 24)
    )

    if (daysUntilExpiry <= 0) return "destructive"
    if (daysUntilExpiry <= 7) return "destructive"
    if (daysUntilExpiry <= 30) return "secondary"
    return "default"
  }

  const columns = [
    {
      id: "select",
      header: "",
      cell: ({ row }: { row: { original: Machine } }) => (
        <input
          type="checkbox"
          checked={selectedMachines.includes(row.original.id)}
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedMachines([...selectedMachines, row.original.id])
            } else {
              setSelectedMachines(selectedMachines.filter(id => id !== row.original.id))
            }
          }}
          className="translate-y-[2px]"
        />
      ),
    },
    {
      accessorKey: "serialNumber",
      header: "Machine",
      cell: ({ row }: { row: { original: Machine } }) => (
        <div>
          <div className="font-medium">{row.original.serialNumber}</div>
          <div className="text-sm text-muted-foreground">
            {row.original.machineModel.name}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "machineModel.category.name",
      header: "Category",
      cell: ({ row }: { row: { original: Machine } }) => (
        <div className="flex items-center gap-2">
          <div className="p-2 bg-primary/5 rounded-lg">
            <Box className="h-4 w-4 text-primary" />
          </div>
          <span>{row.original.machineModel.category.name}</span>
        </div>
      ),
    },
    {
      accessorKey: "supply.distributor",
      header: "Distributor",
      cell: ({ row }: { row: { original: Machine } }) => (
        <div className="flex items-center gap-2">
          <div className="p-2 bg-primary/5 rounded-lg">
            <Building2 className="h-4 w-4 text-primary" />
          </div>
          <div>
            <div className="font-medium">{row.original.supply.distributor.organizationName}</div>
            <div className="text-sm text-muted-foreground">{row.original.supply.distributor.name}</div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "supply.sellBy",
      header: ({ column }: { column: any }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="gap-2"
        >
          Sell By Date
          <ArrowUpDown className="h-4 w-4" />
        </Button>
      ),
      cell: ({ row }: { row: { original: Machine } }) => {
        const date = new Date(row.original.supply.sellBy)
        const status = getExpiryStatus(date)
        const isExpired = isBefore(date, today)
        return (
          <div className="space-y-1">
            <Badge variant={status}>
              {format(date, "PPP")}
            </Badge>
            <div className="text-xs text-muted-foreground">
              {isExpired 
                ? `Expired ${formatDistanceToNow(date, { addSuffix: true })}` 
                : `Expires ${formatDistanceToNow(date, { addSuffix: true })}`
              }
            </div>
          </div>
        )
      },
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }: { row: { original: Machine } }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-8 w-8 p-0 hover:bg-primary/10"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => 
                router.push(`/dashboard/customer-service/machine-expiry/machines/${row.original.id}`)
              }
            >
              View Details
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                setSelectedMachines([row.original.id])
                setShowUpdateDialog(true)
              }}
            >
              Update Sell-by Date
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search machines..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 w-[300px]"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                {filterStatus === "all" ? "All Machines" : 
                 filterStatus === "active" ? "Active Machines" :
                 filterStatus === "expiring" ? "Expiring Soon" :
                 "Expired Machines"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
              <DropdownMenuRadioGroup value={filterStatus} onValueChange={(value) => setFilterStatus(value as FilterStatus)}>
                <DropdownMenuRadioItem value="all">All Machines</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="active">Active Machines</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="expiring">Expiring Soon</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="expired">Expired Machines</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {showBulkActions && selectedMachines.length > 0 && (
          <Button
            onClick={() => setShowUpdateDialog(true)}
            className="gap-2"
          >
            <Clock className="h-4 w-4" />
            Update {selectedMachines.length} Selected
          </Button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={filteredMachines}
        pagination
      />

      <Dialog open={showUpdateDialog} onOpenChange={setShowUpdateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Sell-by Date</DialogTitle>
            <DialogDescription>
              Select a new sell-by date for the selected machines.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Calendar
              mode="single"
              selected={newDate}
              onSelect={setNewDate}
              className="rounded-md border mx-auto"
              disabled={(date) => date < new Date()}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowUpdateDialog(false)}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleBulkUpdate}
              disabled={isUpdating}
            >
              {isUpdating ? "Updating..." : "Update Date"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 