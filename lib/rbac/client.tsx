'use client'

import { useSession } from 'next-auth/react'
import { type Permission } from './types'
import { ROLES } from './roles'
import { type ReactNode } from 'react'

export function usePermission(permission: Permission): boolean {
  try {
    const session = useSession()
    
    // Handle cases where useSession returns undefined or null
    if (!session || typeof session !== 'object') return false
    
    // Handle loading state
    if (session.status === 'loading') return false
    
    const sessionData = session.data
    console.log('session', sessionData)
    
    if (!sessionData?.user) return false

    const userRole = sessionData.user.role as keyof typeof ROLES
    if (!userRole || !ROLES[userRole]) return false

    // Check for wildcard permission (SUPER_ADMIN)
    if (ROLES[userRole].permissions.includes('*')) return true
    
    return ROLES[userRole].permissions.includes(permission)
  } catch (error) {
    console.error('Error in usePermission:', error)
    return false
  }
}

export function usePermissions(): Permission[] {
  try {
    const session = useSession()
    
    // Handle cases where useSession returns undefined or null
    if (!session || typeof session !== 'object') return []
    
    // Handle loading state
    if (session.status === 'loading') return []
    
    const sessionData = session.data
    if (!sessionData?.user) return []

    const userRole = sessionData.user.role as keyof typeof ROLES
    if (!userRole || !ROLES[userRole]) return []

    return ROLES[userRole].permissions
  } catch (error) {
    console.error('Error in usePermissions:', error)
    return []
  }
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