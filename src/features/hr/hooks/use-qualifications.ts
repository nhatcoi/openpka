import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Qualification, EmployeeQualification } from '../types';
import { API_ROUTES } from '@/constants/routes';

export function useQualifications() {
  return useQuery<Qualification[]>({
    queryKey: ['hr', 'qualifications'],
    queryFn: async () => {
      const response = await fetch(API_ROUTES.HR.QUALIFICATIONS);
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to fetch qualifications');
      }
      return result.data || [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateQualification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: Omit<Qualification, 'id'>) => {
      const response = await fetch(API_ROUTES.HR.QUALIFICATIONS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to create qualification');
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr', 'qualifications'] });
    },
  });
}

export function useUpdateQualification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Qualification> }) => {
      const response = await fetch(API_ROUTES.HR.QUALIFICATIONS_BY_ID(id), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to update qualification');
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr', 'qualifications'] });
    },
  });
}

export function useDeleteQualification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(API_ROUTES.HR.QUALIFICATIONS_BY_ID(id), {
        method: 'DELETE',
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to delete qualification');
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr', 'qualifications'] });
    },
  });
}

export function useEmployeeQualifications() {
  return useQuery<EmployeeQualification[]>({
    queryKey: ['hr', 'employee-qualifications'],
    queryFn: async () => {
      const response = await fetch(API_ROUTES.HR.EMPLOYEE_QUALIFICATIONS);
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to fetch employee qualifications');
      }
      return result.data || [];
    },
    staleTime: 5 * 60 * 1000,
  });
}
