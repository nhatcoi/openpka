'use client';

import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  IconButton,
  Chip,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Menu,
  MenuList,
  MenuItem,
  ListItemIcon,
  Divider,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  MoreVert as MoreIcon,
  Description as DocumentIcon,
  Image as ImageIcon,
  PictureAsPdf as PdfIcon,
  VideoFile as VideoIcon,
  AudioFile as AudioIcon,
  Archive as ArchiveIcon,
} from '@mui/icons-material';
import { useDocuments } from '@/hooks/use-documents';
import { Document } from '@/types/documents';
import { 
  formatFileSize, 
  getDocumentIcon, 
  getDocumentColor 
} from '@/lib/cloudinary-client';

interface DocumentListProps {
  entityType?: string;
  entityId?: string;
  showUploadButton?: boolean;
  onDocumentSelect?: (document: Document) => void;
}

export default function DocumentList({ 
  entityType, 
  entityId, 
  showUploadButton = true,
  onDocumentSelect 
}: DocumentListProps) {
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [contextMenuDocument, setContextMenuDocument] = useState<Document | null>(null);

  const { 
    documents, 
    loading, 
    error, 
    deleteDocument, 
    refetch 
  } = useDocuments({
    entityType,
    entityId,
    filters: { is_active: true }
  });

  const getDocumentIconComponent = (documentType: string, mimeType?: string) => {
    const iconType = getDocumentIcon(documentType, mimeType);
    switch (iconType) {
      case 'image': return <ImageIcon />;
      case 'pdf': return <PdfIcon />;
      case 'video': return <VideoIcon />;
      case 'audio': return <AudioIcon />;
      case 'archive': return <ArchiveIcon />;
      default: return <DocumentIcon />;
    }
  };

  const handleViewDocument = (document: Document) => {
    setSelectedDocument(document);
    setViewDialogOpen(true);
    onDocumentSelect?.(document);
  };

  const handleDelete = async (document: Document) => {
    if (confirm('Are you sure you want to delete this document?')) {
      const success = await deleteDocument(document.id);
      if (success) {
        await refetch();
      }
    }
  };

  const handleContextMenu = (event: React.MouseEvent, document: Document) => {
    event.preventDefault();
    setAnchorEl(event.currentTarget);
    setContextMenuDocument(document);
  };

  const handleContextMenuClose = () => {
    setAnchorEl(null);
    setContextMenuDocument(null);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      {documents.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <DocumentIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            Không có tài liệu nào
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Hãy upload tài liệu đầu tiên
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {documents.map((document) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={document.id.toString()}>
              <Card 
                sx={{ 
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  cursor: 'pointer',
                  '&:hover': {
                    boxShadow: 3
                  }
                }}
                onClick={() => {
                  // Mở URL tài liệu trong tab mới nếu có, fallback mở dialog
                  if (document.file_url) {
                    window.open(document.file_url, '_blank');
                  } else {
                    handleViewDocument(document);
                  }
                }}
                onContextMenu={(e) => handleContextMenu(e, document)}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar
                      sx={{
                        bgcolor: getDocumentColor(document.document_type),
                        mr: 2
                      }}
                    >
                      {getDocumentIconComponent(document.document_type, document.mime_type || undefined)}
                    </Avatar>
                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                      <Typography
                        variant="subtitle1"
                        sx={{
                          fontWeight: 'bold',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {document.original_name || document.file_name}
                      </Typography>
                      <Chip
                        label={document.document_type}
                        size="small"
                        sx={{ mt: 0.5 }}
                      />
                    </Box>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleContextMenu(e, document);
                      }}
                    >
                      <MoreIcon />
                    </IconButton>
                  </Box>

                  {document.description && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        mb: 2,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical'
                      }}
                    >
                      {document.description}
                    </Typography>
                  )}

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" color="text.secondary">
                      {document.file_size ? formatFileSize(Number(document.file_size)) : 'Unknown size'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {document.uploaded_at ? new Date(document.uploaded_at).toLocaleDateString() : ''}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* View Document Dialog */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Avatar sx={{ bgcolor: getDocumentColor(selectedDocument?.document_type || 'other'), mr: 2 }}>
              {selectedDocument && getDocumentIconComponent(selectedDocument.document_type, selectedDocument.mime_type || undefined)}
            </Avatar>
            {selectedDocument?.original_name || selectedDocument?.file_name}
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedDocument && (
            <Box>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>Loại tài liệu:</Typography>
                  <Chip label={selectedDocument.document_type} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>Kích thước:</Typography>
                  <Typography variant="body2">
                    {selectedDocument.file_size ? formatFileSize(Number(selectedDocument.file_size)) : 'Unknown'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>Entity:</Typography>
                  <Typography variant="body2">
                    {selectedDocument.entity_type} - {selectedDocument.entity_id.toString()}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>Upload bởi:</Typography>
                  <Typography variant="body2">
                    {selectedDocument.User?.full_name || selectedDocument.User?.email || 'Unknown'}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>Mô tả:</Typography>
                  <Typography variant="body2">
                    {selectedDocument.description || 'Không có mô tả'}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>URL:</Typography>
                  <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                    {selectedDocument.file_url}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Đóng</Button>
          {selectedDocument && (
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              href={selectedDocument.file_url}
              target="_blank"
            >
              Tải xuống
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleContextMenuClose}
      >
        <MenuList>
          <MenuItem onClick={() => {
            if (contextMenuDocument) {
              handleViewDocument(contextMenuDocument);
            }
            handleContextMenuClose();
          }}>
            <ListItemIcon>
              <ViewIcon fontSize="small" />
            </ListItemIcon>
            Xem chi tiết
          </MenuItem>
          <MenuItem onClick={() => {
            if (contextMenuDocument) {
              window.open(contextMenuDocument.file_url, '_blank');
            }
            handleContextMenuClose();
          }}>
            <ListItemIcon>
              <DownloadIcon fontSize="small" />
            </ListItemIcon>
            Tải xuống
          </MenuItem>
          <Divider />
          <MenuItem onClick={() => {
            if (contextMenuDocument) {
              handleDelete(contextMenuDocument);
            }
            handleContextMenuClose();
          }}>
            <ListItemIcon>
              <DeleteIcon fontSize="small" />
            </ListItemIcon>
            Xóa
          </MenuItem>
        </MenuList>
      </Menu>
    </Box>
  );
}
