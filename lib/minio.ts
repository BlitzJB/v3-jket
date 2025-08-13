import { Client } from 'minio'

const BUCKET_NAME = 'service-attachments'

export const minioClient = new Client({
  endPoint: 'localhost',
  port: 9090,
  useSSL: false,
  accessKey: 'minioadmin',
  secretKey: 'minioadmin'
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
  
  const presignedUrl = await minioClient.presignedPutObject(
    BUCKET_NAME, 
    objectName, 
    expirySeconds
  )
  
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