/**
 * Edge-safe encryption utilities using Web Crypto API
 * Compatible with Next.js Edge Runtime
 */

const ALGORITHM = 'AES-GCM'
const KEY_LENGTH = 256

/**
 * Get or generate the encryption key from environment variable
 * The key should be a base64-encoded 32-byte value
 */
function getEncryptionKey(): string {
  const key = process.env.ENCRYPTION_KEY
  if (!key) {
    throw new Error('ENCRYPTION_KEY environment variable is not set')
  }
  return key
}

/**
 * Convert base64 string to ArrayBuffer
 */
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return bytes.buffer
}

/**
 * Convert ArrayBuffer to base64 string
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

/**
 * Import the encryption key for use with Web Crypto API
 */
async function importKey(): Promise<CryptoKey> {
  const keyData = base64ToArrayBuffer(getEncryptionKey())
  return await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: ALGORITHM },
    false,
    ['encrypt', 'decrypt']
  )
}

/**
 * Encrypt a plaintext string
 * Returns base64-encoded encrypted data with IV prepended
 */
export async function encryptPassword(plaintext: string): Promise<string> {
  const key = await importKey()
  const iv = crypto.getRandomValues(new Uint8Array(12)) // 12 bytes for GCM
  const encoder = new TextEncoder()
  const data = encoder.encode(plaintext)

  const encryptedData = await crypto.subtle.encrypt(
    {
      name: ALGORITHM,
      iv: iv,
    },
    key,
    data
  )

  // Combine IV and encrypted data
  const combined = new Uint8Array(iv.length + encryptedData.byteLength)
  combined.set(iv, 0)
  combined.set(new Uint8Array(encryptedData), iv.length)

  return arrayBufferToBase64(combined.buffer)
}

/**
 * Decrypt an encrypted string
 * Expects base64-encoded encrypted data with IV prepended
 */
export async function decryptPassword(encryptedBase64: string): Promise<string> {
  const key = await importKey()
  const combined = base64ToArrayBuffer(encryptedBase64)

  // Extract IV and encrypted data
  const iv = combined.slice(0, 12)
  const encryptedData = combined.slice(12)

  const decryptedData = await crypto.subtle.decrypt(
    {
      name: ALGORITHM,
      iv: iv,
    },
    key,
    encryptedData
  )

  const decoder = new TextDecoder()
  return decoder.decode(decryptedData)
}
