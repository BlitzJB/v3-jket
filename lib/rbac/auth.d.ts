import 'next-auth'
import { type Role } from './types'

declare module 'next-auth' {
  interface User {
    role: Role
  }
  
  interface Session {
    user: User & {
      id: string
      role: Role
    }
  }
}

declare module '@auth/core/adapters' {
  interface AdapterUser {
    role: Role
  }
} 