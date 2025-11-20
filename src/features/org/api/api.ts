// Centralized API fetch functions for Organization module
// This file provides clean, reusable API functions to replace scattered fetch calls

// Types
export interface OrgUnit {
  id: string;
  parent_id: string | null;
  type: string | null;
  code: string;
  name: string;
  created_at: string;
  updated_at: string;
  description: string | null;
  status: string | null;
  effective_from: string | null;
  effective_to: string | null;
  parent?: OrgUnit | null;
}

export interface OrgUnitHistory {
  id: string;
  org_unit_id: string;
  old_name: string | null;
  new_name: string | null;
  change_type: string;
  details: { [key: string]: unknown };
  changed_at: string | null;
}

export interface OrgUnitRelation {
  parent_id: string;
  child_id: string;
  relation_type: string;
  effective_from: string;
  effective_to: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaginationParams {
  page?: number;
  size?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  search?: string;
  type?: string;
  status?: string;
  parent_id?: string;
  include_employees?: boolean;
  include_children?: boolean;
  include_parent?: boolean;
}

export interface OrgStats {
  totalUnits: number;
  totalEmployees: number;
  activeUnits: number;
  inactiveUnits: number;
  departments: number;
  divisions: number;
  teams: number;
  branches: number;
  topUnits: {
    id: string;
    name: string;
    code: string;
    type: string;
    employeeCount: number;
  }[];
}

export interface OrgUnitsResponse {
  success: boolean;
  data: OrgUnit[];
  pagination: {
    page: number;
    size: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface HistoryResponse {
  success: boolean;
  data: {
    items: OrgUnitHistory[];
    total: number;
    page: number;
    size: number;
    totalPages: number;
  };
}

export interface RelationsResponse {
  success: boolean;
  data: {
    items: OrgUnitRelation[];
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

// Base API response type
interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

// Generic fetch wrapper with error handling
async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    const data = await response.json();

    if (!response.ok) {
      const error = new Error(data.error || data.details || `HTTP ${response.status}: ${response.statusText}`);
      (error as any).response = { data };
      throw error;
    }

    return data;
  } catch (error) {
    console.error(`API Error [${url}]:`, error);
    throw error;
  }
}

// Build query string from parameters
function buildQueryString(params: Record<string, any>): string {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, value.toString());
    }
  });

  return searchParams.toString();
}

// Organization Units API
export const orgUnitsApi = {
  // Get all org units with pagination and filters
  async getAll(params: PaginationParams = {}): Promise<OrgUnitsResponse> {
    const queryString = buildQueryString({
      page: params.page || 1,
      size: params.size || 10,
      sort: params.sort || 'name',
      order: params.order || 'asc',
      ...params,
    });

    return apiFetch<OrgUnitsResponse>(`/api/org/units?${queryString}`);
  },

  // Get org unit by ID
  async getById(id: string): Promise<ApiResponse<OrgUnit>> {
    return apiFetch<ApiResponse<OrgUnit>>(`/api/org/units/${id}`);
  },

  // Create new org unit
  async create(data: Partial<OrgUnit>): Promise<ApiResponse<OrgUnit>> {
    return apiFetch<ApiResponse<OrgUnit>>('/api/org/units', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Update org unit
  async update(id: string, data: Partial<OrgUnit>): Promise<ApiResponse<OrgUnit>> {
    return apiFetch<ApiResponse<OrgUnit>>(`/api/org/units/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async delete(id: string): Promise<ApiResponse<OrgUnit>> {
    return apiFetch<ApiResponse<OrgUnit>>(`/api/org/units/${id}`, {
      method: 'DELETE',
    });
  },

  async archive(id: string): Promise<ApiResponse<OrgUnit>> {
    return apiFetch<ApiResponse<OrgUnit>>(`/api/org/units/${id}/archive`, {
      method: 'PATCH',
    });
  },

  async deactivate(id: string): Promise<ApiResponse<OrgUnit>> {
    return apiFetch<ApiResponse<OrgUnit>>(`/api/org/units/${id}/deactivate`, {
      method: 'PATCH',
    });
  },

  // Get org units for tree view (all active units)
  async getForTree(): Promise<OrgUnitsResponse> {
    return this.getAll({
      status: 'active',
      page: 1,
      size: 1000, // Get all units for tree view
    });
  },
};

// Organization Unit History API
export const orgUnitHistoryApi = {
  // Get history records for an org unit
  async getByOrgUnitId(
    orgUnitId: string,
    params: {
      change_type?: string;
      from_date?: string;
      to_date?: string;
      page?: number;
      size?: number;
      sort?: string;
      order?: 'asc' | 'desc';
    } = {}
  ): Promise<HistoryResponse> {
    const queryString = buildQueryString({
      org_unit_id: orgUnitId,
      page: params.page || 1,
      size: params.size || 20,
      sort: params.sort || 'changed_at',
      order: params.order || 'desc',
      ...params,
    });

    return apiFetch<HistoryResponse>(`/api/org/history?${queryString}`);
  },

  // Create history record
  async create(data: {
    org_unit_id: string;
    old_name?: string;
    new_name?: string;
    change_type: string;
    details?: { [key: string]: unknown };
  }): Promise<ApiResponse<OrgUnitHistory>> {
    return apiFetch<ApiResponse<OrgUnitHistory>>('/api/org/history', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

// Organization Unit Relations API
export const orgUnitRelationsApi = {
  // Get relations where unit is parent
  async getByParentId(parentId: string): Promise<RelationsResponse> {
    const queryString = buildQueryString({ parent_id: parentId });
    return apiFetch<RelationsResponse>(`/api/org/unit-relations?${queryString}`);
  },

  // Get relations where unit is child
  async getByChildId(childId: string): Promise<RelationsResponse> {
    const queryString = buildQueryString({ child_id: childId });
    return apiFetch<RelationsResponse>(`/api/org/unit-relations?${queryString}`);
  },

  // Get all relations for a unit (both as parent and child)
  async getAllForUnit(unitId: string): Promise<{
    parentRelations: OrgUnitRelation[];
    childRelations: OrgUnitRelation[];
  }> {
    const [parentResponse, childResponse] = await Promise.all([
      this.getByParentId(unitId),
      this.getByChildId(unitId),
    ]);

    return {
      parentRelations: parentResponse.data.items || [],
      childRelations: childResponse.data.items || [],
    };
  },

  // Create new relation
  async create(data: {
    parent_id: string;
    child_id: string;
    relation_type: string;
    effective_from: string;
    effective_to?: string;
    note?: string;
  }): Promise<ApiResponse<OrgUnitRelation>> {
    return apiFetch<ApiResponse<OrgUnitRelation>>('/api/org/unit-relations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Update relation
  async update(
    relationKey: string, // composite key: "parent_id-child_id-relation_type-effective_from"
    data: {
      relation_type?: string;
      effective_to?: string;
      note?: string;
    }
  ): Promise<ApiResponse<OrgUnitRelation>> {
    return apiFetch<ApiResponse<OrgUnitRelation>>(`/api/org/unit-relations/${relationKey}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Delete relation
  async delete(relationKey: string): Promise<ApiResponse<OrgUnitRelation>> {
    return apiFetch<ApiResponse<OrgUnitRelation>>(`/api/org/unit-relations/${relationKey}`, {
      method: 'DELETE',
    });
  },
};

// Organization Stats API
export const orgStatsApi = {
  // Get organization statistics for dashboard
  async getStats(): Promise<ApiResponse<OrgStats>> {
    return apiFetch<ApiResponse<OrgStats>>('/api/org/stats');
  },
};

// Export all APIs as a single object for easy importing
export const orgApi = {
  units: orgUnitsApi,
  history: orgUnitHistoryApi,
  relations: orgUnitRelationsApi,
  stats: orgStatsApi,
};

// Default export
export default orgApi;
