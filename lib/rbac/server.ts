import { type Permission } from './types'
import { ROLES } from './roles'
import { auth } from '@/auth'
import { type UserRole } from '@/types/roles'

export async function hasPermission(permission: Permission): Promise<boolean> {
  console.log("hasPermission", permission)
  const session = await auth()
  console.log("session", session)
  if (!session?.user) {
    console.log("no session user")
    return false
  }

  const userRole = session.user.role as UserRole
  console.log("userRole", userRole)
  if (!userRole || !ROLES[userRole]) {
    console.log("no user role or ROLES[userRole]")
    return false
  }

  console.log("ROLES[userRole].permissions", ROLES[userRole].permissions)
  if (ROLES[userRole].permissions.includes('*')) {
    console.log("has * permission")
    return true
  }
  console.log("ROLES[userRole].permissions.includes(permission)", ROLES[userRole].permissions.includes(permission))
  return ROLES[userRole].permissions.includes(permission)
}

export async function checkPermission(permission: Permission) {
  const hasAccess = await hasPermission(permission)
  if (!hasAccess) {
    throw new Error('Unauthorized: Insufficient permissions')
  }
}

export async function withPermission<T>(
  permission: Permission,
  handler: () => Promise<T>
): Promise<T> {
  await checkPermission(permission)
  return handler()
}

// Example usage in an API route:
/*
export async function GET() {
  return withPermission('users:read', async () => {
    const users = await prisma.user.findMany()
    return Response.json(users)
  })
}
*/ 