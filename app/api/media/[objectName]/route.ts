import { NextResponse } from 'next/server'
import { minioClient } from '@/lib/minio'
import { Readable } from 'stream'

const BUCKET_NAME = 'service-attachments'

export async function GET(
  request: Request,
  { params }: { params: { objectName: string } }
) {
  try {
    const objectName = params.objectName
    const dataStream = await minioClient.getObject(BUCKET_NAME, objectName)
    
    // Get object stats to get content type
    const stat = await minioClient.statObject(BUCKET_NAME, objectName)
    
    // Convert to web stream
    const readable = Readable.from(dataStream)
    const stream = new ReadableStream({
      start(controller) {
        readable.on('data', (chunk) => controller.enqueue(chunk))
        readable.on('end', () => controller.close())
        readable.on('error', (err) => controller.error(err))
      },
    })

    return new NextResponse(stream, {
      headers: {
        'Content-Type': stat.metaData?.['content-type'] || 'application/octet-stream',
        'Cache-Control': 'public, max-age=31536000',
      },
    })
  } catch (error) {
    console.error('[MEDIA_GET]', error)
    return new NextResponse('Media not found', { status: 404 })
  }
} 