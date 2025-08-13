'use client'

import { useState, useCallback } from 'react'
import { toast } from 'sonner'

export type UploadProgress = {
  loaded: number
  total: number
  percentage: number
}

export type UploadResult = {
  objectName: string
  publicUrl: string
}

export type UploadOptions = {
  onProgress?: (progress: UploadProgress) => void
  onSuccess?: (result: UploadResult) => void
  onError?: (error: Error) => void
}

export function usePresignedUpload() {
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState<UploadProgress>({ loaded: 0, total: 0, percentage: 0 })

  const uploadFile = useCallback(async (
    file: File, 
    options: UploadOptions = {}
  ): Promise<UploadResult> => {
    setIsUploading(true)
    setProgress({ loaded: 0, total: file.size, percentage: 0 })

    try {
      // Step 1: Get presigned URL from our API
      const presignedResponse = await fetch('/api/media/presigned-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
        }),
      })

      if (!presignedResponse.ok) {
        const errorText = await presignedResponse.text()
        throw new Error(`Failed to get presigned URL: ${errorText}`)
      }

      const { presignedUrl, objectName, publicUrl } = await presignedResponse.json()

      // Step 2: Upload file directly to MinIO using presigned URL
      const uploadPromise = new Promise<UploadResult>((resolve, reject) => {
        const xhr = new XMLHttpRequest()

        // Track upload progress
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const progressData = {
              loaded: event.loaded,
              total: event.total,
              percentage: Math.round((event.loaded / event.total) * 100)
            }
            setProgress(progressData)
            options.onProgress?.(progressData)
          }
        }

        xhr.onload = () => {
          if (xhr.status === 200) {
            const result = { objectName, publicUrl }
            options.onSuccess?.(result)
            resolve(result)
          } else {
            const error = new Error(`Upload failed with status ${xhr.status}`)
            options.onError?.(error)
            reject(error)
          }
        }

        xhr.onerror = () => {
          const error = new Error('Upload failed due to network error')
          options.onError?.(error)
          reject(error)
        }

        xhr.open('PUT', presignedUrl)
        xhr.setRequestHeader('Content-Type', file.type)
        xhr.send(file)
      })

      const result = await uploadPromise
      toast.success('File uploaded successfully')
      return result

    } catch (error) {
      console.error('Upload error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Upload failed'
      toast.error(`Upload failed: ${errorMessage}`)
      options.onError?.(error as Error)
      throw error
    } finally {
      setIsUploading(false)
    }
  }, [])

  const uploadMultipleFiles = useCallback(async (
    files: File[],
    options: UploadOptions = {}
  ): Promise<UploadResult[]> => {
    const results: UploadResult[] = []
    
    for (const file of files) {
      try {
        const result = await uploadFile(file, {
          ...options,
          onProgress: (progress) => {
            // For multiple files, we could implement overall progress tracking here
            options.onProgress?.(progress)
          }
        })
        results.push(result)
      } catch (error) {
        console.error(`Failed to upload file ${file.name}:`, error)
        // Continue with other files even if one fails
      }
    }
    
    return results
  }, [uploadFile])

  return {
    uploadFile,
    uploadMultipleFiles,
    isUploading,
    progress,
  }
}