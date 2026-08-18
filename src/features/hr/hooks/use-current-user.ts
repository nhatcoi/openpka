import { useQuery } from '@tanstack/react-query';

export function useCurrentUser() {
  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const response = await fetch('/api/me');
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to fetch user data');
      }
      return result.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}
