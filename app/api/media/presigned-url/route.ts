import { NextResponse } from 'next/server'
import { minioClient, ALLOWED_MIME_TYPES, generatePresignedUploadUrl } from '@/lib/minio'
import { dynamic, revalidate } from '../../route-segment-config'

export { dynamic, revalidate }

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

    // Use the generatePresignedUploadUrl function from minio.ts
    const result = await generatePresignedUploadUrl(fileName, fileType)

    // Return presigned URL and object info
    return NextResponse.json({
      ...result,
      expiresIn: 24 * 60 * 60 // 24 hours in seconds
    })
  } catch (error) {
    console.error('[PRESIGNED_URL_POST]', error)
    return new NextResponse('Failed to generate presigned URL', { status: 500 })
  }
}