import { useQuery } from '@tanstack/react-query';
import { API_ROUTES } from '@/constants/routes';

export function useHrStats() {
  return useQuery({
    queryKey: ['hr', 'stats'],
    queryFn: async () => {
      const response = await fetch(API_ROUTES.ORG.STATS);
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to fetch HR stats');
      }
      return result.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}
