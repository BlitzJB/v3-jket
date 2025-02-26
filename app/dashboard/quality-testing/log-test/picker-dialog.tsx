'use client'

import { useState } from 'react'
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
import { Search } from 'lucide-react'

interface Category {
  id: string
  name: string
  shortCode: string
  machineModels: MachineModel[]
}

interface MachineModel {
  id: string
  name: string
  shortCode: string
  categoryId: string
}

interface PickerDialogProps {
  type: 'category' | 'model'
  categories: Category[]
  selectedCategory?: string
  selectedModel?: string
  onSelect: (id: string) => void
  disabled?: boolean
}

export function PickerDialog({
  type,
  categories,
  selectedCategory,
  selectedModel,
  onSelect,
  disabled = false,
}: PickerDialogProps) {
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)

  const handleSelect = (id: string) => {
    onSelect(id)
    setOpen(false)
  }

  const categoryColumns = [
    {
      accessorKey: 'name',
      header: 'Name',
    },
    {
      accessorKey: 'shortCode',
      header: 'Code',
    },
    {
      accessorKey: 'machineModels.length',
      header: 'Models',
    },
    {
      id: 'actions',
      cell: ({ row }: { row: { original: Category } }) => (
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

  const modelColumns = [
    {
      accessorKey: 'name',
      header: 'Name',
    },
    {
      accessorKey: 'shortCode',
      header: 'Code',
    },
    {
      id: 'actions',
      cell: ({ row }: { row: { original: MachineModel } }) => (
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
    if (type === 'category') {
      const category = categories.find(c => c.id === selectedCategory)
      return category?.name || 'Select a category'
    } else {
      const category = categories.find(c => c.id === selectedCategory)
      const model = category?.machineModels.find(m => m.id === selectedModel)
      return model?.name || 'Select a model'
    }
  }

  const getData = () => {
    if (type === 'category') {
      return categories.filter(category =>
        category.name.toLowerCase().includes(search.toLowerCase()) ||
        category.shortCode.toLowerCase().includes(search.toLowerCase())
      )
    } else {
      const category = categories.find(c => c.id === selectedCategory)
      return (category?.machineModels || []).filter(model =>
        model.name.toLowerCase().includes(search.toLowerCase()) ||
        model.shortCode.toLowerCase().includes(search.toLowerCase())
      )
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-start text-left font-normal"
          disabled={disabled}
        >
          <span className="truncate">{getSelectedName()}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            Select {type === 'category' ? 'Category' : 'Model'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={`Search ${type === 'category' ? 'categories' : 'models'}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <DataTable
            columns={type === 'category' ? categoryColumns : modelColumns}
            data={getData()}
            pagination
          />
        </div>
      </DialogContent>
    </Dialog>
  )
} 