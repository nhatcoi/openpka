// Fetch wrapper for frontend

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public statusText: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function fetcher<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new ApiError(
      `HTTP Error: ${response.status}`,
      response.status,
      response.statusText
    );
  }

  const result = await response.json();
  
  // Handle API route response format: { success: boolean, data: T, error?: string }
  if (result.success === false) {
    throw new ApiError(
      result.error || 'API request failed',
      response.status,
      response.statusText
    );
  }
  
  return result.data || result;
}

// React Query keys factory
export const queryKeys = {
  all: ['api'] as const,
  org: {
    all: () => [...queryKeys.all, 'org'] as const,
    units: (params?: { [key: string]: unknown }) => [...queryKeys.org.all(), 'units', params] as const,
    unit: (id: string) => [...queryKeys.org.all(), 'units', id] as const,
    history: (params?: { [key: string]: unknown }) => [...queryKeys.org.all(), 'history', params] as const,
    kpi: {
      all: () => [...queryKeys.org.all(), 'kpi'] as const,
      headcount: () => [...queryKeys.org.kpi.all(), 'headcount'] as const,
    },
  },
  hr: {
    all: () => [...queryKeys.all, 'hr'] as const,
    employees: () => [...queryKeys.hr.all(), 'employees'] as const,
    employee: (id: string) => [...queryKeys.hr.employees(), id] as const,
  },
} as const;