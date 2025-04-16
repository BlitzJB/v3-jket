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
import { Camera, Loader2, X, FileText } from 'lucide-react'
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
  catalogueFileUrl: string
  userManualFileUrl: string
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
  const [isUploading, setIsUploading] = useState(false)
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
          catalogueFileUrl: model.catalogueFileUrl || '',
          userManualFileUrl: model.userManualFileUrl || '',
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

  const handleCatalogueUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploadingCatalogue(true)
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
      setFormData(prev => ({ ...prev, catalogueFileUrl: data.url }))
      toast.success('Catalogue uploaded successfully')
    } catch (error) {
      console.error('Error uploading catalogue:', error)
      toast.error('Failed to upload catalogue')
    } finally {
      setIsUploadingCatalogue(false)
    }
  }

  const handleManualUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploadingManual(true)
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
      setFormData(prev => ({ ...prev, userManualFileUrl: data.url }))
      toast.success('User manual uploaded successfully')
    } catch (error) {
      console.error('Error uploading user manual:', error)
      toast.error('Failed to upload user manual')
    } finally {
      setIsUploadingManual(false)
    }
  }

  const removeCatalogue = () => {
    setFormData(prev => ({ ...prev, catalogueFileUrl: '' }))
  }

  const removeManual = () => {
    setFormData(prev => ({ ...prev, userManualFileUrl: '' }))
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
                        htmlFor="coverImage"
                        className="mt-2 block text-sm font-medium text-muted-foreground cursor-pointer"
                      >
                        Upload Image
                        <input
                          type="file"
                          id="coverImage"
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
                        <div className="mt-1">
                          <Loader2 className="h-3 w-3 animate-spin mx-auto" />
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
                        <div className="mt-1">
                          <Loader2 className="h-3 w-3 animate-spin mx-auto" />
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

            <div className="flex justify-between pt-4">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button type="button" variant="destructive" disabled={isDeleting}>
                    {isDeleting ? 'Deleting...' : 'Delete Model'}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete the
                      machine model.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <div className="flex space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/dashboard/admin/equipment')}
                  disabled={isLoading || isUploading || isDeleting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading || isUploading || isDeleting}>
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
} 