import { useQuery } from '@tanstack/react-query';

export function useHrMe() {
  return useQuery({
    queryKey: ['hr', 'me'],
    queryFn: async () => {
      const response = await fetch('/api/hr/me');
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to fetch HR profile');
      }
      return result.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}
