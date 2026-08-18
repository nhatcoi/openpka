import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { API_ROUTES } from '@/constants/routes';

export function useAssignments(employeeId?: string) {
  return useQuery({
    queryKey: ['hr', 'assignments', employeeId],
    queryFn: async () => {
      const url = employeeId ? `${API_ROUTES.HR.ASSIGNMENTS}?employee_id=${employeeId}` : API_ROUTES.HR.ASSIGNMENTS;
      const response = await fetch(url, { credentials: 'include' });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to fetch assignments');
      }
      return result.data || [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useAssignment(id?: string) {
  return useQuery({
    queryKey: ['hr', 'assignment', id],
    queryFn: async () => {
      if (!id) return null;
      const response = await fetch(API_ROUTES.HR.ASSIGNMENTS_BY_ID(id), { credentials: 'include' });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to fetch assignment');
      }
      return result.data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: any) => {
      const response = await fetch(API_ROUTES.HR.ASSIGNMENTS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to create assignment');
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr', 'assignments'] });
    },
  });
}

export function useUpdateAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await fetch(API_ROUTES.HR.ASSIGNMENTS_BY_ID(id), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to update assignment');
      }
      return result.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['hr', 'assignments'] });
      queryClient.invalidateQueries({ queryKey: ['hr', 'assignment', variables.id] });
    },
  });
}

export function useDeleteAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(API_ROUTES.HR.ASSIGNMENTS_BY_ID(id), {
        method: 'DELETE',
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to delete assignment');
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr', 'assignments'] });
    },
  });
}
