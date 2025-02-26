import { UserRole, DASHBOARD_ROUTES } from '@/types/roles'

export function getDashboardRoute(role: UserRole): string {
  return DASHBOARD_ROUTES[role].path
}

export function getDashboardInfo(role: UserRole) {
  return DASHBOARD_ROUTES[role]
}

export function isAdminRole(role: UserRole): boolean {
  return role === 'SUPER_ADMIN' || role === 'ADMIN'
}

export function canAccessDashboard(userRole: UserRole, targetDashboardPath: string): boolean {
  // Admin roles can access all dashboards
  if (isAdminRole(userRole)) {
    return true
  }
  
  // For other roles, check if the target path starts with their dashboard path
  const userDashboard = DASHBOARD_ROUTES[userRole].path
  
  // Allow access to any path that starts with the user's dashboard path
  // e.g., /dashboard/distributor/* for DISTRIBUTOR role
  return targetDashboardPath.startsWith(userDashboard)
} 