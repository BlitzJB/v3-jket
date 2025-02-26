'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { use } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface FormData {
  name: string
  shortCode: string
  description: string
  warrantyPeriodMonths: number
  coverImageUrl: string
  categoryId: string
}

interface EditMachineModelPageProps {
  params: Promise<{ modelId: string }>
}

async function getMachineModel(modelId: string) {
  const response = await fetch(`/api/admin/equipment/models/${modelId}`)
  if (!response.ok) {
    throw new Error('Failed to fetch machine model')
  }
  return response.json()
}

export default function EditMachineModelPage({ params }: EditMachineModelPageProps) {
  const { modelId } = use(params)
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    name: '',
    shortCode: '',
    description: '',
    warrantyPeriodMonths: 12,
    coverImageUrl: '',
    categoryId: '',
  })

  // Load machine model data
  useState(() => {
    getMachineModel(modelId)
      .then((model) => {
        setFormData({
          name: model.name,
          shortCode: model.shortCode,
          description: model.description || '',
          warrantyPeriodMonths: model.warrantyPeriodMonths,
          coverImageUrl: model.coverImageUrl || '',
          categoryId: model.categoryId,
        })
      })
      .catch((error) => {
        console.error('Error loading machine model:', error)
        toast.error('Failed to load machine model')
        router.push('/dashboard/admin/equipment')
      })
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch(`/api/admin/equipment/models/${modelId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to update machine model')
      }

      toast.success('Machine model updated successfully')
      router.push('/dashboard/admin/equipment')
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update machine model')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/admin/equipment/models/${modelId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete machine model')
      }

      toast.success('Machine model deleted successfully')
      router.push('/dashboard/admin/equipment')
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete machine model')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    if (name === 'shortCode') {
      setFormData((prev) => ({ ...prev, [name]: value.toUpperCase() }))
    } else if (name === 'warrantyPeriodMonths') {
      setFormData((prev) => ({ ...prev, [name]: parseInt(value) || 0 }))
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }))
    }
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Edit Machine Model</h1>
        <p className="text-muted-foreground mt-1">
          Update machine model details
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Model Information</CardTitle>
            <CardDescription>
              Modify the details for this machine model
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label
                htmlFor="name"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Name
              </label>
              <Input
                id="name"
                name="name"
                placeholder="Enter model name"
                required
                value={formData.name}
                onChange={handleChange}
              />
              <p className="text-sm text-muted-foreground">
                A descriptive name for the machine model
              </p>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="shortCode"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Short Code
              </label>
              <Input
                id="shortCode"
                name="shortCode"
                placeholder="Enter short code"
                required
                value={formData.shortCode}
                onChange={handleChange}
                className="font-mono"
                pattern="^[A-Z0-9]+$"
                title="Short code must be uppercase letters and numbers only"
              />
              <p className="text-sm text-muted-foreground">
                A unique identifier using uppercase letters and numbers only (e.g., HV100, AC200)
              </p>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="description"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Description (Optional)
              </label>
              <Textarea
                id="description"
                name="description"
                placeholder="Enter model description"
                value={formData.description}
                onChange={handleChange}
              />
              <p className="text-sm text-muted-foreground">
                Additional details about this machine model
              </p>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="warrantyPeriodMonths"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Warranty Period (Months)
              </label>
              <Input
                id="warrantyPeriodMonths"
                name="warrantyPeriodMonths"
                type="number"
                min="0"
                required
                value={formData.warrantyPeriodMonths}
                onChange={handleChange}
              />
              <p className="text-sm text-muted-foreground">
                The warranty period in months for this model
              </p>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="coverImageUrl"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Cover Image URL (Optional)
              </label>
              <Input
                id="coverImageUrl"
                name="coverImageUrl"
                type="url"
                placeholder="Enter image URL"
                value={formData.coverImageUrl}
                onChange={handleChange}
              />
              <p className="text-sm text-muted-foreground">
                A URL to an image that represents this model
              </p>
            </div>

            <div className="flex justify-between space-x-4 pt-4">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" type="button" disabled={isDeleting}>
                    {isDeleting ? 'Deleting...' : 'Delete Model'}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete the machine model
                      and all of its data.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              
              <div className="flex space-x-4">
                <Button
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={isLoading}
                  type="button"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Saving...' : 'Update Model'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
} 