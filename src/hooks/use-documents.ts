import { useState, useEffect } from 'react';
import { Document, CreateDocumentInput, UpdateDocumentInput, DocumentFilters } from '@/types/documents';

interface UseDocumentsOptions {
  entityType?: string;
  entityId?: bigint;
  filters?: DocumentFilters;
  autoFetch?: boolean;
}

interface UseDocumentsReturn {
  documents: Document[];
  loading: boolean;
  error: string | null;
  createDocument: (data: CreateDocumentInput) => Promise<Document | null>;
  updateDocument: (id: bigint, data: UpdateDocumentInput) => Promise<Document | null>;
  deleteDocument: (id: bigint) => Promise<boolean>;
  refetch: () => Promise<void>;
}

export function useDocuments(options: UseDocumentsOptions = {}): UseDocumentsReturn {
  const { entityType, entityId, filters = {}, autoFetch = true } = options;
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      setError(null);

      let url = '/api/documents';
      
      // Build query parameters
      const params = new URLSearchParams();
      
      if (entityType && entityId) {
        // Use entity-specific endpoint
        url = `/api/documents/entity/${entityType}/${entityId.toString()}`;
      } else {
        // Use general endpoint with filters
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

      setDocuments(result.data.documents || result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const createDocument = async (data: CreateDocumentInput): Promise<Document | null> => {
    try {
      setError(null);

      const response = await fetch('/api/documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create document');
      }

      // Add new document to the list
      setDocuments(prev => [result.data, ...prev]);
      
      return result.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create document');
      return null;
    }
  };

  const updateDocument = async (id: bigint, data: UpdateDocumentInput): Promise<Document | null> => {
    try {
      setError(null);

      const response = await fetch(`/api/documents/${id.toString()}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update document');
      }

      // Update document in the list
      setDocuments(prev => 
        prev.map(doc => doc.id === id ? result.data : doc)
      );
      
      return result.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update document');
      return null;
    }
  };

  const deleteDocument = async (id: bigint): Promise<boolean> => {
    try {
      setError(null);

      const response = await fetch(`/api/documents/${id.toString()}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete document');
      }

      // Remove document from the list
      setDocuments(prev => prev.filter(doc => doc.id !== id));
      
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete document');
      return false;
    }
  };

  const refetch = async () => {
    await fetchDocuments();
  };

  useEffect(() => {
    if (autoFetch) {
      fetchDocuments();
    }
  }, [entityType, entityId, JSON.stringify(filters), autoFetch]);

  return {
    documents,
    loading,
    error,
    createDocument,
    updateDocument,
    deleteDocument,
    refetch,
  };
}

// Hook for single document
export function useDocument(id: bigint | null) {
  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDocument = async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/documents/${id.toString()}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch document');
      }

      setDocument(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocument();
  }, [id]);

  return {
    document,
    loading,
    error,
    refetch: fetchDocument,
  };
}
