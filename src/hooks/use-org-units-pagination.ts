import { usePaginationWithFilters } from './use-pagination';
import { useOrgUnits } from '@/features/org/api/use-org-units';

export interface OrgUnitFilters {
  type: string;
  status: string;
}

export interface UseOrgUnitsPaginationOptions {
  initialPage?: number;
  initialSize?: number;
  initialSort?: string;
  initialOrder?: 'asc' | 'desc';
  initialSearch?: string;
  initialFilters?: Partial<OrgUnitFilters>;
  searchDebounceMs?: number;
}

export interface UseOrgUnitsPaginationReturn {
  // Data
  orgUnits: Array<{ id: string; name: string; [key: string]: unknown }>;
  pagination: { [key: string]: unknown };
  isLoading: boolean;
  isFetching: boolean;
  error: unknown;
  
  // Pagination state
  paginationState: {
    page: number;
    size: number;
    sort: string;
    order: 'asc' | 'desc';
    search: string;
    debouncedSearch: string;
  };
  
  // Filters
  filters: Record<string, string>;
  getFilterValue: (key: keyof OrgUnitFilters) => string;
  
  // Handlers
  handlers: {
    handleChangePage: (event: unknown, newPage: number) => void;
    handleChangeRowsPerPage: (event: React.ChangeEvent<HTMLInputElement>) => void;
    handleSearchChange: (value: string) => void;
    handleSortChange: (field: string) => void;
    handleFilterChange: (filters: Partial<OrgUnitFilters>) => void;
    resetPage: () => void;
  };
  
  // Utilities
  resetToFirstPage: () => void;
  updateFilter: (key: keyof OrgUnitFilters, value: string) => void;
  updateFilters: (newFilters: Partial<OrgUnitFilters>) => void;
  
  // Query params for API
  queryParams: {
    page: number;
    size: number;
    sort: string;
    order: 'asc' | 'desc';
    search?: string;
    type?: string;
    status?: string;
  };
}

/**
 * Custom hook for managing org units with pagination, sorting, searching, and filtering
 * Combines the common pagination logic with org units specific functionality
 */
export function useOrgUnitsPagination(
  options: UseOrgUnitsPaginationOptions = {}
): UseOrgUnitsPaginationReturn {
  const pagination = usePaginationWithFilters<OrgUnitFilters>({
    filterKeys: ['type', 'status'],
    initialFilterValues: {
      type: 'all',
      status: 'all',
      ...options.initialFilters,
    },
    initialPage: options.initialPage,
    initialSize: options.initialSize,
    initialSort: options.initialSort || 'name',
    initialOrder: options.initialOrder || 'asc',
    initialSearch: options.initialSearch || '',
    searchDebounceMs: options.searchDebounceMs || 500,
  });

  // API call with pagination params
  const { data: orgUnitsResponse, isLoading, isFetching, error } = useOrgUnits(pagination.queryParams);

  // Extract data from response
  const orgUnits = orgUnitsResponse?.data || [];
  const paginationInfo = null; // No pagination info in new API format

  // Helper to update specific filter
  const updateFilter = (key: keyof OrgUnitFilters, value: string) => {
    pagination.updateFilter(key, value);
  };

  // Helper to update multiple filters
  const updateFilters = (newFilters: Partial<OrgUnitFilters>) => {
    pagination.updateFilters(newFilters);
  };

  // Helper to get current filter value
  const getFilterValue = (key: keyof OrgUnitFilters) => {
    return pagination.getFilterValue(key);
  };

  return {
    // Data
    orgUnits,
    pagination: paginationInfo,
    isLoading,
    isFetching,
    error,
    
    // Pagination state
    paginationState: pagination.paginationState,
    
    // Filters
    filters: pagination.filters,
    getFilterValue,
    
    // Handlers
    handlers: pagination.handlers,
    
    // Utilities
    resetToFirstPage: pagination.resetToFirstPage,
    updateFilter,
    updateFilters,
    
    // Query params
    queryParams: pagination.queryParams,
  };
}
