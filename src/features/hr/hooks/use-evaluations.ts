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
