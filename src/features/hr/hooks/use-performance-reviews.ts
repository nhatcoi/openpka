import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { API_ROUTES } from '@/constants/routes';

export function usePerformanceReviews(employeeId?: string) {
  return useQuery({
    queryKey: ['hr', 'performance-reviews', employeeId],
    queryFn: async () => {
      const url = employeeId
        ? `${API_ROUTES.HR.PERFORMANCE_REVIEWS}?employee_id=${employeeId}`
        : API_ROUTES.HR.PERFORMANCE_REVIEWS;
      const response = await fetch(url, { credentials: 'include' });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to fetch performance reviews');
      }
      return result.data || [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreatePerformanceReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: any) => {
      const response = await fetch(API_ROUTES.HR.PERFORMANCE_REVIEWS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to create performance review');
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr', 'performance-reviews'] });
    },
  });
}

export function useUpdatePerformanceReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await fetch(API_ROUTES.HR.PERFORMANCE_REVIEWS_BY_ID(id), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to update performance review');
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr', 'performance-reviews'] });
    },
  });
}

export function useDeletePerformanceReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(API_ROUTES.HR.PERFORMANCE_REVIEWS_BY_ID(id), {
        method: 'DELETE',
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to delete performance review');
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr', 'performance-reviews'] });
    },
  });
}
