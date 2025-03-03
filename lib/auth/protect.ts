import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { DASHBOARD_ROUTES } from '@/types/roles'
import { UserRole } from '@/types/roles'
import { canAccessDashboard } from '@/lib/utils/dashboard'

export async function protectPage(path: string) {
  const session = await auth()

  // Public paths that don't require authentication
  const publicPaths = ['/auth/login', '/auth/register', '/auth/error']
  const isPublicPath = publicPaths.some(p => path.startsWith(p))

  // If the user is not signed in and trying to access a protected route
  if (!session?.user && !isPublicPath) {
    redirect(`/auth/login?callbackUrl=${encodeURIComponent(path)}`)
  }

  // If the user is signed in and trying to access auth pages
  if (session?.user && isPublicPath) {
    const userRole = session.user.role as UserRole
    const dashboardRoute = DASHBOARD_ROUTES[userRole].path
    redirect(dashboardRoute)
  }

  // Check role-based access for dashboard routes
  if (path.startsWith('/dashboard')) {
    const userRole = session?.user?.role as UserRole || 'GUEST'

    // Check if user can access this dashboard
    if (!canAccessDashboard(userRole, path)) {
      // Redirect to user's assigned dashboard
      redirect(DASHBOARD_ROUTES[userRole].path)
    }
  }

  return session
} 