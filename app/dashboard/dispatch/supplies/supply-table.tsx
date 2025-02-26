"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Search, Eye, Building2, Globe, Calendar, MoreVertical, Pencil } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface Supply {
  id: string
  supplyDate: Date
  sellBy: Date
  machine: {
    id: string
    serialNumber: string
    machineModel: {
      id: string
      name: string
      shortCode: string
      category: {
        id: string
        name: string
        shortCode: string
      }
    }
    return: {
      id: string
      returnDate: Date
      returnReason: string
    } | null
  }
  distributor: {
    id: string
    name: string
    organizationName: string
    region: string
  }
}

interface SupplyTableProps {
  initialSupplies: Supply[]
}

export function SupplyTable({ initialSupplies }: SupplyTableProps) {
  const router = useRouter()
  const [supplies] = useState<Supply[]>(initialSupplies)
  const [search, setSearch] = useState('')

  const filteredSupplies = supplies.filter((supply) => {
    const searchLower = search.toLowerCase()
    return (
      supply.machine.serialNumber.toLowerCase().includes(searchLower) ||
      supply.machine.machineModel.name.toLowerCase().includes(searchLower) ||
      supply.machine.machineModel.category.name.toLowerCase().includes(searchLower) ||
      supply.distributor.organizationName.toLowerCase().includes(searchLower) ||
      supply.distributor.region.toLowerCase().includes(searchLower)
    )
  })

  const columns = [
    {
      accessorKey: 'machine.serialNumber',
      header: 'Serial Number',
      cell: ({ row }: { row: { original: Supply } }) => (
        <div className="flex items-center gap-2">
          <div>{row.original.machine.serialNumber}</div>
        </div>
      ),
    },
    {
      accessorKey: 'machine.machineModel.name',
      header: 'Model',
      cell: ({ row }: { row: { original: Supply } }) => (
        <div className="flex items-center gap-2">
          <div>
            <div>{row.original.machine.machineModel.name}</div>
            <div className="text-sm text-muted-foreground">
              {row.original.machine.machineModel.category.name}
            </div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'distributor',
      header: 'Distributor',
      cell: ({ row }: { row: { original: Supply } }) => (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary/60" />
            {row.original.distributor.organizationName}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Globe className="h-4 w-4" />
            {row.original.distributor.region}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'dates',
      header: 'Dates',
      cell: ({ row }: { row: { original: Supply } }) => (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary/60" />
            Supplied: {format(row.original.supplyDate, 'PP')}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            Sell by: {format(row.original.sellBy, 'PP')}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }: { row: { original: Supply } }) => {
        const hasReturn = row.original.machine.return !== null
        return (
          <Badge variant={hasReturn ? 'destructive' : 'success'}>
            {hasReturn ? 'Returned' : 'Active'}
          </Badge>
        )
      },
    },
    {
      id: 'actions',
      cell: ({ row }: { row: { original: Supply } }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-primary/10"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => router.push(`/dashboard/dispatch/supplies/${row.original.id}`)}
              className="cursor-pointer"
            >
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => router.push(`/dashboard/dispatch/supplies/${row.original.id}/edit`)}
              className="cursor-pointer"
            >
              <Pencil className="mr-2 h-4 w-4" />
              Edit Supply
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  console.log(supplies)

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search supplies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>
      <DataTable
        columns={columns}
        data={filteredSupplies}
        pagination
      />
    </div>
  )
} 