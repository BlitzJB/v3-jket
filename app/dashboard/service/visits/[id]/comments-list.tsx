"use client"

import { format } from "date-fns"
import { Card } from "@/components/ui/card"
import { FileIcon, ImageIcon, Paperclip, FileTextIcon, VideoIcon } from "lucide-react"
import Image from "next/image"

interface Comment {
  id: string
  comment: string
  createdAt: Date
  attachments: Array<{
    id: string
    name: string
    url: string
    type: string
  }>
}

interface CommentsListProps {
  comments: Comment[]
}

function getFileIcon(type: string) {
  switch (type) {
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
      return <ImageIcon className="h-4 w-4" />
    case 'pdf':
      return <FileTextIcon className="h-4 w-4" />
    case 'mp4':
    case 'mov':
    case 'avi':
      return <VideoIcon className="h-4 w-4" />
    default:
      return <FileIcon className="h-4 w-4" />
  }
}

function isImageType(type: string) {
  return ['jpg', 'jpeg', 'png', 'gif'].includes(type)
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
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
                {comment.attachments.map((attachment) => (
                  <a
                    key={attachment.id}
                    href={attachment.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative block"
                  >
                    {isImageType(attachment.type) ? (
                      <div className="relative aspect-square overflow-hidden rounded-lg border">
                        <Image
                          src={attachment.url}
                          alt={attachment.name}
                          fill
                          className="object-cover transition-transform group-hover:scale-105"
                        />
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 p-3 rounded-lg border hover:bg-muted transition-colors">
                        {getFileIcon(attachment.type)}
                        <span className="text-sm truncate">{attachment.name}</span>
                      </div>
                    )}
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