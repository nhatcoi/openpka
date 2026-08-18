import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useEvaluation(evaluationId: string, token?: string) {
  return useQuery({
    queryKey: ['hr', 'evaluation', evaluationId, token],
    queryFn: async () => {
      const url = new URL(`/api/hr/evaluation/${evaluationId}`, typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
      if (token) url.searchParams.set('token', token);

      const response = await fetch(url.toString());
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to fetch evaluation');
      }
      return result.data;
    },
    enabled: !!evaluationId,
  });
}

export function useSubmitEvaluation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { evaluationId: string; score: number; comments: string }) => {
      const response = await fetch('/api/hr/evaluation-submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to submit evaluation');
      }
      return result.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['hr', 'evaluation', variables.evaluationId] });
    },
  });
}

export function useMyEvaluations(employeeId?: string) {
  return useQuery({
    queryKey: ['hr', 'evaluations', 'my', employeeId],
    queryFn: async () => {
      if (!employeeId) return [];
      const response = await fetch(`/api/hr/performance-reviews?employeeId=${employeeId}`);
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to fetch evaluations');
      }
      return result.data || [];
    },
    enabled: !!employeeId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useEvaluationPeriods() {
  return useQuery({
    queryKey: ['hr', 'evaluation-periods'],
    queryFn: async () => {
      const response = await fetch('/api/hr/evaluation-periods', { credentials: 'include' });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to fetch evaluation periods');
      }
      return result.data || [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateEvaluationPeriod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { name: string; start_date: string; end_date: string; description?: string }) => {
      const response = await fetch('/api/hr/evaluation-periods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to create evaluation period');
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr', 'evaluation-periods'] });
    },
  });
}

