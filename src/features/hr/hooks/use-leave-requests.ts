import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LeaveRequest } from '../types';

export function useLeaveRequests(params?: Record<string, string>) {
  return useQuery<LeaveRequest[]>({
    queryKey: ['hr', 'leave-requests', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams(params || {});
      const url = searchParams.toString() ? `/api/hr/leave-requests?${searchParams}` : '/api/hr/leave-requests';
      const response = await fetch(url, { credentials: 'include' });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to fetch leave requests');
      }
      return result.data || [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateLeaveRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: any) => {
      const response = await fetch('/api/hr/leave-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to create leave request');
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr', 'leave-requests'] });
    },
  });
}

export function useApproveLeaveRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      status,
      comments,
      action,
      comment
    }: {
      id: string;
      status?: string;
      comments?: string;
      action?: string;
      comment?: string;
    }) => {
      const response = await fetch(`/api/hr/leave-requests/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: status || action,
          comments: comments || comment,
          action: action || status,
          comment: comment || comments
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to update leave request status');
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr', 'leave-requests'] });
    },
  });
}

export function useDeleteLeaveRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/hr/leave-requests/${id}`, {
        method: 'DELETE',
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to delete leave request');
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr', 'leave-requests'] });
    },
  });
}
