"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Search,
  Box,
  Calendar,
  Tag,
  MoreVertical,
  ShoppingCart,
  AlertTriangle,
} from "lucide-react"

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

interface InventoryTableProps {
  initialMachines: Machine[]
}

export function InventoryTable({ initialMachines }: InventoryTableProps) {
  const router = useRouter()
  const [machines] = useState<Machine[]>(initialMachines)
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")

  // Get unique categories for filter
  const categories = Array.from(
    new Set(machines.map((m) => m.machineModel.category.name))
  )

  const filteredMachines = machines.filter((machine) => {
    const searchLower = search.toLowerCase()
    const matchesSearch =
      machine.serialNumber.toLowerCase().includes(searchLower) ||
      machine.machineModel.name.toLowerCase().includes(searchLower) ||
      machine.machineModel.category.name.toLowerCase().includes(searchLower)

    const matchesCategory =
      categoryFilter === "all" ||
      machine.machineModel.category.name === categoryFilter

    return matchesSearch && matchesCategory
  })

  const columns = [
    {
      accessorKey: "serialNumber",
      header: "Machine",
      cell: ({ row }: { row: { original: Machine } }) => (
        <div className="flex items-center gap-2">
          <div>
            <div>{row.original.serialNumber}</div>
            <div className="text-sm text-muted-foreground">
              {row.original.machineModel.name}
            </div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "category",
      header: "Category",
      cell: ({ row }: { row: { original: Machine } }) => (
        <div className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-primary/60" />
          {row.original.machineModel.category.name}
        </div>
      ),
    },
    {
      accessorKey: "dates",
      header: "Important Dates",
      cell: ({ row }: { row: { original: Machine } }) => (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Box className="h-4 w-4 text-primary/60" />
            Supplied: {format(new Date(row.original.supply.supplyDate), "PP")}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            Sell by: {format(new Date(row.original.supply.sellBy), "PP")}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }: { row: { original: Machine } }) => {
        const sellBy = new Date(row.original.supply.sellBy)
        const now = new Date()
        const daysUntilSellBy = Math.ceil(
          (sellBy.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        )

        return (
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-1 ${daysUntilSellBy <= 0 ? 'text-destructive' : 'text-yellow-600'}`}>
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm">
                {daysUntilSellBy <= 0 
                  ? `${daysUntilSellBy} days to sell`
                  : `${daysUntilSellBy} days until sell-by`
                }
              </span>
            </div>
          </div>
        )
      },
    },
    {
      id: "actions",
      cell: ({ row }: { row: { original: Machine } }) => {
        const sellBy = new Date(row.original.supply.sellBy)
        const now = new Date()
        const isExpired = sellBy < now

        if (isExpired) {
          return null
        }

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="hover:bg-primary/10">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() =>
                  router.push(
                    `/dashboard/distributor/inventory/${row.original.id}/log-sale`
                  )
                }
                className="cursor-pointer"
              >
                <ShoppingCart className="mr-2 h-4 w-4" />
                Log Sale
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search machines..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={categoryFilter}
          onValueChange={setCategoryFilter}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <DataTable columns={columns} data={filteredMachines} pagination />
    </div>
  )
} 