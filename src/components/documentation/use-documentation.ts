import { useQuery } from '@tanstack/react-query';
import {
  DocumentationFile,
  DocumentationSection,
} from '@/app/api/documentation/route';

export interface DocumentationResponse {
  sections: DocumentationSection[];
  files: DocumentationFile[];
  rootReadme?: DocumentationFile | null;
}

export function useDocumentation(section?: string) {
  return useQuery<DocumentationResponse>({
    queryKey: ['documentation', section || 'all'],
    queryFn: async () => {
      const url = section
        ? `/api/documentation?section=${encodeURIComponent(section)}`
        : '/api/documentation';
      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Không thể tải danh sách tài liệu');
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
  });
}
