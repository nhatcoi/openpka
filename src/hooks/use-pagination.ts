import { useState, useEffect, useCallback } from 'react';

export interface PaginationState {
  page: number;
  size: number;
  sort: string;
  order: 'asc' | 'desc';
  search: string;
  debouncedSearch: string;
}

export interface PaginationFilters {
  [key: string]: string | undefined;
}

export interface PaginationHandlers {
  handleChangePage: (event: unknown, newPage: number) => void;
  handleChangeRowsPerPage: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleSearchChange: (value: string) => void;
  handleSortChange: (field: string) => void;
  handleFilterChange: (filters: PaginationFilters) => void;
  resetPage: () => void;
}

export interface UsePaginationOptions {
  initialPage?: number;
  initialSize?: number;
  initialSort?: string;
  initialOrder?: 'asc' | 'desc';
  initialSearch?: string;
  initialFilters?: PaginationFilters;
  searchDebounceMs?: number;
}

export interface UsePaginationReturn {
  // State
  paginationState: PaginationState;
  filters: PaginationFilters;
  
  // Handlers
  handlers: PaginationHandlers;
  
  // Query params for API
  queryParams: {
    page: number;
    size: number;
    sort: string;
    order: 'asc' | 'desc';
    search?: string;
    [key: string]: unknown;
  };
  
  // Utilities
  resetToFirstPage: () => void;
  updateFilters: (newFilters: PaginationFilters) => void;
}

/**
 * Custom hook for managing pagination, sorting, searching, and filtering
 * Provides a common interface for data tables with server-side pagination
 */
export function usePagination(options: UsePaginationOptions = {}): UsePaginationReturn {
  const {
    initialPage = 0,
    initialSize = 10,
    initialSort = 'name',
    initialOrder = 'asc',
    initialSearch = '',
    initialFilters = {},
    searchDebounceMs = 500,
  } = options;

  // Pagination state
  const [page, setPage] = useState(initialPage);
  const [size, setSize] = useState(initialSize);
  const [sort, setSort] = useState(initialSort);
  const [order, setOrder] = useState<'asc' | 'desc'>(initialOrder);
  const [search, setSearch] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
  const [filters, setFilters] = useState<PaginationFilters>(initialFilters);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, searchDebounceMs);
    
    return () => clearTimeout(timer);
  }, [search, searchDebounceMs]);

  // Handlers
  const handleChangePage = useCallback((event: unknown, newPage: number) => {
    setPage(newPage);
  }, []);

  const handleChangeRowsPerPage = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const newSize = parseInt(event.target.value, 10);
    setSize(newSize);
    setPage(0); // Reset to first page when changing page size
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    setPage(0); // Reset to first page when searching
  }, []);

  const handleSortChange = useCallback((field: string) => {
    if (sort === field) {
      setOrder(order === 'asc' ? 'desc' : 'asc');
    } else {
      setSort(field);
      setOrder('asc');
    }
    setPage(0); // Reset to first page when sorting
  }, [sort, order]);

  const handleFilterChange = useCallback((newFilters: PaginationFilters) => {
    setFilters(newFilters);
    setPage(0); // Reset to first page when filtering
  }, []);

  const resetPage = useCallback(() => {
    setPage(0);
  }, []);

  const resetToFirstPage = useCallback(() => {
    setPage(0);
  }, []);

  const updateFilters = useCallback((newFilters: PaginationFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPage(0); // Reset to first page when updating filters
  }, []);

  // Build query params for API
  const queryParams = {
    page: page + 1, // API uses 1-based pagination
    size,
    sort,
    order,
    search: debouncedSearch || undefined,
    ...Object.entries(filters).reduce((acc, [key, value]) => {
      if (value && value !== 'all') {
        acc[key] = value;
      }
      return acc;
    }, {} as Record<string, any>),
  };

  return {
    paginationState: {
      page,
      size,
      sort,
      order,
      search,
      debouncedSearch,
    },
    filters,
    handlers: {
      handleChangePage,
      handleChangeRowsPerPage,
      handleSearchChange,
      handleSortChange,
      handleFilterChange,
      resetPage,
    },
    queryParams,
    resetToFirstPage,
    updateFilters,
  };
}

/**
 * Hook for managing pagination with specific filter types
 * Useful for common filter patterns like status, type, etc.
 */
export function usePaginationWithFilters<T extends Record<string, string>>(
  options: UsePaginationOptions & {
    filterKeys: (keyof T)[];
    initialFilterValues?: Partial<T>;
  }
) {
  const { filterKeys, initialFilterValues = {}, ...paginationOptions } = options;
  
  // Initialize filters with default 'all' values
  const initialFilters = filterKeys.reduce((acc, key) => {
    acc[key as string] = (initialFilterValues as { [key: string]: unknown })[key] || 'all';
    return acc;
  }, {} as Record<string, string>);

  const pagination = usePagination({
    ...paginationOptions,
    initialFilters,
  });

  // Helper to update specific filter
  const updateFilter = useCallback((key: keyof T, value: string) => {
    pagination.updateFilters({ [key]: value });
  }, [pagination]);

  // Helper to get current filter value
  const getFilterValue = useCallback((key: keyof T) => {
    return pagination.filters[key as string] || 'all';
  }, [pagination.filters]);

  return {
    ...pagination,
    updateFilter,
    getFilterValue,
  };
}
