import { useQuery } from '@tanstack/react-query';

export function useOrgReports(type: 'overview' | 'units-without-head' | 'units-without-staff' = 'overview') {
  return useQuery({
    queryKey: ['org', 'reports', type],
    queryFn: async () => {
      const response = await fetch(`/api/org/reports?type=${type}`);
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to fetch org reports');
      }
      return result.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}
