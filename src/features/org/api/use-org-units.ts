import { useQuery } from '@tanstack/react-query';
import { fetcher, queryKeys } from '@/lib/api/fetcher';

export interface Employee {
  id: string;
  name?: string;
  code?: string;
  email?: string;
  phone?: string;
  position?: string;
  status?: string;
}



export interface OrgUnit {
  id: string; // Changed to string due to BigInt serialization
  parent_id: string | null; // Changed to string due to BigInt serialization
  type: string | null;
  code: string;
  name: string;
  created_at: string;
  updated_at: string;
  description: string | null;
  status: string | null;
  effective_from: string | null;
  effective_to: string | null;
  parent?: OrgUnit;
  children?: OrgUnit[];
  employees?: Employee[];
}

export interface OrgUnitsResponse {
  success: boolean;
  data: {
    items: OrgUnit[];
    pagination: {
      page: number;
      size: number;
      total: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  };
}


// Lấy ds đơn vị với pagination và filtering
export function useOrgUnits(params?: {
  page?: number;
  size?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  search?: string;
  status?: string;
  type?: string;
  fromDate?: string;
  toDate?: string;
  include_children?: boolean;
  include_employees?: boolean;
  include_parent?: boolean;
}) {
  return useQuery({
    queryKey: queryKeys.org.units(params),
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      
      if (params?.page) searchParams.set('page', params.page.toString());
      if (params?.size) searchParams.set('size', params.size.toString());
      if (params?.sort) searchParams.set('sort', params.sort);
      if (params?.order) searchParams.set('order', params.order);
      if (params?.search) searchParams.set('search', params.search);
      if (params?.status) searchParams.set('status', params.status);
      if (params?.type) searchParams.set('type', params.type);
      if (params?.fromDate) searchParams.set('fromDate', params.fromDate);
      if (params?.toDate) searchParams.set('toDate', params.toDate);
      if (params?.include_children) searchParams.set('include_children', 'true');
      if (params?.include_employees) searchParams.set('include_employees', 'true');
      if (params?.include_parent) searchParams.set('include_parent', 'true');
      
      const url = `/org/units${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
      console.log('Fetching URL:', url);
      const response = await fetcher<OrgUnitsResponse>(url);
      console.log('API Response:', response);
      console.log('Response data:', response.data);
      console.log('Response items:', response.data?.items);
      console.log('Response items length:', response.data?.items?.length);
      console.log('Response pagination:', response.data?.pagination);
      return response; // Return full response with pagination info
    },
    staleTime: 0, // No cache for debugging
    refetchOnWindowFocus: false,
    placeholderData: (previousData) => previousData, // Keep previous data while fetching new data
  });
}

// Hook để lấy danh sách đơn vị cha cho dropdown
export function useParentUnits() {
  return useQuery({
    queryKey: ['org', 'parent-units'],
    queryFn: async () => {
      const response = await fetcher<OrgUnitsResponse>('/org/units?status=ACTIVE&size=100&sort=name&order=asc');
      console.log('Parent units response:', response);
      return response;
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    refetchOnWindowFocus: false,
  });
}

