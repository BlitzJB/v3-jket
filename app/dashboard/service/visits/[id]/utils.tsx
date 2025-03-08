import { FileIcon, ImageIcon, FileTextIcon, VideoIcon } from "lucide-react"

export function getFileIcon(type: string) {
  switch (type.toLowerCase()) {
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

export function isImageType(type: string) {
  return ['jpg', 'jpeg', 'png', 'gif'].includes(type.toLowerCase())
} 