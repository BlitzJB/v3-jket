import { UserRole } from '@/types/roles'

export type Permission =
  | '*'  // Wildcard permission for super admin
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
  | 'quality:read'
  | 'quality:write'
  | 'quality:manage'
  | 'dispatch:read'
  | 'dispatch:write'
  | 'dispatch:manage'
  | 'manufacturing:read'
  | 'manufacturing:write'
  | 'manufacturing:manage'
  | 'distribution:read'
  | 'distribution:write'
  | 'distribution:manage'
  | 'service:read'
  | 'service:write'
  | 'service:manage'
  | 'support:read'
  | 'support:write'
  | 'support:manage'
  | 'inventory:read'
  | 'reports:read'
  | 'reports:write'
  | 'equipment:read'
  | 'equipment:write'
  | 'equipment:delete'
  | 'equipment:manage'
  | 'distributor:dashboard:read'
  | 'distributor:inventory:read'
  | 'distributor:sales:read'
  | 'distributor:sales:write'
  | 'distributor:customers:read'
  | 'distributor:customers:write'

export interface RoleDefinition {
  name: UserRole
  permissions: Permission[]
  description: string
} 