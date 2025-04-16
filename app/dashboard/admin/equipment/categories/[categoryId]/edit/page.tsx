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

interface FormData {
  name: string
  shortCode: string
  description: string
}

interface EditCategoryPageProps {
  params: Promise<{ categoryId: string }>
}

async function getCategory(categoryId: string) {
  const response = await fetch(`/api/admin/equipment/categories/${categoryId}`)
  if (!response.ok) {
    throw new Error('Failed to fetch category')
  }
  return response.json()
}

export default function EditCategoryPage({ params }: EditCategoryPageProps) {
  const { categoryId } = use(params)
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    name: '',
    shortCode: '',
    description: '',
  })

  // Load category data
  useState(() => {
    getCategory(categoryId)
      .then((category) => {
        setFormData({
          name: category.name,
          shortCode: category.shortCode,
          description: category.description || '',
        })
      })
      .catch((error) => {
        console.error('Error loading category:', error)
        toast.error('Failed to load category')
        router.push('/dashboard/admin/equipment')
      })
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch(`/api/admin/equipment/categories/${categoryId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to update category')
      }

      toast.success('Category updated successfully')
      router.push('/dashboard/admin/equipment')
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update category')
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    if (name === 'shortCode') {
      setFormData((prev) => ({ ...prev, [name]: value.toUpperCase() }))
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }))
    }
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Edit Category</h1>
        <p className="text-muted-foreground mt-1">
          Update equipment category details
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Category Information</CardTitle>
            <CardDescription>
              Modify the details for this equipment category
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
                placeholder="Enter category name"
                required
                value={formData.name}
                onChange={handleChange}
              />
              <p className="text-sm text-muted-foreground">
                A descriptive name for the category
              </p>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="shortCode"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Category Short Code
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
                A unique identifier using uppercase letters and numbers only (e.g., HVAC, ELEC)
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
                placeholder="Enter category description"
                value={formData.description}
                onChange={handleChange}
              />
              <p className="text-sm text-muted-foreground">
                Additional details about this category
              </p>
            </div>

            <div className="flex justify-end space-x-4 pt-4">
              <Button
                variant="outline"
                onClick={() => router.back()}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Saving...' : 'Update Category'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
} 