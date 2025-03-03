'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/ui/data-table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Search, Building2, MapPin } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface Machine {
  id: string
  serialNumber: string
  machineModel: {
    name: string
    shortCode: string
    category: {
      name: string
      shortCode: string
    }
  }
}

interface Distributor {
  id: string
  name: string | null
  organizationName: string | null
  region: string | null
}

interface PickerDialogProps {
  type: 'machine' | 'distributor'
  selectedMachine?: string
  selectedDistributor?: string
  onSelect: (id: string) => void
}

export function PickerDialog({
  type,
  selectedMachine,
  selectedDistributor,
  onSelect,
}: PickerDialogProps) {
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [data, setData] = useState<Machine[] | Distributor[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const endpoint = type === 'machine' 
          ? '/api/dispatch/available-machines'
          : '/api/dispatch/distributors'
        const response = await fetch(endpoint)
        if (!response.ok) throw new Error('Failed to fetch data')
        const result = await response.json()
        setData(result)
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    if (open) {
      fetchData()
    }
  }, [type, open])

  const handleSelect = (id: string) => {
    onSelect(id)
    setOpen(false)
  }

  const machineColumns = [
    {
      accessorKey: 'serialNumber',
      header: 'Serial Number',
    },
    {
      accessorKey: 'model',
      header: 'Model',
      cell: ({ row }: { row: { original: Machine } }) => (
        <div className="space-y-1">
          <div>{row.original.machineModel.name}</div>
          <div className="text-xs text-muted-foreground">
            {row.original.machineModel.category.name}
          </div>
        </div>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }: { row: { original: Machine } }) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleSelect(row.original.id)}
        >
          Select
        </Button>
      ),
    },
  ]

  const distributorColumns = [
    {
      accessorKey: 'organization',
      header: 'Organization',
      cell: ({ row }: { row: { original: Distributor } }) => (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <span>{row.original.organizationName || "—"}</span>
          </div>
          {row.original.region && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span>{row.original.region}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'name',
      header: 'Contact Person',
    },
    {
      id: 'actions',
      cell: ({ row }: { row: { original: Distributor } }) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleSelect(row.original.id)}
        >
          Select
        </Button>
      ),
    },
  ]

  const getSelectedName = () => {
    if (loading) return type === 'machine' ? 'Loading machines...' : 'Loading distributors...'
    
    if (type === 'machine') {
      if (!selectedMachine) return 'Select a machine'
      const machine = data.find(m => (m as Machine).id === selectedMachine) as Machine
      return machine ? machine.serialNumber : 'Select a machine'
    } else {
      if (!selectedDistributor) return 'Select a distributor'
      const distributor = data.find(d => (d as Distributor).id === selectedDistributor) as Distributor
      return distributor ? (distributor.organizationName || distributor.name || 'Select a distributor') : 'Select a distributor'
    }
  }

  const filteredData = data.filter(item => {
    const searchLower = search.toLowerCase()
    if (type === 'machine') {
      const machine = item as Machine
      return (
        machine.serialNumber.toLowerCase().includes(searchLower) ||
        machine.machineModel.name.toLowerCase().includes(searchLower) ||
        machine.machineModel.category.name.toLowerCase().includes(searchLower)
      )
    } else {
      const distributor = item as Distributor
      return (
        distributor.name?.toLowerCase().includes(searchLower) ||
        distributor.organizationName?.toLowerCase().includes(searchLower) ||
        distributor.region?.toLowerCase().includes(searchLower)
      )
    }
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-start text-left font-normal"
        >
          <span className="truncate">{getSelectedName()}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            Select {type === 'machine' ? 'Machine' : 'Distributor'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={`Search ${type === 'machine' ? 'machines' : 'distributors'}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          {type === 'machine' ? (
            <DataTable<Machine>
              columns={machineColumns}
              data={filteredData as Machine[]}
              pagination
            />
          ) : (
            <DataTable<Distributor>
              columns={distributorColumns}
              data={filteredData as Distributor[]}
              pagination
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
} 