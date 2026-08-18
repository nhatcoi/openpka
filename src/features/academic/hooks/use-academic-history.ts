import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

export interface AcademicHistoryEntry {
  id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  field_name?: string;
  old_value?: string;
  new_value?: string;
  change_summary?: string;
  actor_id?: string;
  actor_name?: string;
  ip_address?: string;
  user_agent?: string;
  request_id?: string;
  metadata?: any;
  created_at: string;
}

export interface AcademicHistoryFilters {
  entity_type?: string;
  entity_id?: string;
  action?: string;
  actor_id?: string;
  start_date?: string;
  end_date?: string;
}

export interface AcademicHistoryPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface AcademicHistoryResponse {
  success: boolean;
  data: AcademicHistoryEntry[];
  pagination: AcademicHistoryPagination;
  error?: string;
  message?: string;
}

async function fetchHistoryApi(
  filters: AcademicHistoryFilters = {},
  page: number = 1,
  limit: number = 20
): Promise<{ data: AcademicHistoryEntry[]; pagination: AcademicHistoryPagination }> {
  const queryParams = new URLSearchParams();
  queryParams.append('page', page.toString());
  queryParams.append('limit', limit.toString());

  if (filters.entity_type) queryParams.append('entity_type', filters.entity_type);
  if (filters.entity_id) queryParams.append('entity_id', filters.entity_id);
  if (filters.action) queryParams.append('action', filters.action);
  if (filters.actor_id) queryParams.append('actor_id', filters.actor_id);
  if (filters.start_date) queryParams.append('start_date', filters.start_date);
  if (filters.end_date) queryParams.append('end_date', filters.end_date);

  const response = await fetch(`/api/academic/history?${queryParams.toString()}`);
  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Failed to fetch academic history');
  }

  return {
    data: result.data || [],
    pagination: result.pagination || { page, limit, total: result.data?.length || 0, totalPages: 1 },
  };
}

export function useAcademicHistory(initialFilters: AcademicHistoryFilters = {}, initialPage = 1, initialLimit = 20) {
  const [filters, setFilters] = useState<AcademicHistoryFilters>(initialFilters);
  const [page, setPage] = useState<number>(initialPage);
  const [limit, setLimit] = useState<number>(initialLimit);

  const query = useQuery({
    queryKey: ['academic-history', filters, page, limit],
    queryFn: () => fetchHistoryApi(filters, page, limit),
    staleTime: 60 * 1000,
  });

  return {
    data: query.data?.data || [],
    loading: query.isLoading,
    isLoading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
    pagination: query.data?.pagination || { page, limit, total: 0, totalPages: 0 },
    fetchHistory: async (newFilters?: AcademicHistoryFilters, newPage?: number, newLimit?: number) => {
      if (newFilters !== undefined) setFilters(newFilters);
      if (newPage !== undefined) setPage(newPage);
      if (newLimit !== undefined) setLimit(newLimit);
      return query.refetch();
    },
    refetch: query.refetch,
  };
}
