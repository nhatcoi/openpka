'use client';

import React, { useState } from 'react';
import {
  Box,
  Paper,
  Button,
  Stack,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Download as DownloadIcon,
  OpenInNew as OpenInNewIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon,
} from '@mui/icons-material';

interface PDFViewerProps {
  url: string;
  loading?: boolean;
  error?: string;
}

export default function PDFViewer({ url, loading, error }: PDFViewerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const iframeRef = React.useRef<HTMLIFrameElement>(null);
  

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = url;
    link.download = url.split('/').pop() || 'document.pdf';
    link.target = '_blank';
    link.click();
  };

  const handleOpenInNewTab = () => {
    window.open(url, '_blank');
  };

  const handleFullscreen = () => {
    const container = document.getElementById('pdf-viewer-container');
    if (!container) return;

    if (!isFullscreen) {
      if (container.requestFullscreen) {
        container.requestFullscreen();
      } else if ((container as any).webkitRequestFullscreen) {
        (container as any).webkitRequestFullscreen();
      } else if ((container as any).msRequestFullscreen) {
        (container as any).msRequestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      } else if ((document as any).msExitFullscreen) {
        (document as any).msExitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  // Listen for fullscreen changes
  React.useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    };
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  // Construct full URL for PDF
  const pdfUrl = typeof window !== 'undefined' 
    ? (url.startsWith('http') ? url : `${window.location.origin}${url}`)
    : url;

  return (
    <Paper
      id="pdf-viewer-container"
      sx={{
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 150px)',
        minHeight: '600px',
      }}
    >
      {/* Toolbar */}
      <Stack
        direction="row"
        spacing={1}
        alignItems="center"
        justifyContent="flex-end"
        sx={{ mb: 2 }}
      >
        <Tooltip title="Mở trong tab mới">
          <IconButton onClick={handleOpenInNewTab} size="small">
            <OpenInNewIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title={isFullscreen ? 'Thoát toàn màn hình' : 'Toàn màn hình'}>
          <IconButton onClick={handleFullscreen} size="small">
            {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
          </IconButton>
        </Tooltip>
        <Button
          startIcon={<DownloadIcon />}
          onClick={handleDownload}
          size="small"
          variant="outlined"
        >
          Tải xuống
        </Button>
      </Stack>

      {/* PDF Viewer */}
      <Box
        sx={{
          flex: 1,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1,
          overflow: 'hidden',
          position: 'relative',
          backgroundColor: '#f5f5f5',
          '& iframe, & embed, & object': {
            width: '100%',
            height: '100%',
            border: 'none',
          },
        }}
      >
        {/* PDF Viewer using iframe - works in Chrome, Firefox, Safari, Edge */}
        <iframe
          ref={iframeRef}
          src={`${pdfUrl}#toolbar=1&navpanes=1&scrollbar=1`}
          title="PDF Viewer"
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
          }}
          allow="fullscreen"
        />
      </Box>

      {/* Help message */}
      <Box
        sx={{
          mt: 2,
          p: 1,
          bgcolor: 'action.hover',
          borderRadius: 1,
          textAlign: 'center',
        }}
      >
        <Button
          size="small"
          variant="text"
          onClick={handleOpenInNewTab}
          startIcon={<OpenInNewIcon />}
        >
          Mở PDF trong tab mới
        </Button>
      </Box>
    </Paper>
  );
}

