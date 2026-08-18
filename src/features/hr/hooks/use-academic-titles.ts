import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AcademicTitle, EmployeeAcademicTitle } from '../types';
import { API_ROUTES } from '@/constants/routes';

export function useAcademicTitles() {
  return useQuery<AcademicTitle[]>({
    queryKey: ['hr', 'academic-titles'],
    queryFn: async () => {
      const response = await fetch(API_ROUTES.HR.ACADEMIC_TITLES);
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to fetch academic titles');
      }
      return result.data || [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateAcademicTitle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: Omit<AcademicTitle, 'id'>) => {
      const response = await fetch(API_ROUTES.HR.ACADEMIC_TITLES, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to create academic title');
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr', 'academic-titles'] });
    },
  });
}

export function useUpdateAcademicTitle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<AcademicTitle> }) => {
      const response = await fetch(API_ROUTES.HR.ACADEMIC_TITLES_BY_ID(id), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to update academic title');
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr', 'academic-titles'] });
    },
  });
}

export function useDeleteAcademicTitle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(API_ROUTES.HR.ACADEMIC_TITLES_BY_ID(id), {
        method: 'DELETE',
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to delete academic title');
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr', 'academic-titles'] });
    },
  });
}

export function useEmployeeAcademicTitles() {
  return useQuery<EmployeeAcademicTitle[]>({
    queryKey: ['hr', 'employee-academic-titles'],
    queryFn: async () => {
      const response = await fetch(API_ROUTES.HR.EMPLOYEE_ACADEMIC_TITLES);
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to fetch employee academic titles');
      }
      return result.data || [];
    },
    staleTime: 5 * 60 * 1000,
  });
}
