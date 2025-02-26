import type { DefaultSession } from 'next-auth'
import type { Role } from '@/lib/rbac/types'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: Role
      approved: boolean
    } & DefaultSession['user']
  }

  interface User {
    role: Role
    approved: boolean
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: Role
    approved: boolean
  }
} 