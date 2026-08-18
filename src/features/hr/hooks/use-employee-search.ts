import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

export interface EmployeeSearchResult {
  id: string;
  user_id: string;
  employee_no: string;
  User: {
    id: string;
    full_name: string;
    email: string;
    phone?: string;
  } | null;
  OrgAssignment: Array<{
    id: string;
    employee_id: string;
    org_unit_id: string;
    job_position_id?: string;
    OrgUnit: {
      id: string;
      name: string;
      code: string;
    } | null;
    JobPosition: {
      id: string;
      title: string;
      code: string;
    } | null;
  }>;
}

interface UseEmployeeSearchResult {
  employees: EmployeeSearchResult[];
  loading: boolean;
  isLoading: boolean;
  error: string | null;
  searchEmployees: (query: string) => void;
  clearSearch: () => void;
  loadAllEmployees: () => void;
}

async function searchEmployeesApi(query: string, limit = 20): Promise<EmployeeSearchResult[]> {
  const response = await fetch(`/api/hr/employees/search?q=${encodeURIComponent(query)}&limit=${limit}`);
  const result = await response.json();
  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Failed to search employees');
  }
  return result.data || [];
}

export const useEmployeeSearch = (): UseEmployeeSearchResult => {
  const [searchQuery, setSearchQuery] = useState('');

  const query = useQuery({
    queryKey: ['employees', 'search', searchQuery],
    queryFn: () => searchEmployeesApi(searchQuery, searchQuery ? 20 : 10),
    staleTime: 2 * 60 * 1000,
  });

  return {
    employees: query.data || [],
    loading: query.isLoading,
    isLoading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
    searchEmployees: (q: string) => setSearchQuery(q.trim()),
    clearSearch: () => setSearchQuery(''),
    loadAllEmployees: () => setSearchQuery(''),
  };
};
