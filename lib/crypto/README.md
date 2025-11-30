# Edge-Safe Encryption Module

This module provides encryption utilities compatible with Next.js Edge Runtime using the Web Crypto API.

## Purpose

Stores user passwords securely (encrypted at rest) until they can be approved by an admin. Once approved, the password is decrypted and sent to the user via email, then removed from storage.

## Setup

1. Generate a secure 32-byte encryption key:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   ```

2. Add the key to your `.env` file:
   ```
   ENCRYPTION_KEY="your-generated-base64-key-here"
   ```

## Usage

```typescript
import { encryptPassword, decryptPassword } from '@/lib/crypto/edge-encryption'

// Encrypt a password
const encrypted = await encryptPassword('mySecretPassword123')

// Decrypt a password
const decrypted = await decryptPassword(encrypted)
```

## Security Notes

- Uses AES-GCM encryption algorithm (256-bit key)
- Each encryption generates a unique IV (Initialization Vector)
- The IV is prepended to the encrypted data for decryption
- Compatible with Next.js Edge Runtime (uses Web Crypto API, not Node.js crypto)
- The encryption key should be kept secret and never committed to version control
- Encrypted passwords are automatically cleared after user approval

## Implementation Details

- **Algorithm**: AES-GCM (Galois/Counter Mode)
- **Key Length**: 256 bits (32 bytes)
- **IV Length**: 12 bytes (96 bits) - recommended for GCM
- **Storage Format**: Base64-encoded string with IV prepended to ciphertext
