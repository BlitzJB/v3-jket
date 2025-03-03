'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
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
import { Camera, Loader2, X } from 'lucide-react'

interface FormData {
  name: string
  shortCode: string
  description: string
  warrantyPeriodMonths: number
  coverImageUrl: string
  categoryId: string
}

function CreateMachineModelForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const categoryId = searchParams.get('categoryId')

  // If no categoryId is provided, redirect back to equipment page
  if (!categoryId) {
    router.push('/dashboard/admin/equipment')
    return null
  }

  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    name: '',
    shortCode: '',
    description: '',
    warrantyPeriodMonths: 12,
    coverImageUrl: '',
    categoryId,
  })

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/media', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      const data = await response.json()
      setFormData(prev => ({ ...prev, coverImageUrl: data.url }))
      toast.success('Image uploaded successfully')
    } catch (error) {
      console.error('Error uploading image:', error)
      toast.error('Failed to upload image')
    } finally {
      setIsUploading(false)
    }
  }

  const removeImage = () => {
    setFormData(prev => ({ ...prev, coverImageUrl: '' }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch('/api/admin/equipment/models', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to create machine model')
      }

      toast.success('Machine model created successfully')
      router.push('/dashboard/admin/equipment')
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create machine model')
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
    } else if (name === 'warrantyPeriodMonths') {
      setFormData((prev) => ({ ...prev, [name]: parseInt(value) || 0 }))
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }))
    }
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Create Machine Model</h1>
        <p className="text-muted-foreground mt-1">
          Add a new machine model to the equipment catalog
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Model Information</CardTitle>
            <CardDescription>
              Enter the details for the new machine model
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
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Cover Image
              </label>
              <div className="flex items-start space-x-4">
                <div className="relative w-40 h-40 rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center">
                  {formData.coverImageUrl ? (
                    <>
                      <img
                        src={formData.coverImageUrl}
                        alt="Cover"
                        className="w-full h-full object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute -top-2 -right-2 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </>
                  ) : (
                    <div className="text-center">
                      <Camera className="mx-auto h-8 w-8 text-muted-foreground" />
                      <label
                        htmlFor="image"
                        className="mt-2 cursor-pointer block text-sm font-medium text-muted-foreground hover:text-foreground"
                      >
                        Upload Image
                        <input
                          type="file"
                          id="image"
                          accept="image/*"
                          className="sr-only"
                          onChange={handleImageUpload}
                          disabled={isUploading}
                        />
                      </label>
                      {isUploading && (
                        <div className="mt-2">
                          <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Upload a cover image for the machine model
              </p>
            </div>

            <Button type="submit" disabled={isLoading || isUploading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Model'
              )}
            </Button>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}

export default function CreateMachineModelPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CreateMachineModelForm />
    </Suspense>
  )
} 
