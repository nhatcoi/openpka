import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Document, CreateDocumentInput, UpdateDocumentInput, DocumentFilters } from '@/features/documents';

interface UseDocumentsOptions {
  entityType?: string;
  entityId?: bigint | string | number;
  filters?: DocumentFilters;
  autoFetch?: boolean;
}

interface UseDocumentsReturn {
  documents: Document[];
  loading: boolean;
  isLoading: boolean;
  error: string | null;
  createDocument: (data: CreateDocumentInput) => Promise<Document | null>;
  updateDocument: (id: bigint, data: UpdateDocumentInput) => Promise<Document | null>;
  deleteDocument: (id: bigint) => Promise<boolean>;
  refetch: () => Promise<unknown>;
}

async function fetchDocumentsApi(options: UseDocumentsOptions): Promise<Document[]> {
  const { entityType, entityId, filters = {} } = options;
  let url = '/api/documents';
  const params = new URLSearchParams();

  if (entityType && entityId) {
    url = `/api/documents/entity/${entityType}/${entityId.toString()}`;
  } else {
    if (filters.entity_type) params.append('entity_type', filters.entity_type);
    if (filters.entity_id) params.append('entity_id', filters.entity_id.toString());
    if (filters.document_type) params.append('document_type', filters.document_type);
    if (filters.uploaded_by) params.append('uploaded_by', filters.uploaded_by.toString());
    if (filters.is_active !== undefined) params.append('is_active', filters.is_active.toString());
    if (filters.mime_type) params.append('mime_type', filters.mime_type);
    if (filters.date_from) params.append('date_from', filters.date_from.toISOString());
    if (filters.date_to) params.append('date_to', filters.date_to.toISOString());

    if (params.toString()) {
      url += `?${params.toString()}`;
    }
  }

  const response = await fetch(url);
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || 'Failed to fetch documents');
  }

  return result.data?.documents || result.data || [];
}

export function useDocuments(options: UseDocumentsOptions = {}): UseDocumentsReturn {
  const queryClient = useQueryClient();
  const queryKey = ['documents', options.entityType, options.entityId?.toString(), options.filters];

  const query = useQuery({
    queryKey,
    queryFn: () => fetchDocumentsApi(options),
    enabled: options.autoFetch !== false,
    staleTime: 60 * 1000,
  });

  const createMutation = useMutation({
    mutationFn: async (data: CreateDocumentInput) => {
      const response = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to create document');
      return result.data as Document;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: bigint; data: UpdateDocumentInput }) => {
      const response = await fetch(`/api/documents/${id.toString()}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to update document');
      return result.data as Document;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: bigint) => {
      const response = await fetch(`/api/documents/${id.toString()}`, {
        method: 'DELETE',
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to delete document');
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });

  return {
    documents: query.data || [],
    loading: query.isLoading,
    isLoading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
    createDocument: async (data) => createMutation.mutateAsync(data).catch(() => null),
    updateDocument: async (id, data) => updateMutation.mutateAsync({ id, data }).catch(() => null),
    deleteDocument: async (id) => deleteMutation.mutateAsync(id).catch(() => false),
    refetch: query.refetch,
  };
}
