'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { MediaCapture } from '@/components/ui/media-capture'
import { MediaFile } from '@/types/media-capture'
import { Camera, X, Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

type Attachment = {
  url: string
  objectName: string
  type: 'photo' | 'video'
}

export default function ServiceRequestPage({ 
  params 
}: { 
  params: { serialNumber: string } 
}) {
  const router = useRouter()
  const [complaint, setComplaint] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCaptureOpen, setIsCaptureOpen] = useState(false)
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [isUploading, setIsUploading] = useState(false)

  const handleCapture = async (mediaFile: MediaFile) => {
    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', mediaFile.file)

      const response = await fetch('/api/media', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      const data = await response.json()
      setAttachments(prev => [...prev, {
        url: data.url,
        objectName: data.objectName,
        type: mediaFile.type
      }])
    } catch (error) {
      console.error('Error uploading media:', error)
      toast.error('Failed to upload media')
    } finally {
      setIsUploading(false)
      setIsCaptureOpen(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!complaint.trim()) {
      toast.error('Please describe the issue')
      return
    }

    setIsSubmitting(true)
    try {
      // First get the machine ID using the serial number
      const machineResponse = await fetch(`/api/machines/${params.serialNumber}`)
      if (!machineResponse.ok) {
        throw new Error('Machine not found')
      }
      const machine = await machineResponse.json()

      const response = await fetch('/api/service-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          machineId: machine.id,
          complaint,
          attachments: attachments.map(a => ({
            url: a.url,
            objectName: a.objectName,
            type: a.type
          }))
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to submit service request')
      }

      toast.success('Service request submitted successfully')
      router.push(`/machines/${params.serialNumber}`)
    } catch (error) {
      console.error('Error submitting service request:', error)
      toast.error('Failed to submit service request')
    } finally {
      setIsSubmitting(false)
    }
  }

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <Link href={`/machines/${params.serialNumber}`}>
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Machine Details
          </Button>
        </Link>

        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold">Request Service</h1>
            <p className="text-muted-foreground mt-1">
              Describe the issue you're experiencing with your machine
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-2">
              <label htmlFor="complaint" className="text-sm font-medium">
                Issue Description
              </label>
              <Textarea
                id="complaint"
                placeholder="Please provide details about the issue..."
                value={complaint}
                onChange={(e) => setComplaint(e.target.value)}
                rows={6}
                className="resize-none"
              />
            </div>

            <div className="space-y-4">
              <label className="text-sm font-medium">
                Media Attachments
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {attachments.map((attachment, index) => (
                  <div key={index} className="relative group aspect-video">
                    {attachment.type === 'photo' ? (
                      <img
                        src={attachment.url}
                        alt={`Attachment ${index + 1}`}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <video
                        src={attachment.url}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => removeAttachment(index)}
                      className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-4 w-4 text-white" />
                    </button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  className="aspect-video w-full"
                  onClick={() => setIsCaptureOpen(true)}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    <>
                      <Camera className="h-6 w-6 mr-2" />
                      Add Photo/Video
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/machines/${params.serialNumber}`)}
                disabled={isSubmitting || isUploading}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting || isUploading}
                className="min-w-[120px]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Submitting...
                  </>
                ) : (
                  'Submit Request'
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>

      {isCaptureOpen && (
        <MediaCapture
          onCapture={handleCapture}
          onClose={() => setIsCaptureOpen(false)}
        />
      )}
    </div>
  )
} 