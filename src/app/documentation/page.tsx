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
  CircularProgress,
  Alert,
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
import {
  DocumentationFile,
  DocumentationSection,
} from '@/app/api/documentation/route';
import Collapse from '@mui/material/Collapse';

const DRAWER_WIDTH = 320;

export default function DocumentationPage() {
  const theme = useTheme();
  const [sections, setSections] = useState<DocumentationSection[]>([]);
  const [documents, setDocuments] = useState<DocumentationFile[]>([]);
  const [rootReadme, setRootReadme] = useState<DocumentationFile | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<DocumentationFile | null>(null);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    loadDocuments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadDocuments = async (section?: string) => {
    try {
      setLoading(true);
      setError(null);
      const url = section
        ? `/api/documentation?section=${encodeURIComponent(section)}`
        : '/api/documentation';
      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Không thể tải danh sách tài liệu');
      }
      const data = await response.json();
      setSections(data.sections || []);
      const files = (data.files || []).filter(
        (file: DocumentationFile) => !file.name.toLowerCase().includes('readme')
      );
      setDocuments(files);
      setRootReadme(data.rootReadme || null);
      
      // Auto-select root README on first load if no document selected
      if (!section && data.rootReadme && !selectedDocument && !selectedSection) {
        setSelectedDocument(data.rootReadme);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi');
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentSelect = (document: DocumentationFile) => {
    setSelectedDocument(document);
    setSelectedSection(null);
    setMobileOpen(false);
  };

  const handleSectionSelect = (section: DocumentationSection) => {
    setSelectedSection(section.name);
    setSelectedDocument(null);
    setDocuments(section.files.filter((file) => !file.name.toLowerCase().includes('readme')));
    setMobileOpen(false);
  };

  const handleSectionToggle = (sectionName: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionName)) {
      newExpanded.delete(sectionName);
    } else {
      newExpanded.add(sectionName);
    }
    setExpandedSections(newExpanded);
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleRootClick = () => {
    setSelectedSection(null);
    if (rootReadme) {
      setSelectedDocument(rootReadme);
      setDocuments([]);
    } else {
      setSelectedDocument(null);
      loadDocuments();
    }
    setMobileOpen(false);
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
        <ListItem disablePadding>
          <ListItemButton
            selected={!selectedSection && !selectedDocument}
            onClick={handleRootClick}
          >
            <ListItemIcon>
              <DocumentIcon />
            </ListItemIcon>
            <ListItemText primary="Tổng quan" />
          </ListItemButton>
        </ListItem>
        {sections.map((section) => (
          <React.Fragment key={section.name}>
            <ListItem disablePadding>
              <ListItemButton
                selected={selectedSection === section.name}
                onClick={() => {
                  handleSectionSelect(section);
                  handleSectionToggle(section.name);
                }}
                sx={{ pl: 2 }}
              >
                <ListItemText primary={section.displayName} />
              </ListItemButton>
            </ListItem>
            <Collapse in={expandedSections.has(section.name)} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                {section.files.map((doc) => (
                  <ListItem key={doc.name} disablePadding>
                    <ListItemButton
                      selected={selectedDocument?.path === doc.path}
                      onClick={() => handleDocumentSelect(doc)}
                      sx={{ pl: 6 }}
                    >
                      <ListItemIcon>{getDocumentIcon(doc.type)}</ListItemIcon>
                      <ListItemText
                        primary={
                          <Tooltip title={doc.name} arrow>
                            <span>{doc.displayName || doc.name}</span>
                          </Tooltip>
                        }
                      />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            </Collapse>
          </React.Fragment>
        ))}
        {!selectedSection && documents.length > 0 && (
          <>
            <Divider sx={{ my: 1 }} />
        {documents.map((doc) => (
          <ListItem key={doc.name} disablePadding>
            <ListItemButton
                  selected={selectedDocument?.path === doc.path}
              onClick={() => handleDocumentSelect(doc)}
            >
              <ListItemIcon>{getDocumentIcon(doc.type)}</ListItemIcon>
              <ListItemText
                primary={
                  <Tooltip title={doc.name} arrow>
                    <span>{doc.displayName || doc.name}</span>
                  </Tooltip>
                }
              />
            </ListItemButton>
          </ListItem>
        ))}
          </>
        )}
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
        {selectedDocument ? (
          <DocumentViewer document={selectedDocument} />
        ) : selectedSection ? (
          <Paper sx={{ p: 4 }}>
            <Typography variant="h4" gutterBottom>
              {sections.find((s) => s.name === selectedSection)?.displayName || selectedSection}
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Chọn một tài liệu từ sidebar để xem nội dung.
            </Typography>
            {documents.length > 0 && (
              <List>
                {documents.map((doc) => (
                  <ListItem key={doc.name}>
                    <ListItemButton onClick={() => handleDocumentSelect(doc)}>
                      <ListItemIcon>{getDocumentIcon(doc.type)}</ListItemIcon>
                      <ListItemText primary={doc.displayName} />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        ) : documents.length === 0 && sections.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <DocumentIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Không có tài liệu nào
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Vui lòng thêm tài liệu vào thư mục <code>public/documentation</code>
            </Typography>
          </Paper>
        ) : (
          <Paper sx={{ p: 4 }}>
            <Typography variant="h4" gutterBottom>
              Tài liệu hệ thống
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Chọn một section hoặc tài liệu từ sidebar để bắt đầu.
            </Typography>
          </Paper>
        )}
      </Box>
    </Box>
  );
}

