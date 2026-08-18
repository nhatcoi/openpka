import { useQuery } from '@tanstack/react-query';

export function usePrograms(options: { status?: string; limit?: number } = {}) {
  const { status = 'PUBLISHED', limit = 200 } = options;

  return useQuery({
    queryKey: ['tms', 'programs', status, limit],
    queryFn: async () => {
      const response = await fetch(`/api/tms/programs/list?status=${status}&limit=${limit}`);
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to fetch programs');
      }
      return result.data || [];
    },
    staleTime: 5 * 60 * 1000,
  });
}
