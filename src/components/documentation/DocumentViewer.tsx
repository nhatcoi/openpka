'use client';

import React, { useState, useEffect } from 'react';
import { Alert } from '@mui/material';
import MarkdownViewer from './MarkdownViewer';
import PDFViewerWrapper from './PDFViewerWrapper';
import { DocumentationFile } from '@/app/api/documentation/route';

interface DocumentViewerProps {
  document: DocumentationFile;
}

export default function DocumentViewer({ document }: DocumentViewerProps) {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDocument = async () => {
      setLoading(true);
      setError(null);

      try {
        if (document.type === 'markdown') {
          const url =
            typeof window !== 'undefined'
              ? `${window.location.origin}${document.path}`
              : document.path;
          const response = await fetch(url);
          if (!response.ok) {
            throw new Error(`Không thể tải file markdown: ${response.status} ${response.statusText}`);
          }
          const text = await response.text();
          setContent(text);
        } else if (document.type === 'pdf') {
          setContent('');
        } else {
          throw new Error('Định dạng file không được hỗ trợ');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi');
      } finally {
        setLoading(false);
      }
    };

    loadDocument();
  }, [document]);

  if (document.type === 'pdf') {
    return <PDFViewerWrapper url={document.path} loading={loading} error={error || undefined} />;
  }

  if (document.type === 'markdown') {
    return <MarkdownViewer content={content} loading={loading} error={error || undefined} />;
  }

  return (
    <Alert severity="warning" sx={{ m: 2 }}>
      Định dạng file không được hỗ trợ. Chỉ hỗ trợ Markdown (.md) và PDF (.pdf).
    </Alert>
  );
}

