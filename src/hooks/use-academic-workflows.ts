'use client';

import { useState, useEffect } from 'react';

interface WorkflowStep {
  step_order: number;
  step_name: string;
  approver_role: string;
  approver_org_level: string;
  timeout_days: number;
}

interface ApprovalRecord {
  id: bigint;
  action: string;
  comments?: string;
  approved_at?: Date;
  approver: {
    id: bigint;
    name: string;
    email: string;
  };
}

interface WorkflowInstance {
  id: bigint;
  status: string;
  current_step: number;
  initiated_at: Date;
  completed_at?: Date;
  workflow: {
    workflow_name: string;
    steps: WorkflowStep[];
  };
  approval_records: ApprovalRecord[];
}

interface AcademicWorkflowDashboard {
  total: number;
  pending: number;
  inProgress: number;
  approved: number;
  rejected: number;
  completed: number;
  overdue: number;
  byEntity: {
    COURSE: number;
    PROGRAM: number;
    MAJOR: number;
  };
}

export const useAcademicWorkflows = (entityType?: 'COURSE' | 'PROGRAM' | 'MAJOR', status?: string) => {
  const [workflows, setWorkflows] = useState<WorkflowInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWorkflows = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (entityType) params.append('entityType', entityType);
        if (status) params.append('status', status);

        const response = await fetch(`/api/academic/workflows?${params.toString()}`);
        if (!response.ok) {
          throw new Error('Failed to fetch workflows');
        }

        const data = await response.json();
        setWorkflows(data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchWorkflows();
  }, [entityType, status]);

  return { workflows, loading, error, refetch: () => {
    setLoading(true);
    // Re-fetch logic here
  }};
};

export const useAcademicWorkflowDashboard = () => {
  const [dashboard, setDashboard] = useState<AcademicWorkflowDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/academic/workflows/dashboard');
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard');
        }

        const data = await response.json();
        setDashboard(data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  return { dashboard, loading, error };
};

export const useWorkflowAction = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processAction = async (
    workflowInstanceId: bigint,
    action: string,
    comments?: string
  ) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/academic/workflows/${workflowInstanceId}/actions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          comments,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to process workflow action');
      }

      const data = await response.json();
      return data.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { processAction, loading, error };
};
