import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Training, EmployeeTraining } from '../types';
import { API_ROUTES } from '@/constants/routes';

export function useTrainings() {
  return useQuery<Training[]>({
    queryKey: ['hr', 'trainings'],
    queryFn: async () => {
      const response = await fetch(API_ROUTES.HR.TRAININGS);
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to fetch trainings');
      }
      return result.data || [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateTraining() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: Omit<Training, 'id'>) => {
      const response = await fetch(API_ROUTES.HR.TRAININGS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to create training');
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr', 'trainings'] });
    },
  });
}

export function useUpdateTraining() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Training> }) => {
      const response = await fetch(API_ROUTES.HR.TRAININGS_BY_ID(id), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to update training');
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr', 'trainings'] });
    },
  });
}

export function useDeleteTraining() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(API_ROUTES.HR.TRAININGS_BY_ID(id), {
        method: 'DELETE',
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to delete training');
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr', 'trainings'] });
    },
  });
}

export function useEmployeeTrainings() {
  return useQuery<EmployeeTraining[]>({
    queryKey: ['hr', 'employee-trainings'],
    queryFn: async () => {
      const response = await fetch(API_ROUTES.HR.EMPLOYEE_TRAININGS);
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to fetch employee trainings');
      }
      return result.data || [];
    },
    staleTime: 5 * 60 * 1000,
  });
}
