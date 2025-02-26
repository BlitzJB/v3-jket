import { auth } from '@/auth'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { DASHBOARD_ROUTES } from '@/types/roles'
import { UserRole } from '@/types/roles'
import { canAccessDashboard } from '@/lib/utils/dashboard'

export async function middleware(request: NextRequest) {
  const session = await auth()
  
  // Public paths that don't require authentication
  const publicPaths = ['/auth/login', '/auth/register', '/auth/error']
  const isPublicPath = publicPaths.some(path => 
    request.nextUrl.pathname.startsWith(path)
  )

  // If the user is not signed in and trying to access a protected route
  if (!session?.user && !isPublicPath) {
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('callbackUrl', request.url)
    return NextResponse.redirect(loginUrl)
  }

  // If the user is signed in and trying to access auth pages
  if (session?.user && isPublicPath) {
    const userRole = session.user.role as UserRole
    const dashboardRoute = DASHBOARD_ROUTES[userRole].path
    return NextResponse.redirect(new URL(dashboardRoute, request.url))
  }

  // Check role-based access for dashboard routes
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    const userRole = session?.user?.role as UserRole || 'GUEST'
    const currentPath = request.nextUrl.pathname

    // Check if user can access this dashboard
    if (!canAccessDashboard(userRole, currentPath)) {
      // Redirect to user's assigned dashboard
      return NextResponse.redirect(new URL(DASHBOARD_ROUTES[userRole].path, request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - logo files
     * - public folder
     * - api routes
     */
    '/((?!api|_next/static|_next/image|favicon.ico|logo-.*\\.svg|public/).*)',
  ],
} 