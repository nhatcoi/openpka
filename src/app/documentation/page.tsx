'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  Drawer,
  IconButton,
  AppBar,
  Toolbar,
  Divider,
  Chip,
  CircularProgress,
  Alert,
  Grid,
  Card,
  CardContent,
  Stack,
  Tooltip,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Description as DocumentIcon,
  PictureAsPdf as PdfIcon,
  Code as CodeIcon,
  Close as CloseIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import DocumentViewer from '@/components/documentation/DocumentViewer';
import { DocumentationFile } from '@/app/api/documentation/route';

const DRAWER_WIDTH = 300;

export default function DocumentationPage() {
  const theme = useTheme();
  const [documents, setDocuments] = useState<DocumentationFile[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<DocumentationFile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hasAutoSelected, setHasAutoSelected] = useState(false);

  useEffect(() => {
    loadDocuments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/documentation');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Không thể tải danh sách tài liệu');
      }
      const data = await response.json();
      setDocuments(data);
      
      // Tự động chọn document đầu tiên nếu có và chưa chọn
      if (data.length > 0 && !hasAutoSelected) {
        setSelectedDocument(data[0]);
        setHasAutoSelected(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi');
      console.error('Error loading documents:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentSelect = (document: DocumentationFile) => {
    setSelectedDocument(document);
    setMobileOpen(false);
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const getDocumentIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return <PdfIcon />;
      case 'markdown':
        return <CodeIcon />;
      default:
        return <DocumentIcon />;
    }
  };

  const getDocumentColor = (type: string) => {
    switch (type) {
      case 'pdf':
        return 'error';
      case 'markdown':
        return 'primary';
      default:
        return 'default';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const drawer = (
    <Box>
      <Toolbar
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
        }}
      >
        <Typography variant="h6" noWrap component="div">
          Tài liệu
        </Typography>
        <IconButton
          onClick={handleDrawerToggle}
          sx={{ display: { sm: 'none' } }}
        >
          <CloseIcon />
        </IconButton>
      </Toolbar>
      <Divider />
      <List>
        {documents.map((doc) => (
          <ListItem key={doc.name} disablePadding>
            <ListItemButton
              selected={selectedDocument?.name === doc.name}
              onClick={() => handleDocumentSelect(doc)}
            >
              <ListItemIcon>{getDocumentIcon(doc.type)}</ListItemIcon>
              <ListItemText
                primary={
                  <Tooltip title={doc.name} arrow>
                    <span>{doc.displayName || doc.name}</span>
                  </Tooltip>
                }
                secondary={
                  <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                    <Chip
                      label={doc.type.toUpperCase()}
                      size="small"
                      color={getDocumentColor(doc.type) as any}
                      variant="outlined"
                    />
                    <Typography variant="caption" color="text.secondary">
                      {formatFileSize(doc.size)}
                    </Typography>
                  </Stack>
                }
                secondaryTypographyProps={{
                  component: 'div',
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* AppBar */}
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { sm: `${DRAWER_WIDTH}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {selectedDocument ? selectedDocument.displayName || selectedDocument.name : 'Tài liệu hệ thống'}
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Drawer */}
      <Box
        component="nav"
        sx={{ width: { sm: DRAWER_WIDTH }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` },
          mt: '64px',
        }}
      >
        {documents.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <DocumentIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Không có tài liệu nào
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Vui lòng thêm tài liệu vào thư mục <code>public/documentation</code>
            </Typography>
          </Paper>
        ) : selectedDocument ? (
          <DocumentViewer document={selectedDocument} />
        ) : (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <DocumentIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              Chọn một tài liệu để xem
            </Typography>
          </Paper>
        )}
      </Box>
    </Box>
  );
}

