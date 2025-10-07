'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export interface UserOrgUnit {
  id: string;
  name: string;
  parent_id: string | null;
  type: string;
  status: string;
}

export function useHierarchicalPermissions() {
  const { data: session } = useSession();
  const [accessibleUnits, setAccessibleUnits] = useState<UserOrgUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAccessibleUnits() {
      if (!session?.user?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetch('/api/org/user-units');
        
        if (!response.ok) {
          throw new Error('Failed to fetch accessible units');
        }

        const data = await response.json();
        setAccessibleUnits(data.units || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchAccessibleUnits();
  }, [session?.user?.id]);

  const canAccessUnit = (unitId: string): boolean => {
    return accessibleUnits.some(unit => unit.id === unitId);
  };

  const getUserUnit = (): UserOrgUnit | null => {
    // Tìm đơn vị gốc (không có parent_id hoặc parent_id không trong danh sách accessible)
    const userUnit = accessibleUnits.find(unit => 
      !unit.parent_id || !accessibleUnits.some(u => u.id === unit.parent_id)
    );
    return userUnit || null;
  };

  const getChildUnits = (parentId: string): UserOrgUnit[] => {
    return accessibleUnits.filter(unit => unit.parent_id === parentId);
  };

  const isUserUnit = (unitId: string): boolean => {
    const userUnit = getUserUnit();
    return userUnit?.id === unitId;
  };

  const isChildUnit = (unitId: string): boolean => {
    const userUnit = getUserUnit();
    if (!userUnit) return false;
    
    // Kiểm tra recursive
    const checkIsChild = (parentId: string, targetId: string): boolean => {
      const directChildren = getChildUnits(parentId);
      for (const child of directChildren) {
        if (child.id === targetId) return true;
        if (checkIsChild(child.id, targetId)) return true;
      }
      return false;
    };
    
    return checkIsChild(userUnit.id, unitId);
  };

  return {
    accessibleUnits,
    loading,
    error,
    canAccessUnit,
    getUserUnit,
    getChildUnits,
    isUserUnit,
    isChildUnit,
    // Convenience methods
    canManageUnit: (unitId: string) => canAccessUnit(unitId),
    canViewUnit: (unitId: string) => canAccessUnit(unitId),
    canCreateChildUnit: (parentId: string) => canAccessUnit(parentId),
  };
}
