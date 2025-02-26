export type UserRole = 
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'QUALITY_TESTING'
  | 'DISPATCH_MANAGER'
  | 'MANUFACTURER'
  | 'DISTRIBUTOR'
  | 'SERVICE_ENGINEER'
  | 'CUSTOMER_SERVICE'
  | 'SALES'
  | 'USER'
  | 'GUEST'

export type DashboardRoute = {
  path: string
  title: string
  description: string
}

export const DASHBOARD_ROUTES: Record<UserRole, DashboardRoute> = {
  SUPER_ADMIN: {
    path: '/dashboard/admin',
    title: 'Admin Dashboard',
    description: 'Full system administration and oversight'
  },
  ADMIN: {
    path: '/dashboard/admin',
    title: 'Admin Dashboard',
    description: 'System administration and management'
  },
  QUALITY_TESTING: {
    path: '/dashboard/quality-testing',
    title: 'Quality Testing Dashboard',
    description: 'Quality assurance and testing management'
  },
  DISPATCH_MANAGER: {
    path: '/dashboard/dispatch',
    title: 'Dispatch Dashboard',
    description: 'Dispatch and logistics management'
  },
  MANUFACTURER: {
    path: '/dashboard/manufacturer',
    title: 'Manufacturer Dashboard',
    description: 'Manufacturing operations and management'
  },
  DISTRIBUTOR: {
    path: '/dashboard/distributor',
    title: 'Distributor Dashboard',
    description: 'Distribution and inventory management'
  },
  SERVICE_ENGINEER: {
    path: '/dashboard/service',
    title: 'Service Dashboard',
    description: 'Service and maintenance management'
  },
  CUSTOMER_SERVICE: {
    path: '/dashboard/customer-service',
    title: 'Customer Service Dashboard',
    description: 'Customer support and service management'
  },
  SALES: {
    path: '/dashboard/sales',
    title: 'Sales Dashboard',
    description: 'Sales operations and management'
  },
  USER: {
    path: '/dashboard',
    title: 'Dashboard',
    description: 'User dashboard'
  },
  GUEST: {
    path: '/dashboard',
    title: 'Dashboard',
    description: 'Limited access dashboard'
  }
} 