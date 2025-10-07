// Simple permission utilities
import { useSession } from 'next-auth/react';

/**
 * Check if user has a specific permission
 */
export function hasPermission(userPermissions: string[], requiredPermission: string): boolean {
  return userPermissions.includes(requiredPermission);
}

/**
 * Check if user has any of the specified permissions
 */
export function hasAnyPermission(userPermissions: string[], requiredPermissions: string[]): boolean {
  return requiredPermissions.some(permission => userPermissions.includes(permission));
}

/**
 * Check if user has all of the specified permissions
 */
export function hasAllPermissions(userPermissions: string[], requiredPermissions: string[]): boolean {
  return requiredPermissions.every(permission => userPermissions.includes(permission));
}

/**
 * Check if user has a specific role
 */
export function hasRole(userRoles: string[], requiredRole: string): boolean {
  return userRoles.includes(requiredRole);
}

/**
 * Check if user has any of the specified roles
 */
export function hasAnyRole(userRoles: string[], requiredRoles: string[]): boolean {
  return requiredRoles.some(role => userRoles.includes(role));
}

/**
 * Hook to check permissions from session
 */
export function usePermissions() {
  const { data: session } = useSession();
  const permissions = session?.user?.permissions || [];

  return {
    permissions,
    hasPermission: (permission: string) => hasPermission(permissions, permission),
    hasAnyPermission: (permissions: string[]) => hasAnyPermission(permissions, permissions),
    hasAllPermissions: (permissions: string[]) => hasAllPermissions(permissions, permissions),
    // Role checking (if roles are available in session)
    hasRole: (role: string) => hasRole(session?.user?.roles || [], role),
    hasAnyRole: (roles: string[]) => hasAnyRole(session?.user?.roles || [], roles),
    // Unit permissions
    canViewUnits: () => hasPermission(permissions, 'org_unit.unit.view'),
    canCreateUnits: () => hasPermission(permissions, 'org_unit.unit.create'),
    canUpdateUnits: () => hasPermission(permissions, 'org_unit.unit.update'),
    canDeleteUnits: () => hasPermission(permissions, 'org_unit.unit.delete'),
    
    // Assignment permissions
    canViewAssignments: () => hasPermission(permissions, 'org_unit.assignment.view'),
    canCreateAssignments: () => hasPermission(permissions, 'org_unit.assignment.create'),
    canUpdateAssignments: () => hasPermission(permissions, 'org_unit.assignment.update'),
    canDeleteAssignments: () => hasPermission(permissions, 'org_unit.assignment.delete'),
    
    // Relation permissions
    canViewRelations: () => hasPermission(permissions, 'org_unit.relation.view'),
    canCreateRelations: () => hasPermission(permissions, 'org_unit.relation.create'),
    canUpdateRelations: () => hasPermission(permissions, 'org_unit.relation.update'),
    canDeleteRelations: () => hasPermission(permissions, 'org_unit.relation.delete'),
    
    // Type permissions
    canViewTypes: () => hasPermission(permissions, 'org_unit.type.view'),
    canCreateTypes: () => hasPermission(permissions, 'org_unit.type.create'),
    canUpdateTypes: () => hasPermission(permissions, 'org_unit.type.update'),
    canDeleteTypes: () => hasPermission(permissions, 'org_unit.type.delete'),
    
    // Status permissions
    canViewStatuses: () => hasPermission(permissions, 'org_unit.status.view'),
    canCreateStatuses: () => hasPermission(permissions, 'org_unit.status.create'),
    canUpdateStatuses: () => hasPermission(permissions, 'org_unit.status.update'),
    canDeleteStatuses: () => hasPermission(permissions, 'org_unit.status.delete'),
    
    // Role permissions
    canViewRoles: () => hasPermission(permissions, 'org_unit.role.view'),
    canCreateRoles: () => hasPermission(permissions, 'org_unit.role.create'),
    canUpdateRoles: () => hasPermission(permissions, 'org_unit.role.update'),
    canDeleteRoles: () => hasPermission(permissions, 'org_unit.role.delete'),
    
    // Request permissions
    canViewRequests: () => hasPermission(permissions, 'org_unit.request.view'),
    canCreateRequests: () => hasPermission(permissions, 'org_unit.request.create'),
    canUpdateRequests: () => hasPermission(permissions, 'org_unit.request.update'),
    canDeleteRequests: () => hasPermission(permissions, 'org_unit.request.delete'),
    
    // Report permissions
    canViewReports: () => hasPermission(permissions, 'org_unit.report.view'),
    
    // Legacy permissions (for backward compatibility)
    canReadOrgUnits: () => hasPermission(permissions, 'org_unit.unit.view'),
    canCreateOrgUnits: () => hasPermission(permissions, 'org_unit.unit.create'),
    canUpdateOrgUnits: () => hasPermission(permissions, 'org_unit.unit.update'),
    canDeleteOrgUnits: () => hasPermission(permissions, 'org_unit.unit.delete'),
    canAdminOrgUnits: () => hasPermission(permissions, 'org_unit.type.admin'),
    isAdmin: () => hasPermission(permissions, 'admin'),
  };
}