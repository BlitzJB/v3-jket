"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { MediaCapture } from "@/components/ui/media-capture"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { Paperclip, Loader2 } from "lucide-react"
import { MediaFile } from "@/types/media-capture"

interface AddCommentFormProps {
  visitId: string
}

export function AddCommentForm({ visitId }: AddCommentFormProps) {
  const router = useRouter()
  const [comment, setComment] = useState("")
  const [attachments, setAttachments] = useState<MediaFile[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showMediaCapture, setShowMediaCapture] = useState(false)

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
          attachments: attachments.map(file => ({
            name: file.file.name,
            objectName: file.id
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

  function handleCapture(file: MediaFile) {
    setAttachments(prev => [...prev, file])
    setShowMediaCapture(false)
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
          {attachments.map((file, index) => (
            <div
              key={index}
              className="inline-flex items-center gap-2 bg-secondary px-2 py-1 rounded-md text-xs"
            >
              <Paperclip className="h-3 w-3" />
              {file.file.name}
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
        >
          <Paperclip className="h-4 w-4 mr-2" />
          Add Attachment
        </Button>
        <Button type="submit" disabled={isSubmitting || !comment.trim()}>
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