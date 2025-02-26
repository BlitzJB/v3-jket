import { RoleDefinition } from './types'
import { UserRole } from '@/types/roles'

export const ROLES: Record<UserRole, RoleDefinition> = {
  SUPER_ADMIN: {
    name: 'SUPER_ADMIN',
    description: 'Complete system access with all permissions',
    permissions: ['*'],
  },
  ADMIN: {
    name: 'ADMIN',
    description: 'Full system access',
    permissions: [
      'users:read',
      'users:write',
      'users:delete',
      'users:manage',
      'content:read',
      'content:write',
      'content:delete',
      'content:manage',
      'settings:read',
      'settings:write',
      'admin:access',
      'equipment:read',
      'equipment:write',
      'equipment:delete',
      'equipment:manage',
    ],
  },
  QUALITY_TESTING: {
    name: 'QUALITY_TESTING',
    description: 'Quality testing and assurance management',
    permissions: [
      'quality:read',
      'quality:write',
      'quality:manage',
      'reports:read',
      'reports:write',
    ],
  },
  DISPATCH_MANAGER: {
    name: 'DISPATCH_MANAGER',
    description: 'Dispatch and logistics management',
    permissions: [
      'dispatch:read',
      'dispatch:write',
      'dispatch:manage',
      'inventory:read',
      'reports:read',
    ],
  },
  MANUFACTURER: {
    name: 'MANUFACTURER',
    description: 'Manufacturing operations',
    permissions: [
      'manufacturing:read',
      'manufacturing:write',
      'manufacturing:manage',
      'inventory:read',
      'reports:read',
    ],
  },
  DISTRIBUTOR: {
    name: 'DISTRIBUTOR',
    description: 'Distribution management',
    permissions: [
      'distribution:read',
      'distribution:write',
      'distribution:manage',
      'inventory:read',
      'reports:read',
      'distributor:dashboard:read',
      'distributor:inventory:read',
      'distributor:sales:read',
      'distributor:sales:write',
      'distributor:customers:read',
      'distributor:customers:write'
    ],
  },
  SERVICE_ENGINEER: {
    name: 'SERVICE_ENGINEER',
    description: 'Service and maintenance operations',
    permissions: [
      'service:read',
      'service:write',
      'service:manage',
      'reports:read',
      'reports:write',
    ],
  },
  CUSTOMER_SERVICE: {
    name: 'CUSTOMER_SERVICE',
    description: 'Customer support management',
    permissions: [
      'support:read',
      'support:write',
      'support:manage',
      'users:read',
      'users:write',
      'reports:read',
    ],
  },
  SALES: {
    name: 'SALES',
    description: 'Sales operations and management',
    permissions: [
      'distributor:dashboard:read',
      'distributor:inventory:read',
      'distributor:sales:read',
      'distributor:sales:write',
      'distributor:customers:read',
      'distributor:customers:write',
      'reports:read',
      'reports:write',
    ],
  },
  USER: {
    name: 'USER',
    description: 'Standard user access',
    permissions: ['content:read', 'content:write'],
  },
  GUEST: {
    name: 'GUEST',
    description: 'Limited read-only access',
    permissions: ['content:read'],
  },
} 

