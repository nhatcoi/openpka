// Simple permission utilities - chỉ giữ lại các hàm cơ bản
import { useSession } from 'next-auth/react';
import { Session } from 'next-auth';

/**
 * Check if user has a specific permission
 */
export function hasPermission(userPermissions: string[], requiredPermission: string): boolean {
  if (!requiredPermission) return true;
  if (!userPermissions || userPermissions.length === 0) return false;
  return userPermissions.includes(requiredPermission);
}

/**
 * Check if user has any of the specified permissions
 */
export function hasAnyPermission(userPermissions: string[], requiredPermissions: string[]): boolean {
  if (!requiredPermissions || requiredPermissions.length === 0) return true;
  if (!userPermissions || userPermissions.length === 0) return false;
  return requiredPermissions.some(permission => userPermissions.includes(permission));
}

/**
 * Check if user has all of the specified permissions
 */
export function hasAllPermissions(userPermissions: string[], requiredPermissions: string[]): boolean {
  if (!requiredPermissions || requiredPermissions.length === 0) return true;
  if (!userPermissions || userPermissions.length === 0) return false;
  return requiredPermissions.every(permission => userPermissions.includes(permission));
}

/**
 * Hook to check permissions from session - đơn giản hóa
 */
export function usePermissions() {
  const { data: session } = useSession();
  const permissions = session?.user?.permissions || [];

  return {
    permissions,
    hasPermission: (permission: string) => hasPermission(permissions, permission),
    hasAnyPermission: (permissionsList: string[]) => hasAnyPermission(permissions, permissionsList),
    hasAllPermissions: (permissionsList: string[]) => hasAllPermissions(permissions, permissionsList),
  };
}

/**
 * Check permission for API routes - helper function
 */
export function checkPermission(session: Session | null, requiredPermission: string): boolean {
  if (!requiredPermission) return true;
  if (!session?.user?.permissions) return false;
  return hasPermission(session.user.permissions, requiredPermission);
}

/**
 * Require permission for API routes - throws error if not authorized
 */
export function requirePermission(session: Session | null, requiredPermission: string): void {
  if (!checkPermission(session, requiredPermission)) {
    throw new Error(`Forbidden: Required permission '${requiredPermission}' not found`);
  }
}
