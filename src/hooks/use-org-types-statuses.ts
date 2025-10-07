import { useState, useEffect } from 'react';
import { API_ROUTES } from '@/constants/routes';
import { buildUrl } from '@/lib/api/api-handler';

interface OrgUnitType {
  id: string;
  code: string;
  name: string;
  description?: string;
  color: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

interface OrgUnitStatus {
  id: string;
  code: string;
  name: string;
  description?: string;
  color: string;
  is_active: boolean;
  workflow_step: number;
  created_at: string;
  updated_at: string;
}

interface UseOrgTypesStatusesReturn {
  types: OrgUnitType[];
  statuses: OrgUnitStatus[];
  typesLoading: boolean;
  statusesLoading: boolean;
  error: string | null;
  refreshTypes: () => Promise<void>;
  refreshStatuses: () => Promise<void>;
  refreshAll: () => Promise<void>;
}

export const useOrgTypesStatuses = (): UseOrgTypesStatusesReturn => {
  const [types, setTypes] = useState<OrgUnitType[]>([]);
  const [statuses, setStatuses] = useState<OrgUnitStatus[]>([]);
  const [typesLoading, setTypesLoading] = useState(false);
  const [statusesLoading, setStatusesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTypes = async () => {
    try {
      setTypesLoading(true);
      setError(null);
      
      const response = await fetch(buildUrl(API_ROUTES.ORG.TYPES, { include_inactive: true }));
      const result = await response.json();
      
      if (result.success) {
        setTypes(result.data || []);
      } else {
        setError(result.error || 'Failed to fetch types');
      }
    } catch (err) {
      setError('Failed to fetch types');
      console.error('Error fetching types:', err);
    } finally {
      setTypesLoading(false);
    }
  };

  const fetchStatuses = async () => {
    try {
      setStatusesLoading(true);
      setError(null);
      
      const response = await fetch(buildUrl(API_ROUTES.ORG.STATUSES, { include_inactive: true }));
      const result = await response.json();
      
      if (result.success) {
        setStatuses(result.data);
      } else {
        setError(result.error || 'Failed to fetch statuses');
      }
    } catch (err) {
      setError('Failed to fetch statuses');
      console.error('Error fetching statuses:', err);
    } finally {
      setStatusesLoading(false);
    }
  };

  const refreshTypes = async () => {
    await fetchTypes();
  };

  const refreshStatuses = async () => {
    await fetchStatuses();
  };

  const refreshAll = async () => {
    await Promise.all([fetchTypes(), fetchStatuses()]);
  };

  // Initial load
  useEffect(() => {
    refreshAll();
  }, []);

  return {
    types,
    statuses,
    typesLoading,
    statusesLoading,
    error,
    refreshTypes,
    refreshStatuses,
    refreshAll,
  };
};
