"use client"

import { useState } from "react"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { 
  MoreVertical, 
  Pencil, 
  Search, 
  Trash2, 
  Box, 
  Plus,
  ChevronRight,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"

interface MachineModel {
  id: string
  name: string
  shortCode: string
  description: string | null
  warrantyPeriodMonths: number
  coverImageUrl: string | null
  categoryId: string
  createdAt: Date
  updatedAt: Date
}

interface Category {
  id: string
  name: string
  shortCode: string
  description: string | null
  machineModels: MachineModel[]
  createdAt: Date
  updatedAt: Date
}

interface EquipmentManagerProps {
  initialCategories: Category[]
}

export function EquipmentManager({ initialCategories }: EquipmentManagerProps) {
  const [categories, setCategories] = useState(initialCategories)
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    initialCategories[0] || null
  )
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null)
  const [modelToDelete, setModelToDelete] = useState<MachineModel | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    category.shortCode.toLowerCase().includes(searchQuery.toLowerCase())
  )

  async function handleDeleteCategory(category: Category) {
    if (category.machineModels.length > 0) {
      toast.error("Cannot delete category with associated machine models")
      setCategoryToDelete(null)
      return
    }

    try {
      const response = await fetch(`/api/admin/equipment/categories/${category.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete category")
      }

      setCategories((prev) => prev.filter((c) => c.id !== category.id))
      if (selectedCategory?.id === category.id) {
        setSelectedCategory(categories.find(c => c.id !== category.id) || null)
      }
      toast.success("Category deleted successfully")
    } catch (error) {
      console.error("Error deleting category:", error)
      toast.error("Failed to delete category")
    } finally {
      setCategoryToDelete(null)
    }
  }

  async function handleDeleteModel(model: MachineModel) {
    try {
      const response = await fetch(`/api/admin/equipment/models/${model.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete machine model")
      }

      // Update the categories state to remove the deleted model
      setCategories((prev) =>
        prev.map((category) => {
          if (category.id === model.categoryId) {
            return {
              ...category,
              machineModels: category.machineModels.filter((m) => m.id !== model.id),
            }
          }
          return category
        })
      )

      // Update selectedCategory if it's the current category
      if (selectedCategory?.id === model.categoryId) {
        setSelectedCategory((prev) => prev ? {
          ...prev,
          machineModels: prev.machineModels.filter((m) => m.id !== model.id),
        } : null)
      }

      toast.success("Machine model deleted successfully")
    } catch (error) {
      console.error("Error deleting machine model:", error)
      toast.error("Failed to delete machine model")
    } finally {
      setModelToDelete(null)
    }
  }

  const machineColumns = [
    {
      accessorKey: "coverImageUrl",
      header: "",
      cell: ({ row }: { row: { original: MachineModel } }) => (
        <div className="relative w-10 h-10 rounded-md overflow-hidden bg-secondary">
          {row.original.coverImageUrl ? (
            <img
              src={row.original.coverImageUrl}
              alt={row.original.name}
              className="object-cover w-full h-full"
            />
          ) : (
            <Box className="h-4 w-4 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-muted-foreground" />
          )}
        </div>
      ),
    },
    {
      accessorKey: "name",
      header: "Name",
    },
    {
      accessorKey: "shortCode",
      header: "Code",
      cell: ({ row }: { row: { original: MachineModel } }) => (
        <Badge variant="outline" className="font-mono">
          {row.original.shortCode}
        </Badge>
      ),
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }: { row: { original: MachineModel } }) => (
        <span className="text-muted-foreground">
          {row.original.description || "—"}
        </span>
      ),
    },
    {
      accessorKey: "warrantyPeriodMonths",
      header: "Warranty",
      cell: ({ row }: { row: { original: MachineModel } }) => (
        <span>{row.original.warrantyPeriodMonths} months</span>
      ),
    },
    {
      id: "actions",
      cell: ({ row }: { row: { original: MachineModel } }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-8 w-8 p-0 hover:bg-primary/10"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem
              className="flex items-center gap-2 text-sm"
              asChild
            >
              <a href={`/dashboard/admin/equipment/models/${row.original.id}/edit`}>
                <Pencil className="h-4 w-4 text-primary" />
                <span>Edit Details</span>
              </a>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="flex items-center gap-2 text-sm text-destructive focus:text-destructive"
              onClick={() => setModelToDelete(row.original)}
            >
              <Trash2 className="h-4 w-4" />
              <span>Delete Model</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  return (
    <div className="flex h-full gap-6">
      {/* Left Pane - Categories */}
      <div className="w-80 flex flex-col bg-card rounded-lg border shadow-sm">
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2">
            {filteredCategories.map((category) => (
              <div
                key={category.id}
                className={cn(
                  "flex items-center justify-between p-2 rounded-md cursor-pointer hover:bg-accent/50",
                  selectedCategory?.id === category.id && "bg-accent"
                )}
                onClick={() => setSelectedCategory(category)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Box className="h-4 w-4 text-primary/60 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{category.name}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      <span className="font-mono">{category.shortCode}</span> • {category.machineModels.length} models
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      className="h-8 w-8 p-0 hover:bg-primary/10"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem
                      className="flex items-center gap-2 text-sm"
                      asChild
                    >
                      <a href={`/dashboard/admin/equipment/categories/${category.id}/edit`}>
                        <Pencil className="h-4 w-4 text-primary" />
                        <span>Edit Details</span>
                      </a>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="flex items-center gap-2 text-sm text-destructive focus:text-destructive"
                      onClick={() => setCategoryToDelete(category)}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Delete Category</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        </ScrollArea>
        <div className="p-4 border-t">
          <Button asChild className="w-full">
            <a href="/dashboard/admin/equipment/categories/create">
              <Plus className="h-4 w-4 mr-2" />
              Create Category
            </a>
          </Button>
        </div>
      </div>

      {/* Right Pane - Machine Models */}
      <div className="flex-1 bg-card rounded-lg border shadow-sm">
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">
              {selectedCategory ? (
                <>
                  <span className="text-muted-foreground">Models in</span>{" "}
                  {selectedCategory.name}
                </>
              ) : (
                "Select a category"
              )}
            </h3>
            {selectedCategory && (
              <Button asChild>
                <a href={`/dashboard/admin/equipment/models/create?categoryId=${selectedCategory.id}`}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Model
                </a>
              </Button>
            )}
          </div>
          {selectedCategory ? (
            <DataTable
              columns={machineColumns}
              data={selectedCategory.machineModels}
              pagination
            />
          ) : (
            <div className="flex items-center justify-center h-[400px] text-muted-foreground">
              Select a category to view its machine models
            </div>
          )}
        </div>
      </div>

      {/* Delete Category Dialog */}
      <AlertDialog open={!!categoryToDelete} onOpenChange={() => setCategoryToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              {categoryToDelete?.machineModels.length ? (
                "This category cannot be deleted because it has associated machine models. Please remove or reassign all machine models first."
              ) : (
                "This action cannot be undone. This will permanently delete this category."
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            {!categoryToDelete?.machineModels.length && (
              <AlertDialogAction
                onClick={() => categoryToDelete && handleDeleteCategory(categoryToDelete)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Model Dialog */}
      <AlertDialog open={!!modelToDelete} onOpenChange={() => setModelToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this machine model
              and all of its data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => modelToDelete && handleDeleteModel(modelToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
} 