'use client';

import { ReactNode } from 'react';
import { usePermissions } from '@/lib/auth/permission-utils';

interface PermissionGuardProps {
  children: ReactNode;
  permission?: string;
  permissions?: string[];
  requireAll?: boolean;
  fallback?: ReactNode;
}

export function PermissionGuard({
  children,
  permission,
  permissions,
  requireAll = false,
  fallback = null,
}: PermissionGuardProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions();

  let hasAccess = false;

  if (permission) {
    hasAccess = hasPermission(permission);
  } else if (permissions && permissions.length > 0) {
    hasAccess = requireAll 
      ? hasAllPermissions(permissions) 
      : hasAnyPermission(permissions);
  } else {
    hasAccess = true; // No permission check
  }

  return hasAccess ? <>{children}</> : <>{fallback}</>;
}

// Convenience components
export function AdminOnly({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <PermissionGuard permission="admin" fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}

export function OrgUnitViewOnly({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <PermissionGuard permission="org_unit.unit.view" fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}

export function OrgUnitAdminOnly({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <PermissionGuard permission="org_unit.type.admin" fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}

export function OrgAssignmentViewOnly({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <PermissionGuard permission="org_unit.assignment.view" fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}

export function OrgReportViewOnly({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <PermissionGuard permission="org_unit.report.view" fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}
