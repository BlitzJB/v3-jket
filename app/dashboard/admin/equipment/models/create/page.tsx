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
import { Camera, Loader2, X, FileText } from 'lucide-react'
import { usePresignedUpload, UploadProgress } from '@/hooks/use-presigned-upload'

interface FormData {
  name: string
  shortCode: string
  description: string
  warrantyPeriodMonths: number
  coverImageUrl: string
  catalogueFileUrl: string
  userManualFileUrl: string
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
  const [coverImageProgress, setCoverImageProgress] = useState<UploadProgress>({ loaded: 0, total: 0, percentage: 0 })
  const [catalogueProgress, setCatalogueProgress] = useState<UploadProgress>({ loaded: 0, total: 0, percentage: 0 })
  const [manualProgress, setManualProgress] = useState<UploadProgress>({ loaded: 0, total: 0, percentage: 0 })
  
  const { uploadFile, isUploading: isUploadingAny } = usePresignedUpload()
  const [isUploadingCover, setIsUploadingCover] = useState(false)
  const [isUploadingCatalogue, setIsUploadingCatalogue] = useState(false)
  const [isUploadingManual, setIsUploadingManual] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    name: '',
    shortCode: '',
    description: '',
    warrantyPeriodMonths: 12,
    coverImageUrl: '',
    catalogueFileUrl: '',
    userManualFileUrl: '',
    categoryId,
  })

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploadingCover(true)
    try {
      const result = await uploadFile(file, {
        onProgress: setCoverImageProgress,
        onSuccess: (result) => {
          setFormData(prev => ({ ...prev, coverImageUrl: result.publicUrl }))
        }
      })
    } catch (error) {
      console.error('Error uploading image:', error)
    } finally {
      setIsUploadingCover(false)
      setCoverImageProgress({ loaded: 0, total: 0, percentage: 0 })
    }
  }

  const handleCatalogueUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploadingCatalogue(true)
    try {
      const result = await uploadFile(file, {
        onProgress: setCatalogueProgress,
        onSuccess: (result) => {
          setFormData(prev => ({ ...prev, catalogueFileUrl: result.publicUrl }))
        }
      })
    } catch (error) {
      console.error('Error uploading catalogue:', error)
    } finally {
      setIsUploadingCatalogue(false)
      setCatalogueProgress({ loaded: 0, total: 0, percentage: 0 })
    }
  }

  const handleManualUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploadingManual(true)
    try {
      const result = await uploadFile(file, {
        onProgress: setManualProgress,
        onSuccess: (result) => {
          setFormData(prev => ({ ...prev, userManualFileUrl: result.publicUrl }))
        }
      })
    } catch (error) {
      console.error('Error uploading user manual:', error)
    } finally {
      setIsUploadingManual(false)
      setManualProgress({ loaded: 0, total: 0, percentage: 0 })
    }
  }

  const removeImage = () => {
    setFormData(prev => ({ ...prev, coverImageUrl: '' }))
  }

  const removeCatalogue = () => {
    setFormData(prev => ({ ...prev, catalogueFileUrl: '' }))
  }

  const removeManual = () => {
    setFormData(prev => ({ ...prev, userManualFileUrl: '' }))
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
                Item Code
              </label>
              <Input
                id="shortCode"
                name="shortCode"
                placeholder="Enter item code"
                required
                value={formData.shortCode}
                onChange={handleChange}
                className="font-mono"
                pattern="^[A-Z0-9]+$"
                title="Item code must be uppercase letters and numbers only"
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
                        htmlFor="imageUpload"
                        className="mt-2 block text-sm font-medium text-muted-foreground cursor-pointer"
                      >
                        Upload Image
                        <input
                          id="imageUpload"
                          type="file"
                          accept="image/*"
                          className="sr-only"
                          onChange={handleImageUpload}
                          disabled={isUploadingCover}
                        />
                      </label>
                      {isUploadingCover && (
                        <div className="mt-2">
                          <div className="text-xs text-muted-foreground mb-1">
                            {coverImageProgress.percentage}%
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div 
                              className="bg-blue-600 h-1.5 rounded-full transition-all duration-300" 
                              style={{ width: `${coverImageProgress.percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">
                    Upload a cover image for this machine model. Recommended size: 600x400px.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Product Catalogue (PDF)
              </label>
              <div className="flex items-start space-x-4">
                <div className="relative w-40 h-16 rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center">
                  {formData.catalogueFileUrl ? (
                    <>
                      <div className="flex items-center justify-center w-full h-full">
                        <a href={formData.catalogueFileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline text-sm flex items-center">
                          <FileText className="h-5 w-5 mr-2" />
                          View Catalogue
                        </a>
                      </div>
                      <button
                        type="button"
                        onClick={removeCatalogue}
                        className="absolute -top-2 -right-2 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </>
                  ) : (
                    <div className="text-center">
                      <FileText className="mx-auto h-6 w-6 text-muted-foreground" />
                      <label
                        htmlFor="catalogueUpload"
                        className="mt-1 block text-xs font-medium text-muted-foreground cursor-pointer"
                      >
                        Upload PDF
                        <input
                          id="catalogueUpload"
                          type="file"
                          accept=".pdf,application/pdf"
                          className="sr-only"
                          onChange={handleCatalogueUpload}
                          disabled={isUploadingCatalogue}
                        />
                      </label>
                      {isUploadingCatalogue && (
                        <div className="mt-1 px-2">
                          <div className="text-xs text-muted-foreground mb-1 text-center">
                            {catalogueProgress.percentage}%
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1">
                            <div 
                              className="bg-blue-600 h-1 rounded-full transition-all duration-300" 
                              style={{ width: `${catalogueProgress.percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">
                    Upload a product catalogue PDF containing detailed specifications and features.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                User Manual
              </label>
              <div className="flex items-start space-x-4">
                <div className="relative w-40 h-16 rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center">
                  {formData.userManualFileUrl ? (
                    <>
                      <div className="flex items-center justify-center w-full h-full">
                        <a href={formData.userManualFileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline text-sm flex items-center">
                          <FileText className="h-5 w-5 mr-2" />
                          View Manual
                        </a>
                      </div>
                      <button
                        type="button"
                        onClick={removeManual}
                        className="absolute -top-2 -right-2 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </>
                  ) : (
                    <div className="text-center">
                      <FileText className="mx-auto h-6 w-6 text-muted-foreground" />
                      <label
                        htmlFor="manualUpload"
                        className="mt-1 block text-xs font-medium text-muted-foreground cursor-pointer"
                      >
                        Upload PDF
                        <input
                          id="manualUpload"
                          type="file"
                          accept=".pdf,application/pdf"
                          className="sr-only"
                          onChange={handleManualUpload}
                          disabled={isUploadingManual}
                        />
                      </label>
                      {isUploadingManual && (
                        <div className="mt-1 px-2">
                          <div className="text-xs text-muted-foreground mb-1 text-center">
                            {manualProgress.percentage}%
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1">
                            <div 
                              className="bg-blue-600 h-1 rounded-full transition-all duration-300" 
                              style={{ width: `${manualProgress.percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">
                    Upload a user manual PDF with installation, operation, and maintenance instructions.
                  </p>
                </div>
              </div>
            </div>

            <Button type="submit" disabled={isLoading || isUploadingCover || isUploadingCatalogue || isUploadingManual}>
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