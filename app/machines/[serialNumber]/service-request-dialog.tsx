'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { MediaCapture } from '@/components/ui/media-capture'
import { MediaFile } from '@/types/media-capture'
import { Camera, X, Loader2 } from 'lucide-react'
import { usePresignedUpload } from '@/hooks/use-presigned-upload'

interface ServiceRequestDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  machineId: string
  onServiceRequested: () => void
}

type Attachment = {
  url: string
  objectName: string
  type: 'photo' | 'video'
}

export function ServiceRequestDialog({
  open,
  onOpenChange,
  machineId,
  onServiceRequested,
}: ServiceRequestDialogProps) {
  const [complaint, setComplaint] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCaptureOpen, setIsCaptureOpen] = useState(false)
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const { uploadFile } = usePresignedUpload()

  const handleCapture = async (mediaFile: MediaFile) => {
    setIsUploading(true)
    try {
      const result = await uploadFile(mediaFile.file, {
        onSuccess: (uploadResult) => {
          setAttachments(prev => [...prev, {
            url: uploadResult.publicUrl,
            objectName: uploadResult.objectName,
            type: mediaFile.type
          }])
        }
      })
    } catch (error) {
      console.error('Error uploading media:', error)
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
      const response = await fetch('/api/service-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          machineId,
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
      onOpenChange(false)
      setComplaint('')
      setAttachments([])
      onServiceRequested()
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
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Request Service</DialogTitle>
            <DialogDescription>
              Describe the issue you're experiencing with your machine
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="complaint" className="text-sm font-medium">
                Issue Description
              </label>
              <Textarea
                id="complaint"
                placeholder="Please provide details about the issue..."
                value={complaint}
                onChange={(e) => setComplaint(e.target.value)}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Media Attachments
              </label>
              <div className="grid grid-cols-2 gap-2">
                {attachments.map((attachment, index) => (
                  <div key={index} className="relative group">
                    {attachment.type === 'photo' ? (
                      <img
                        src={attachment.url}
                        alt={`Attachment ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                    ) : (
                      <video
                        src={attachment.url}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => removeAttachment(index)}
                      className="absolute top-1 right-1 p-1 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-4 w-4 text-white" />
                    </button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  className="h-32 w-full"
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

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting || isUploading}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting || isUploading}
                className="min-w-[100px]"
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
        </DialogContent>
      </Dialog>

      {isCaptureOpen && (
        <MediaCapture
          onCapture={handleCapture}
          onClose={() => setIsCaptureOpen(false)}
        />
      )}
    </>
  )
} 