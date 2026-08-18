import { useQuery } from '@tanstack/react-query';
import { API_ROUTES } from '@/constants/routes';
import { buildUrl } from '@/lib/api/api-handler';

export interface OrgUnitType {
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

export interface OrgUnitStatus {
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
  loading: boolean;
  isLoading: boolean;
  error: string | null;
  refreshTypes: () => Promise<unknown>;
  refreshStatuses: () => Promise<unknown>;
  refreshAll: () => Promise<void>;
}

async function fetchTypesApi(): Promise<OrgUnitType[]> {
  const response = await fetch(buildUrl(API_ROUTES.ORG.TYPES, { include_inactive: true }));
  const result = await response.json();
  if (!response.ok || !result.success) throw new Error(result.error || 'Failed to fetch types');
  return result.data || [];
}

async function fetchStatusesApi(): Promise<OrgUnitStatus[]> {
  const response = await fetch(buildUrl(API_ROUTES.ORG.STATUSES, { include_inactive: true }));
  const result = await response.json();
  if (!response.ok || !result.success) throw new Error(result.error || 'Failed to fetch statuses');
  return result.data || [];
}

export const useOrgTypesStatuses = (): UseOrgTypesStatusesReturn => {
  const typesQuery = useQuery({
    queryKey: ['org', 'types'],
    queryFn: fetchTypesApi,
    staleTime: 5 * 60 * 1000,
  });

  const statusesQuery = useQuery({
    queryKey: ['org', 'statuses'],
    queryFn: fetchStatusesApi,
    staleTime: 5 * 60 * 1000,
  });

  return {
    types: typesQuery.data || [],
    statuses: statusesQuery.data || [],
    typesLoading: typesQuery.isLoading,
    statusesLoading: statusesQuery.isLoading,
    loading: typesQuery.isLoading || statusesQuery.isLoading,
    isLoading: typesQuery.isLoading || statusesQuery.isLoading,
    error: (typesQuery.error as Error)?.message || (statusesQuery.error as Error)?.message || null,
    refreshTypes: typesQuery.refetch,
    refreshStatuses: statusesQuery.refetch,
    refreshAll: async () => {
      await Promise.all([typesQuery.refetch(), statusesQuery.refetch()]);
    },
  };
};
