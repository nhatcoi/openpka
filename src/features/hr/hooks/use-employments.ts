import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Employment } from '../types';
import { API_ROUTES } from '@/constants/routes';

export function useEmployments() {
  return useQuery<Employment[]>({
    queryKey: ['hr', 'employments'],
    queryFn: async () => {
      const response = await fetch(API_ROUTES.HR.EMPLOYMENTS);
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to fetch employments');
      }
      return result.data || [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateEmployment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: Omit<Employment, 'id'>) => {
      const response = await fetch(API_ROUTES.HR.EMPLOYMENTS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to create employment');
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr', 'employments'] });
    },
  });
}

export function useUpdateEmployment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Employment> }) => {
      const response = await fetch(API_ROUTES.HR.EMPLOYMENTS_BY_ID(id), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to update employment');
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr', 'employments'] });
    },
  });
}

export function useDeleteEmployment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(API_ROUTES.HR.EMPLOYMENTS_BY_ID(id), {
        method: 'DELETE',
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to delete employment');
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr', 'employments'] });
    },
  });
}
