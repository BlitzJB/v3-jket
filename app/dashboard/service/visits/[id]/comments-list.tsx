"use client"

import { format } from "date-fns"
import { Card } from "@/components/ui/card"
import { Paperclip } from "lucide-react"

interface Comment {
  id: string
  comment: string
  createdAt: Date
  attachments: Array<{
    id: string
    name: string
    url: string
  }>
}

interface CommentsListProps {
  comments: Comment[]
}

export function CommentsList({ comments }: CommentsListProps) {
  if (comments.length === 0) {
    return (
      <div className="text-center text-sm text-muted-foreground py-8">
        No comments yet
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {comments.map((comment) => (
        <Card key={comment.id} className="p-4">
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">
              {format(new Date(comment.createdAt), 'PPP p')}
            </div>
            <div className="text-sm whitespace-pre-wrap">
              {comment.comment}
            </div>
            {comment.attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {comment.attachments.map((attachment) => (
                  <a
                    key={attachment.id}
                    href={attachment.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    <Paperclip className="h-3 w-3" />
                    {attachment.name}
                  </a>
                ))}
              </div>
            )}
          </div>
        </Card>
      ))}
    </div>
  )
} 