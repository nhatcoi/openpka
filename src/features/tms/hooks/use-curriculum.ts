import { useQuery } from '@tanstack/react-query';

export function useCurriculum(limit = 100) {
  return useQuery({
    queryKey: ['tms', 'curriculum', limit],
    queryFn: async () => {
      const response = await fetch(`/api/tms/curriculum?limit=${limit}`);
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to fetch curriculum list');
      }
      return result.data || [];
    },
    staleTime: 5 * 60 * 1000,
  });
}
