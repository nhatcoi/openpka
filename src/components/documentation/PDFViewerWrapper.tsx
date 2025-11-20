'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Box, CircularProgress } from '@mui/material';

// Dynamic import PDFViewer để tránh SSR issues
const PDFViewer = dynamic(
  () => import('./PDFViewer'),
  {
    ssr: false,
    loading: () => (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    ),
  }
);

interface PDFViewerWrapperProps {
  url: string;
  loading?: boolean;
  error?: string;
}

export default function PDFViewerWrapper(props: PDFViewerWrapperProps) {
  return <PDFViewer {...props} />;
}

