import { NextResponse } from 'next/server'
import { uploadFile, getFileUrl, ALLOWED_MIME_TYPES } from '@/lib/minio'
import { dynamic, revalidate } from '../route-segment-config'

export { dynamic, revalidate }

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    
    if (!file) {
      return new NextResponse('No file provided', { status: 400 })
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return new NextResponse('Invalid file type', { status: 400 })
    }

    // Convert File to Buffer
    const buffer = Buffer.from(await file.arrayBuffer())
    
    // Upload to Minio
    const objectName = await uploadFile(buffer, file.name, file.type)
    
    // Return the public URL
    return NextResponse.json({
      url: getFileUrl(objectName),
      objectName
    })
  } catch (error) {
    console.error('[MEDIA_UPLOAD]', error)
    return new NextResponse('Upload failed', { status: 500 })
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
} 