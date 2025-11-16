// API Permission helpers - utilities for backend permission checking
import { Session } from 'next-auth';
import { NextResponse } from 'next/server';

/**
 * Check if session has required permission
 */
export function hasPermission(session: Session | null, requiredPermission: string): boolean {
  if (!requiredPermission) return true;
  if (!session?.user?.permissions) return false;
  const permissions = session.user.permissions as string[];
  return permissions.includes(requiredPermission);
}

/**
 * Check if session has any of the required permissions
 */
export function hasAnyPermission(session: Session | null, requiredPermissions: string[]): boolean {
  if (!requiredPermissions || requiredPermissions.length === 0) return true;
  if (!session?.user?.permissions) return false;
  const permissions = session.user.permissions as string[];
  return requiredPermissions.some(permission => permissions.includes(permission));
}

/**
 * Check if session has all required permissions
 */
export function hasAllPermissions(session: Session | null, requiredPermissions: string[]): boolean {
  if (!requiredPermissions || requiredPermissions.length === 0) return true;
  if (!session?.user?.permissions) return false;
  const permissions = session.user.permissions as string[];
  return requiredPermissions.every(permission => permissions.includes(permission));
}

/**
 * Require permission - throws error if not authorized
 */
export function requirePermission(session: Session | null, requiredPermission: string): void {
  if (!hasPermission(session, requiredPermission)) {
    throw new Error(`Forbidden: Required permission '${requiredPermission}' not found`);
  }
}

/**
 * Require any permission - throws error if none found
 */
export function requireAnyPermission(session: Session | null, requiredPermissions: string[]): void {
  if (!hasAnyPermission(session, requiredPermissions)) {
    throw new Error(`Forbidden: None of the required permissions found: ${requiredPermissions.join(', ')}`);
  }
}

/**
 * Require all permissions - throws error if any missing
 */
export function requireAllPermissions(session: Session | null, requiredPermissions: string[]): void {
  if (!hasAllPermissions(session, requiredPermissions)) {
    throw new Error(`Forbidden: Not all required permissions found: ${requiredPermissions.join(', ')}`);
  }
}

/**
 * Create forbidden response
 */
export function createForbiddenResponse(message: string = 'Forbidden: Insufficient permissions'): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: message,
    },
    { status: 403 }
  );
}
