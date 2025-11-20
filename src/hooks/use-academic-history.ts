import { useState, useEffect } from 'react';

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
}

export interface AcademicHistorySingleResponse {
  success: boolean;
  data: AcademicHistoryEntry;
}

export function useAcademicHistory() {
  const [data, setData] = useState<AcademicHistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<AcademicHistoryPagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  const fetchHistory = async (
    filters: AcademicHistoryFilters = {},
    page: number = 1,
    limit: number = 20
  ) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...Object.entries(filters).reduce((acc, [key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            acc[key] = value.toString();
          }
          return acc;
        }, {} as Record<string, string>),
      });

      const response = await fetch(`/api/academic/history?${params}`);
      const result: AcademicHistoryResponse = await response.json();

      if (result.success) {
        setData(result.data);
        setPagination(result.pagination);
      } else {
        setError('Failed to fetch academic history');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const createHistoryEntry = async (entry: Omit<AcademicHistoryEntry, 'id' | 'created_at'>) => {
    try {
      const response = await fetch('/api/academic/history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(entry),
      });

      const result: AcademicHistorySingleResponse = await response.json();

      if (result.success) {
        // Refresh the data
        await fetchHistory();
        return result.data;
      } else {
        throw new Error(result.error || 'Failed to create history entry');
      }
    } catch (err) {
      throw err;
    }
  };

  const updateHistoryEntry = async (id: string, entry: Partial<AcademicHistoryEntry>) => {
    try {
      const response = await fetch(`/api/academic/history/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(entry),
      });

      const result: AcademicHistorySingleResponse = await response.json();

      if (result.success) {
        // Refresh the data
        await fetchHistory();
        return result.data;
      } else {
        throw new Error(result.error || 'Failed to update history entry');
      }
    } catch (err) {
      throw err;
    }
  };

  const deleteHistoryEntry = async (id: string) => {
    try {
      const response = await fetch(`/api/academic/history/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        // Refresh the data
        await fetchHistory();
        return true;
      } else {
        throw new Error(result.error || 'Failed to delete history entry');
      }
    } catch (err) {
      throw err;
    }
  };

  const getHistoryEntry = async (id: string): Promise<AcademicHistoryEntry | null> => {
    try {
      const response = await fetch(`/api/academic/history/${id}`);
      const result: AcademicHistorySingleResponse = await response.json();

      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error || 'Failed to fetch history entry');
      }
    } catch (err) {
      console.error('Error fetching history entry:', err);
      return null;
    }
  };

  return {
    data,
    loading,
    error,
    pagination,
    fetchHistory,
    createHistoryEntry,
    updateHistoryEntry,
    deleteHistoryEntry,
    getHistoryEntry,
  };
}
