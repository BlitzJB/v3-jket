"use client"

import { useState } from "react"
import { format } from "date-fns"
import { DataTable } from "@/components/ui/data-table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Search,
  Phone,
  MapPin,
  Calendar,
  ShoppingBag,
  ChevronDown,
  ChevronUp,
} from "lucide-react"

interface Customer {
  id: string
  name: string
  phoneNumber: string
  address: string
  firstPurchaseDate: Date
  totalPurchases: number
  recentPurchases: {
    id: string
    saleDate: Date
    machine: {
      serialNumber: string
      machineModel: {
        name: string
        category: {
          name: string
        }
      }
    }
  }[]
}

interface CustomersTableProps {
  initialCustomers: Customer[]
}

export function CustomersTable({ initialCustomers }: CustomersTableProps) {
  const [customers] = useState<Customer[]>(initialCustomers)
  const [search, setSearch] = useState("")
  const [purchaseFilter, setPurchaseFilter] = useState<string>("all")
  const [expandedCustomer, setExpandedCustomer] = useState<string | null>(null)

  const filteredCustomers = customers.filter((customer) => {
    const searchLower = search.toLowerCase()
    const matchesSearch =
      customer.name.toLowerCase().includes(searchLower) ||
      customer.phoneNumber.toLowerCase().includes(searchLower) ||
      customer.address.toLowerCase().includes(searchLower) ||
      customer.recentPurchases.some(
        (p) =>
          p.machine.serialNumber.toLowerCase().includes(searchLower) ||
          p.machine.machineModel.name.toLowerCase().includes(searchLower) ||
          p.machine.machineModel.category.name.toLowerCase().includes(searchLower)
      )

    const matchesPurchases =
      purchaseFilter === "all" ||
      (purchaseFilter === "multiple" && customer.totalPurchases > 1) ||
      (purchaseFilter === "single" && customer.totalPurchases === 1)

    return matchesSearch && matchesPurchases
  })

  const columns = [
    {
      accessorKey: "name",
      header: "Customer",
      cell: ({ row }: { row: { original: Customer } }) => (
        <div className="space-y-1">
          <div className="font-medium">{row.original.name}</div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Phone className="h-3 w-3" />
            {row.original.phoneNumber}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-3 w-3" />
            {row.original.address}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "purchases",
      header: "Purchase History",
      cell: ({ row }: { row: { original: Customer } }) => (
        <div className="space-y-2">
          <div className="flex items-center gap-4">
            <div>
              <div className="text-sm text-muted-foreground">First Purchase</div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary/60" />
                {format(new Date(row.original.firstPurchaseDate), "PP")}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Total Purchases</div>
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 text-primary/60" />
                {row.original.totalPurchases}
              </div>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-between"
            onClick={() =>
              setExpandedCustomer(
                expandedCustomer === row.original.id ? null : row.original.id
              )
            }
          >
            <span>Recent Purchases</span>
            {expandedCustomer === row.original.id ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>

          {expandedCustomer === row.original.id && (
            <div className="space-y-2 pl-4 pt-2">
              {row.original.recentPurchases.map((purchase) => (
                <div key={purchase.id} className="text-sm">
                  <div className="font-medium">
                    {purchase.machine.machineModel.name}
                  </div>
                  <div className="text-muted-foreground">
                    {purchase.machine.serialNumber} -{" "}
                    {format(new Date(purchase.saleDate), "PP")}
                  </div>
                </div>
              ))}
            </div>
          )}
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
            placeholder="Search customers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={purchaseFilter}
          onValueChange={setPurchaseFilter}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by purchases" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Customers</SelectItem>
            <SelectItem value="multiple">Multiple Purchases</SelectItem>
            <SelectItem value="single">Single Purchase</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <DataTable columns={columns} data={filteredCustomers} pagination />
    </div>
  )
} 