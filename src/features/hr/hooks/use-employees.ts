import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { EmployeeSummary, EmployeeFilterParams } from '../types';
import { API_ROUTES } from '@/constants/routes';

export function useEmployees(filters?: EmployeeFilterParams) {
  return useQuery<EmployeeSummary[]>({
    queryKey: ['hr', 'employees', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.search) params.set('search', filters.search);
      if (filters?.status) params.set('status', filters.status);
      if (filters?.employment_type) params.set('employment_type', filters.employment_type);
      if (filters?.org_unit_id) params.set('org_unit_id', filters.org_unit_id);
      if (filters?.page) params.set('page', filters.page.toString());
      if (filters?.limit) params.set('limit', filters.limit.toString());

      const url = params.toString() ? `${API_ROUTES.HR.EMPLOYEES}?${params}` : API_ROUTES.HR.EMPLOYEES;
      const response = await fetch(url, { credentials: 'include' });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to fetch employees');
      }
      return result.data || [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useEmployee(id?: string) {
  return useQuery({
    queryKey: ['hr', 'employee', id],
    queryFn: async () => {
      if (!id) return null;
      const response = await fetch(API_ROUTES.HR.EMPLOYEES_BY_ID(id), { credentials: 'include' });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to fetch employee');
      }
      return result.data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: any) => {
      const response = await fetch(API_ROUTES.HR.EMPLOYEES, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to create employee');
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr', 'employees'] });
    },
  });
}

export function useUpdateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await fetch(API_ROUTES.HR.EMPLOYEES_BY_ID(id), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to update employee');
      }
      return result.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['hr', 'employees'] });
      queryClient.invalidateQueries({ queryKey: ['hr', 'employee', variables.id] });
    },
  });
}

export function useDeleteEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(API_ROUTES.HR.EMPLOYEES_BY_ID(id), {
        method: 'DELETE',
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to delete employee');
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr', 'employees'] });
    },
  });
}
