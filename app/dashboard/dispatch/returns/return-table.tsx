"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Eye, Building2, Globe, Calendar, MoreVertical, Pencil } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface Return {
  id: string
  returnDate: Date
  returnReason: string
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
    supply: {
      id: string
      supplyDate: Date
      distributor: {
        id: string
        name: string
        organizationName: string
        region: string
      }
    }
  }
}

interface ReturnTableProps {
  initialReturns: Return[]
}

export function ReturnTable({ initialReturns }: ReturnTableProps) {
  const router = useRouter()
  const [returns] = useState<Return[]>(initialReturns)
  const [search, setSearch] = useState('')

  const filteredReturns = returns.filter((ret) => {
    const searchLower = search.toLowerCase()
    return (
      ret.machine.serialNumber.toLowerCase().includes(searchLower) ||
      ret.machine.machineModel.name.toLowerCase().includes(searchLower) ||
      ret.machine.machineModel.category.name.toLowerCase().includes(searchLower) ||
      ret.machine.supply.distributor.organizationName.toLowerCase().includes(searchLower) ||
      ret.machine.supply.distributor.region.toLowerCase().includes(searchLower) ||
      ret.returnReason.toLowerCase().includes(searchLower)
    )
  })

  const columns = [
    {
      accessorKey: 'machine.serialNumber',
      header: 'Serial Number',
      cell: ({ row }: { row: { original: Return } }) => (
        <div className="flex items-center gap-2">
          <div>
            <div>{row.original.machine.serialNumber}</div>
            <div className="text-sm text-muted-foreground">
              {row.original.machine.machineModel.name} - {row.original.machine.machineModel.category.name}
            </div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'distributor',
      header: 'Distributor',
      cell: ({ row }: { row: { original: Return } }) => (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary/60" />
            {row.original.machine.supply.distributor.organizationName}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Globe className="h-4 w-4" />
            {row.original.machine.supply.distributor.region}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'dates',
      header: 'Dates',
      cell: ({ row }: { row: { original: Return } }) => (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary/60" />
            Supplied: {format(row.original.machine.supply.supplyDate, 'PP')}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            Returned: {format(row.original.returnDate, 'PP')}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'returnReason',
      header: 'Return Reason',
      cell: ({ row }: { row: { original: Return } }) => (
        <div className="max-w-[300px]">
          <p className="text-sm truncate" title={row.original.returnReason}>
            {row.original.returnReason}
          </p>
        </div>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }: { row: { original: Return } }) => (
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
              onClick={() => router.push(`/dashboard/dispatch/returns/${row.original.id}`)}
              className="cursor-pointer"
            >
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => router.push(`/dashboard/dispatch/returns/${row.original.id}/edit`)}
              className="cursor-pointer"
            >
              <Pencil className="mr-2 h-4 w-4" />
              Edit Return
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search returns..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>
      <DataTable
        columns={columns}
        data={filteredReturns}
        pagination
      />
    </div>
  )
} 