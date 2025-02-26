# Authentication System Documentation

## Overview
This application uses NextAuth.js v5 (Beta) with a custom email/password authentication implementation. The system is designed to be edge-compatible and uses JWT strategy for session management.

## Tech Stack
- NextAuth.js v5 (Beta)
- Prisma as the database ORM
- PostgreSQL as the database
- bcryptjs for password hashing
- JWT for session management
- TypeScript for type safety

## Key Features
- Email/Password authentication
- JWT-based sessions (edge-compatible)
- Role-based access control (RBAC)
- User approval system
- Custom login and registration pages
- Type-safe session data
- Secure password hashing

## Database Schema
The authentication system uses the following Prisma models:

```prisma
model User {
  id            String    @id @default(cuid())
  name          String?
  email         String?   @unique
  emailVerified DateTime?
  image         String?
  password      String?
  role          String    @default("USER")
  approved      Boolean   @default(false)
  accounts      Account[]
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}
```

## User Approval System
The system includes a user approval mechanism:
- New users are created with `approved: false` by default
- The approved status is stored in the JWT token and available in sessions
- Can be used to implement approval workflows or restrict access
- Accessible in both client and server components

### Checking Approval Status

Server Component:
```typescript
const session = await auth()
if (!session?.user?.approved) {
  // Handle unapproved user
}
```

Client Component:
```typescript
const { data: session } = useSession()
if (!session?.user?.approved) {
  // Handle unapproved user
}
```

## Environment Variables
Required environment variables:
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/dbname"

# NextAuth
AUTH_SECRET="your-secret-key"
AUTH_URL="http://localhost:3000"
```

## Authentication Flow
1. **Registration**:
   - Endpoint: `POST /api/auth/register`
   - Creates new user with hashed password
   - Redirects to login page with success message

2. **Login**:
   - Endpoint: `POST /api/auth/login`
   - Validates credentials
   - Creates JWT session
   - Redirects to callback URL or homepage

3. **Session Management**:
   - JWT-based sessions
   - Edge-compatible
   - Session data includes user role

## Protected Routes
The middleware (`middleware.ts`) protects routes based on authentication status and user roles:

- Public routes (no auth required):
  - `/auth/login`
  - `/auth/register`
  - `/auth/error`
  - `/api/*` (API routes)
- Protected routes (auth required):
  - All other routes
- Admin routes (admin role required):
  - `/admin/*`

## Type Definitions
Custom type definitions for NextAuth (`types/next-auth.d.ts`):

```typescript
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: Role
    } & DefaultSession['user']
  }

  interface User {
    role: Role
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: Role
  }
}
```

## Usage Examples

### Getting Session Data (Server Component)
```typescript
import { auth } from '@/auth'

export default async function Page() {
  const session = await auth()
  // Access session data
  console.log(session?.user)
}
```

### Getting Session Data (Client Component)
```typescript
'use client'
import { useSession } from 'next-auth/react'

export default function Component() {
  const { data: session } = useSession()
  // Access session data
  console.log(session?.user)
}
```

### Protected API Route
```typescript
import { auth } from '@/auth'

export async function GET() {
  const session = await auth()
  if (!session) {
    return new Response('Unauthorized', { status: 401 })
  }
  // Handle authenticated request
}
```

### Role-Based Access
```typescript
const session = await auth()
if (session?.user?.role !== 'ADMIN') {
  // Handle unauthorized access
}
```

## Security Considerations
1. Passwords are hashed using bcrypt with 12 rounds of salt
2. JWT sessions are encrypted using AUTH_SECRET
3. CSRF protection is enabled by default
4. API routes are protected from authentication middleware
5. Sensitive operations validate session server-side

## Error Handling
The system provides error handling for common scenarios:
- Invalid credentials
- User already exists
- Invalid input validation
- Server errors
- Unauthorized access

## Future Improvements
Potential areas for enhancement:
1. Email verification
2. Password reset functionality
3. OAuth providers integration
4. Rate limiting
5. Two-factor authentication

## Troubleshooting
Common issues and solutions:

1. **Database Connection Issues**:
   - Verify DATABASE_URL format
   - Check PostgreSQL credentials
   - Ensure database is running

2. **Authentication Errors**:
   - Verify AUTH_SECRET is set
   - Check AUTH_URL matches deployment URL
   - Validate session cookie configuration

3. **Middleware Issues**:
   - Check matcher patterns
   - Verify public routes are accessible
   - Confirm API routes are excluded from auth checks 

## Role-Based Access Control (RBAC)

### Roles and Permissions

The system implements a comprehensive RBAC system with the following roles:

1. **ADMIN**
   - Full system access
   - All permissions including administrative functions
   - Permissions: users:read/write/delete/manage, content:read/write/delete/manage, settings:read/write, admin:access

2. **MODERATOR**
   - Content management access
   - Permissions: users:read, content:read/write/delete/manage, settings:read

3. **USER**
   - Standard user access
   - Permissions: content:read/write

4. **GUEST**
   - Limited read-only access
   - Permissions: content:read

### Available Permissions

```typescript
type Permission =
  | 'users:read'
  | 'users:write'
  | 'users:delete'
  | 'users:manage'
  | 'content:read'
  | 'content:write'
  | 'content:delete'
  | 'content:manage'
  | 'settings:read'
  | 'settings:write'
  | 'admin:access'
```

### Server-Side RBAC Usage

The `@/lib/rbac/server` module provides several utilities for permission checking:

```typescript
// Check if user has a specific permission
const hasAccess = await hasPermission('users:read')

// Throw error if user doesn't have permission
await checkPermission('users:write')

// Wrap an async operation with permission check
await withPermission('users:manage', async () => {
  // Protected operation here
})
```

### Client-Side RBAC Usage

The `@/lib/rbac/client` module provides React hooks and components for RBAC:

```typescript
// Hook to check permission
const hasAccess = usePermission('content:write')

// Hook to get all user permissions
const permissions = usePermissions()

// Component to conditionally render based on permission
<RequirePermission 
  permission="admin:access" 
  fallback={<AccessDenied />}
>
  <AdminPanel />
</RequirePermission>
```

### Implementation Details

1. **Role Definitions**
   - Roles are defined in `@/lib/rbac/roles.ts`
   - Each role has a name, description, and set of permissions
   - Permissions are hierarchical (e.g., ADMIN includes all permissions)

2. **Type Safety**
   - Full TypeScript support for roles and permissions
   - Type definitions ensure consistency across the application
   - Compile-time checking for permission strings

3. **Integration with NextAuth**
   - Role information is stored in the JWT token
   - Available in both client and server components
   - Persisted across sessions

4. **Performance**
   - Permission checks are cached in the JWT
   - No additional database queries needed
   - Edge-compatible implementation
