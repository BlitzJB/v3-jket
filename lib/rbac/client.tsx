'use client'

import { useSession } from 'next-auth/react'
import { type Permission } from './types'
import { ROLES } from './roles'
import { type ReactNode } from 'react'

export function usePermission(permission: Permission): boolean {
  const { data: session } = useSession()
  if (!session?.user) return false

  const userRole = session.user.role as keyof typeof ROLES
  if (!userRole || !ROLES[userRole]) return false

  // Check for wildcard permission (SUPER_ADMIN)
  if (ROLES[userRole].permissions.includes('*')) return true
  
  return ROLES[userRole].permissions.includes(permission)
}

export function usePermissions(): Permission[] {
  const { data: session } = useSession()
  if (!session?.user) return []

  const userRole = session.user.role as keyof typeof ROLES
  if (!userRole || !ROLES[userRole]) return []

  return ROLES[userRole].permissions
}

interface RequirePermissionProps {
  permission: Permission
  children: ReactNode
  fallback?: ReactNode
}

export function RequirePermission({
  permission,
  children,
  fallback = null,
}: RequirePermissionProps) {
  const hasAccess = usePermission(permission)
  return hasAccess ? <>{children}</> : <>{fallback}</>
}

// Example usage in a component:
/*
function AdminPanel() {
  return (
    <RequirePermission permission="admin:access" fallback={<p>Access denied</p>}>
      <div>Admin content here</div>
    </RequirePermission>
  )
}
*/ 