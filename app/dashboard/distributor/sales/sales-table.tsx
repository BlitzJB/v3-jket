"use client"

import { useState } from "react"
import { format } from "date-fns"
import { DataTable } from "@/components/ui/data-table"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Search,
  Box,
  Calendar,
  Tag,
  Phone,
  MapPin,
} from "lucide-react"

interface Sale {
  id: string
  saleDate: Date
  customerName: string
  customerContactPersonName: string
  customerEmail: string
  customerPhoneNumber: string
  customerAddress: string
  distributorInvoiceNumber?: string
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
}

interface SalesTableProps {
  initialSales: Sale[]
}

export function SalesTable({ initialSales }: SalesTableProps) {
  const [sales] = useState<Sale[]>(initialSales)
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")

  // Get unique categories for filter
  const categories = Array.from(
    new Set(sales.map((s) => s.machine.machineModel.category.name))
  )

  const filteredSales = sales.filter((sale) => {
    const searchLower = search.toLowerCase()
    const matchesSearch =
      sale.customerName.toLowerCase().includes(searchLower) ||
      sale.customerContactPersonName.toLowerCase().includes(searchLower) ||
      sale.customerEmail.toLowerCase().includes(searchLower) ||
      sale.customerPhoneNumber.toLowerCase().includes(searchLower) ||
      sale.customerAddress.toLowerCase().includes(searchLower) ||
      (sale.distributorInvoiceNumber && sale.distributorInvoiceNumber.toLowerCase().includes(searchLower)) ||
      sale.machine.serialNumber.toLowerCase().includes(searchLower) ||
      sale.machine.machineModel.name.toLowerCase().includes(searchLower) ||
      sale.machine.machineModel.category.name.toLowerCase().includes(searchLower)

    const matchesCategory =
      categoryFilter === "all" ||
      sale.machine.machineModel.category.name === categoryFilter

    return matchesSearch && matchesCategory
  })

  const columns = [
    {
      accessorKey: "machine",
      header: "Machine",
      cell: ({ row }: { row: { original: Sale } }) => (
        <div className="flex items-center gap-2">
          <div className="p-2 bg-primary/5 rounded-lg">
            <Box className="h-4 w-4 text-primary" />
          </div>
          <div>
            <div className="font-medium">
              {row.original.machine.machineModel.name}
            </div>
            <div className="text-sm text-muted-foreground">
              {row.original.machine.serialNumber}
            </div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "category",
      header: "Category",
      cell: ({ row }: { row: { original: Sale } }) => (
        <div className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-primary/60" />
          {row.original.machine.machineModel.category.name}
        </div>
      ),
    },
    {
      accessorKey: "customer",
      header: "Customer",
      cell: ({ row }: { row: { original: Sale } }) => (
        <div className="space-y-1">
          <div className="font-medium">{row.original.customerName}</div>
          <div className="text-sm text-muted-foreground">
            Contact: {row.original.customerContactPersonName}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Phone className="h-3 w-3" />
            {row.original.customerPhoneNumber}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-3 w-3" />
            {row.original.customerAddress}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "saleDate",
      header: "Sale Date",
      cell: ({ row }: { row: { original: Sale } }) => (
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary/60" />
          {format(new Date(row.original.saleDate), "PPP")}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search sales..."
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
      <DataTable columns={columns} data={filteredSales} pagination />
    </div>
  )
} 