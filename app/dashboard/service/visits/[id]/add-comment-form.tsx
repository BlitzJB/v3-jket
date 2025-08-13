"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { MediaCapture } from "@/components/ui/media-capture"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { Paperclip, Loader2 } from "lucide-react"
import { MediaFile } from "@/types/media-capture"
import { usePresignedUpload } from '@/hooks/use-presigned-upload'

interface AddCommentFormProps {
  visitId: string
}

export function AddCommentForm({ visitId }: AddCommentFormProps) {
  const router = useRouter()
  const [comment, setComment] = useState("")
  const [attachments, setAttachments] = useState<{url: string, objectName: string, name: string}[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showMediaCapture, setShowMediaCapture] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const { uploadFile } = usePresignedUpload()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!comment.trim()) return

    try {
      setIsSubmitting(true)

      const response = await fetch(`/api/service-visits/${visitId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          comment,
          attachments: attachments.map(attachment => ({
            name: attachment.name,
            objectName: attachment.objectName
          }))
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to add comment")
      }

      setComment("")
      setAttachments([])
      router.refresh()
      toast.success('Comment added', {
        description: 'Your comment has been added successfully.',
      })
    } catch (error) {
      console.error(error)
      toast.error('Error', {
        description: 'Failed to add comment. Please try again.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleCapture(file: MediaFile) {
    setIsUploading(true)
    try {
      const result = await uploadFile(file.file, {
        onSuccess: (uploadResult) => {
          setAttachments(prev => [...prev, {
            url: uploadResult.publicUrl,
            objectName: uploadResult.objectName,
            name: file.file.name
          }])
        }
      })
    } catch (error) {
      console.error('Error uploading media:', error)
    } finally {
      setIsUploading(false)
      setShowMediaCapture(false)
    }
  }

  function removeAttachment(index: number) {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Add a comment..."
        className="min-h-[100px]"
      />
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {attachments.map((attachment, index) => (
            <div
              key={index}
              className="inline-flex items-center gap-2 bg-secondary px-2 py-1 rounded-md text-xs"
            >
              <Paperclip className="h-3 w-3" />
              {attachment.name}
              <button
                type="button"
                onClick={() => removeAttachment(index)}
                className="text-muted-foreground hover:text-foreground"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowMediaCapture(true)}
          disabled={isUploading}
        >
          {isUploading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Paperclip className="h-4 w-4 mr-2" />
              Add Attachment
            </>
          )}
        </Button>
        <Button type="submit" disabled={isSubmitting || isUploading || !comment.trim()}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Add Comment
        </Button>
      </div>
      {showMediaCapture && (
        <MediaCapture
          onCapture={handleCapture}
          onClose={() => setShowMediaCapture(false)}
        />
      )}
    </form>
  )
} 