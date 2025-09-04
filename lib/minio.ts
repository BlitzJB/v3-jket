import { Client } from 'minio'

const BUCKET_NAME = process.env.MINIO_BUCKET_NAME || 'service-attachments'

export const minioClient = new Client({
  endPoint: process.env.MINIO_ENDPOINT || 'localhost',
  port: parseInt(process.env.MINIO_PORT || '9090', 10),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin'
})

export async function ensureBucketExists() {
  const exists = await minioClient.bucketExists(BUCKET_NAME)
  if (!exists) {
    await minioClient.makeBucket(BUCKET_NAME, 'us-east-1')
    // Make bucket public for read access
    const policy = {
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: { AWS: ['*'] },
          Action: ['s3:GetObject'],
          Resource: [`arn:aws:s3:::${BUCKET_NAME}/*`]
        }
      ]
    }
    await minioClient.setBucketPolicy(BUCKET_NAME, JSON.stringify(policy))
  }
}

export async function generatePresignedUploadUrl(fileName: string, contentType: string, expirySeconds: number = 24 * 60 * 60) {
  await ensureBucketExists()
  
  const objectName = `${Date.now()}-${fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`
  
  let presignedUrl = await minioClient.presignedPutObject(
    BUCKET_NAME, 
    objectName, 
    expirySeconds
  )
  
  // If using reverse proxy, rewrite the presigned URL
  const publicUrl = process.env.MINIO_PUBLIC_URL
  const publicPath = process.env.MINIO_PUBLIC_PATH || '/media'
  
  if (publicUrl) {
    // Parse the original presigned URL to extract query parameters
    const originalUrl = new URL(presignedUrl)
    const queryParams = originalUrl.searchParams
    
    // Create new URL with public domain and proxy path
    presignedUrl = `${publicUrl}${publicPath}/${BUCKET_NAME}/${objectName}?${queryParams.toString()}`
  }
  
  return {
    presignedUrl,
    objectName,
    publicUrl: getFileUrl(objectName)
  }
}

export async function uploadFile(file: Buffer, fileName: string, contentType: string) {
  await ensureBucketExists()
  
  const objectName = `${Date.now()}-${fileName}`
  await minioClient.putObject(BUCKET_NAME, objectName, file, file.length, {
    'Content-Type': contentType
  })
  
  return objectName
}

export function getFileUrl(objectName: string) {
  const publicUrl = process.env.MINIO_PUBLIC_URL
  const publicPath = process.env.MINIO_PUBLIC_PATH || '/media'
  const bucketName = process.env.MINIO_BUCKET_NAME || 'service-attachments'
  
  if (publicUrl) {
    // Using reverse proxy - return public URL
    return `${publicUrl}${publicPath}/${bucketName}/${objectName}`
  }
  
  // Fallback to API route
  return `/api/media/${objectName}`
}

export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'video/webm',
  'video/mp4',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
] 