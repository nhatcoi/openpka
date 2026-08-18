import { useQuery } from '@tanstack/react-query';

export function useJobPositions() {
  return useQuery({
    queryKey: ['hr', 'job-positions'],
    queryFn: async () => {
      const response = await fetch('/api/hr/job-positions');
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to fetch job positions');
      }
      return result.data || [];
    },
    staleTime: 10 * 60 * 1000,
  });
}
