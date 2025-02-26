'use client'

import { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/data-table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Search } from "lucide-react"

interface Machine {
  id: string
  serialNumber: string
  machineModel: {
    name: string
    category: {
      name: string
    }
  }
  supply?: {
    id: string
    supplyDate: string
    distributor: {
      id: string
      name: string
      organizationName: string
      region: string
    }
  }
}

interface Distributor {
  id: string
  name: string
  organizationName: string
  region: string
}

interface PickerDialogProps {
  type: 'machine' | 'distributor' | 'supplied-machine'
  onSelect: (item: Machine | Distributor) => void
  buttonText: string
  selectedId?: string
}

export function PickerDialog({ type, onSelect, buttonText, selectedId }: PickerDialogProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState<(Machine | Distributor)[]>([])

  useEffect(() => {
    if (open) {
      setLoading(true)
      const endpoint = type === 'supplied-machine' ? '/api/dispatch/supplied-machines' : `/api/dispatch/${type}s`
      fetch(endpoint)
        .then((res) => res.json())
        .then((data) => {
          setItems(data)
          setLoading(false)
        })
        .catch((error) => {
          console.error(`Error fetching ${type}s:`, error)
          setLoading(false)
        })
    }
  }, [open, type])

  const filteredItems = items.filter((item) => {
    const searchLower = search.toLowerCase()
    if (type === 'machine' || type === 'supplied-machine') {
      const machine = item as Machine
      return (
        machine.serialNumber.toLowerCase().includes(searchLower) ||
        machine.machineModel.name.toLowerCase().includes(searchLower) ||
        machine.machineModel.category.name.toLowerCase().includes(searchLower)
      )
    } else {
      const distributor = item as Distributor
      return (
        distributor.name.toLowerCase().includes(searchLower) ||
        distributor.organizationName.toLowerCase().includes(searchLower) ||
        distributor.region.toLowerCase().includes(searchLower)
      )
    }
  })

  const distributorColumns = [
    {
      accessorKey: 'organizationName',
      header: 'Organization',
    },
    {
      accessorKey: 'name',
      header: 'Contact Person',
    },
    {
      accessorKey: 'region',
      header: 'Region',
    },
    {
      id: 'actions',
      cell: ({ row }: { row: { original: Distributor } }) => (
        <Button
          variant="ghost"
          onClick={() => {
            onSelect(row.original)
            setOpen(false)
          }}
        >
          Select
        </Button>
      ),
    },
  ]

  const machineColumns = [
    {
      accessorKey: 'serialNumber',
      header: 'Serial Number',
    },
    {
      accessorKey: 'machineModel.name',
      cell: ({ row }: { row: { original: Machine } }) => (
        <div className="flex items-center gap-2">
          <div>{row.original.machineModel.name}</div>
        </div>
      ),
      header: 'Model',
    },
    {
      accessorKey: 'machineModel.category.name',
      header: 'Category',
      cell: ({ row }: { row: { original: Machine } }) => (
        <div className="flex items-center gap-2">
          <div>{row.original.machineModel.category.name}</div>
        </div>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }: { row: { original: Machine } }) => (
        <Button
          variant="ghost"
          onClick={() => {
            onSelect(row.original)
            setOpen(false)
          }}
        >
          Select
        </Button>
      ),
    },
  ]

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-start text-left font-normal"
        >
          {buttonText}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {type === 'distributor' ? 'Select Distributor' : 'Select Machine'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={`Search ${type === 'distributor' ? 'distributors' : 'machines'}...`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          {loading ? (
            <div className="min-h-[300px] flex items-center justify-center">
              <div className="text-muted-foreground">Loading...</div>
            </div>
          ) : type === 'distributor' ? (
            <DataTable
              columns={distributorColumns}
              data={filteredItems as Distributor[]}
              pagination
            />
          ) : (
            <DataTable
              columns={machineColumns}
              data={filteredItems as Machine[]}
              pagination
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
} 