import { NextResponse } from 'next/server'
import { minioClient, ALLOWED_MIME_TYPES } from '@/lib/minio'
import { dynamic, revalidate } from '../../route-segment-config'

export { dynamic, revalidate }

const BUCKET_NAME = 'service-attachments'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { fileName, fileType, fileSize } = body

    // Validate file type
    if (!ALLOWED_MIME_TYPES.includes(fileType)) {
      return new NextResponse('Invalid file type', { status: 400 })
    }

    // Validate file name
    if (!fileName || typeof fileName !== 'string') {
      return new NextResponse('File name is required', { status: 400 })
    }

    // Generate unique object name
    const timestamp = Date.now()
    const objectName = `${timestamp}-${fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`

    // Generate presigned URL for PUT operation (24 hours expiry)
    const presignedUrl = await minioClient.presignedPutObject(
      BUCKET_NAME, 
      objectName, 
      24 * 60 * 60 // 24 hours
    )

    // Return presigned URL and object info
    return NextResponse.json({
      presignedUrl,
      objectName,
      publicUrl: `/api/media/${objectName}`,
      expiresIn: 24 * 60 * 60 // 24 hours in seconds
    })
  } catch (error) {
    console.error('[PRESIGNED_URL_POST]', error)
    return new NextResponse('Failed to generate presigned URL', { status: 500 })
  }
}