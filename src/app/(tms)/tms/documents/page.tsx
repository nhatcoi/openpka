'use client';

import React, { useState, useRef } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Alert,
  CircularProgress,
  Fab,
  Tooltip,
  Divider,
  Paper,
  InputAdornment,
  Menu,
  MenuList,
  ListItemIcon,
} from '@mui/material';
import {
  Add as AddIcon,
  Upload as UploadIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  MoreVert as MoreIcon,
  CloudUpload as CloudUploadIcon,
  Description as DocumentIcon,
  Image as ImageIcon,
  PictureAsPdf as PdfIcon,
  VideoFile as VideoIcon,
  AudioFile as AudioIcon,
  Archive as ArchiveIcon,
  InsertDriveFile as FileIcon,
  ViewModule as CardViewIcon,
  ViewList as ListViewIcon,
} from '@mui/icons-material';
import { useDocuments } from '@/hooks/use-documents';
import { Document, ENTITY_TYPES, DOCUMENT_TYPES } from '@/types/documents';
import { 
  getFileTypeFromMime, 
  formatFileSize, 
  getDocumentIcon, 
  getDocumentColor 
} from '@/lib/cloudinary-client';

export default function DocumentsPage() {
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadForm, setUploadForm] = useState({
    entity_type: 'org_unit',
    entity_id: '',
    document_type: 'other',
    description: '',
    folder: 'documents'
  });
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterEntity, setFilterEntity] = useState('');
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [contextMenuDocument, setContextMenuDocument] = useState<Document | null>(null);
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [entitySearchTerm, setEntitySearchTerm] = useState('');
  const [entityDialogOpen, setEntityDialogOpen] = useState(false);
  const [entities, setEntities] = useState<any[]>([]);
  const [loadingEntities, setLoadingEntities] = useState(false);
  const [manualEntityId, setManualEntityId] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { 
    documents, 
    loading, 
    error, 
    createDocument, 
    updateDocument, 
    deleteDocument, 
    refetch 
  } = useDocuments({
    filters: {
      is_active: true,
      ...(filterType && { document_type: filterType }),
      ...(filterEntity && { entity_type: filterEntity })
    }
  });

  // Filter documents based on search term
  const filteredDocuments = documents.filter(doc => 
    doc.original_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.document_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Auto-detect document type from file extension
      const fileType = getFileTypeFromMime(file.type);
      setUploadForm(prev => ({
        ...prev,
        document_type: fileType
      }));
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('entity_type', uploadForm.entity_type);
      formData.append('entity_id', uploadForm.entity_id);
      formData.append('document_type', uploadForm.document_type);
      formData.append('description', uploadForm.description);
      formData.append('folder', uploadForm.folder);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setUploadDialogOpen(false);
        setSelectedFile(null);
        setUploadForm({
          entity_type: 'org_unit',
          entity_id: '',
          document_type: 'other',
          description: '',
          folder: 'documents'
        });
        await refetch();
      } else {
        alert('Upload failed: ' + result.error);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (document: Document, hardDelete = false) => {
    if (confirm(hardDelete ? 'Are you sure you want to permanently delete this document?' : 'Are you sure you want to delete this document?')) {
      const success = await deleteDocument(document.id);
      if (success) {
        await refetch();
      }
    }
  };

  const handleViewDocument = (document: Document) => {
    setSelectedDocument(document);
    setViewDialogOpen(true);
  };

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

  const handleContextMenu = (event: React.MouseEvent, document: Document) => {
    event.preventDefault();
    setAnchorEl(event.currentTarget as HTMLElement);
    setContextMenuDocument(document);
  };

  const handleContextMenuClose = () => {
    setAnchorEl(null);
    setContextMenuDocument(null);
  };

  const fetchEntities = async (entityType: string) => {
    if (!entityType) return;
    
    setLoadingEntities(true);
    try {
      let url = '';
      switch (entityType) {
        case 'org_unit':
          // Try org units first, fallback to majors if no permission
          url = '/api/org/units';
          break;
        case 'course':
          url = '/api/tms/courses/list';
          break;
        case 'major':
          url = '/api/tms/majors';
          break;
        case 'program':
          url = '/api/tms/programs/list';
          break;
        case 'employee':
          url = '/api/hr/employees';
          break;
        default:
          setEntities([]);
          return;
      }

      const response = await fetch(url);
      const result = await response.json();
      
      if (result.success) {
        // Handle different data structures
        let entitiesData = [];
        if (result.data?.items) {
          entitiesData = result.data.items;
        } else if (Array.isArray(result.data)) {
          entitiesData = result.data;
        } else if (result.data) {
          entitiesData = [result.data];
        }
        
        setEntities(entitiesData);
      } else {
        // Fallback for org_unit if no permission
        if (entityType === 'org_unit') {
          // Try to get org units from majors data
          const majorsResponse = await fetch('/api/tms/majors');
          const majorsResult = await majorsResponse.json();
          if (majorsResult.success && majorsResult.data?.items) {
            const orgUnits = majorsResult.data.items
              .map((major: any) => major.OrgUnit)
              .filter((orgUnit: any) => orgUnit)
              .reduce((acc: any[], orgUnit: any) => {
                if (!acc.find((item: any) => item.id === orgUnit.id)) {
                  acc.push(orgUnit);
                }
                return acc;
              }, []);
            setEntities(orgUnits);
          } else {
            setEntities([]);
          }
        } else {
          setEntities([]);
        }
      }
    } catch (error) {
      console.error('Error fetching entities:', error);
      setEntities([]);
    } finally {
      setLoadingEntities(false);
    }
  };


  const handleEntitySelect = (entity: any) => {
    setUploadForm(prev => ({ ...prev, entity_id: entity.id.toString() }));
    setEntityDialogOpen(false);
    setEntitySearchTerm('');
  };

  const getEntityDisplayName = (entityId: string) => {
    const entity = entities.find(e => e.id.toString() === entityId);
    if (!entity) return entityId;
    return entity.name || entity.name_vi || entity.name_en || entity.code || entity.title || entity.label || entityId;
  };

  const handleManualIdSubmit = () => {
    if (manualEntityId.trim()) {
      setUploadForm(prev => ({ ...prev, entity_id: manualEntityId.trim() }));
      setEntityDialogOpen(false);
      setManualEntityId('');
      setShowManualInput(false);
    }
  };

  const handleEntityTypeChange = (entityType: string) => {
    setUploadForm(prev => ({ ...prev, entity_type: entityType, entity_id: '' }));
    setEntitySearchTerm('');
    setManualEntityId('');
    setShowManualInput(false);
    fetchEntities(entityType);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Quản lý tài liệu
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Box sx={{ display: 'flex', border: 1, borderColor: 'divider', borderRadius: 1 }}>
            <Button
              variant={viewMode === 'card' ? 'contained' : 'text'}
              size="small"
              onClick={() => setViewMode('card')}
              sx={{ minWidth: 'auto', px: 1 }}
            >
              <CardViewIcon />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'contained' : 'text'}
              size="small"
              onClick={() => setViewMode('list')}
              sx={{ minWidth: 'auto', px: 1 }}
            >
              <ListViewIcon />
            </Button>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setUploadDialogOpen(true)}
          >
            Upload tài liệu
          </Button>
        </Box>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <TextField
              fullWidth
              placeholder="Tìm kiếm tài liệu..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <FormControl fullWidth>
              <InputLabel>Loại tài liệu</InputLabel>
              <Select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                label="Loại tài liệu"
              >
                <MenuItem value="">Tất cả</MenuItem>
                {Object.entries(DOCUMENT_TYPES).map(([key, value]) => (
                  <MenuItem key={key} value={value}>
                    {value}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <FormControl fullWidth>
              <InputLabel>Entity</InputLabel>
              <Select
                value={filterEntity}
                onChange={(e) => setFilterEntity(e.target.value)}
                label="Entity"
              >
                <MenuItem value="">Tất cả</MenuItem>
                {Object.entries(ENTITY_TYPES).map(([key, value]) => (
                  <MenuItem key={key} value={value}>
                    {value}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<FilterIcon />}
              onClick={() => {
                setSearchTerm('');
                setFilterType('');
                setFilterEntity('');
              }}
            >
              Reset
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Documents Grid */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {viewMode === 'card' ? (
        <Grid container spacing={3}>
          {filteredDocuments.map((document) => (
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={document.id.toString()}>
              <Card 
                sx={{ 
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  '&:hover': {
                    boxShadow: 3
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
                            whiteSpace: 'nowrap',
                            cursor: 'pointer',
                            color: 'primary.main',
                            '&:hover': {
                              textDecoration: 'underline'
                            }
                          }}
                          onClick={() => window.open(document.file_url, '_blank')}
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
                      onClick={(e) => handleContextMenu(e, document)}
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
      ) : (
        <Paper>
          <List>
            {filteredDocuments.map((document) => (
              <ListItem
                key={document.id.toString()}
                sx={{
                  borderBottom: 1,
                  borderColor: 'divider',
                  '&:hover': {
                    backgroundColor: 'action.hover'
                  }
                }}
                onContextMenu={(e) => handleContextMenu(e, document)}
              >
                <Avatar
                  sx={{
                    bgcolor: getDocumentColor(document.document_type),
                    mr: 2
                  }}
                >
                  {getDocumentIconComponent(document.document_type, document.mime_type || undefined)}
                </Avatar>
                <ListItemText
                  primary={
                    <Typography
                      variant="subtitle1"
                      sx={{
                        cursor: 'pointer',
                        color: 'primary.main',
                        '&:hover': {
                          textDecoration: 'underline'
                        }
                      }}
                      onClick={() => window.open(document.file_url, '_blank')}
                    >
                      {document.original_name || document.file_name}
                    </Typography>
                  }
                  secondary={
                    <Box>
                      <Box sx={{ display: 'flex', gap: 1, mb: 0.5 }}>
                        <Chip label={document.document_type} size="small" />
                        <Typography variant="caption" color="text.secondary">
                          {document.file_size ? formatFileSize(Number(document.file_size)) : 'Unknown size'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {document.uploaded_at ? new Date(document.uploaded_at).toLocaleDateString() : ''}
                        </Typography>
                      </Box>
                      {document.description && (
                        <Typography variant="body2" color="text.secondary">
                          {document.description}
                        </Typography>
                      )}
                    </Box>
                  }
                />
                <ListItemSecondaryAction>
                  <IconButton
                    size="small"
                    onClick={(e) => handleContextMenu(e, document)}
                  >
                    <MoreIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </Paper>
      )}

      {filteredDocuments.length === 0 && !loading && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <DocumentIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            Không có tài liệu nào
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Hãy upload tài liệu đầu tiên của bạn
          </Typography>
          <Button
            variant="contained"
            startIcon={<UploadIcon />}
            onClick={() => setUploadDialogOpen(true)}
          >
            Upload tài liệu
          </Button>
        </Box>
      )}

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onClose={() => setUploadDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Upload tài liệu mới</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              style={{ display: 'none' }}
              accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.rar"
            />
            
            <Button
              fullWidth
              variant="outlined"
              startIcon={<CloudUploadIcon />}
              onClick={() => fileInputRef.current?.click()}
              sx={{ mb: 3, py: 2 }}
            >
              {selectedFile ? selectedFile.name : 'Chọn file để upload'}
            </Button>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }}>
                <FormControl fullWidth>
                  <InputLabel>Entity Type</InputLabel>
                  <Select
                    value={uploadForm.entity_type}
                    onChange={(e) => handleEntityTypeChange(e.target.value)}
                    label="Entity Type"
                  >
                    {Object.entries(ENTITY_TYPES).map(([key, value]) => (
                      <MenuItem key={key} value={value}>
                        {value}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Entity"
                  value={uploadForm.entity_id ? getEntityDisplayName(uploadForm.entity_id) : ''}
                  onClick={() => setEntityDialogOpen(true)}
                  InputProps={{
                    readOnly: true,
                    endAdornment: (
                      <InputAdornment position="end">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                  placeholder="Chọn entity..."
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <FormControl fullWidth>
                  <InputLabel>Document Type</InputLabel>
                  <Select
                    value={uploadForm.document_type}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, document_type: e.target.value }))}
                    label="Document Type"
                  >
                    {Object.entries(DOCUMENT_TYPES).map(([key, value]) => (
                      <MenuItem key={key} value={value}>
                        {value}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Mô tả"
                  multiline
                  rows={3}
                  value={uploadForm.description}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialogOpen(false)}>Hủy</Button>
          <Button
            onClick={handleUpload}
            variant="contained"
            disabled={!selectedFile || uploading}
            startIcon={uploading ? <CircularProgress size={20} /> : <UploadIcon />}
          >
            {uploading ? 'Đang upload...' : 'Upload'}
          </Button>
        </DialogActions>
      </Dialog>

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
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="subtitle2" gutterBottom>Loại tài liệu:</Typography>
                  <Chip label={selectedDocument.document_type} />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="subtitle2" gutterBottom>Kích thước:</Typography>
                  <Typography variant="body2">
                    {selectedDocument.file_size ? formatFileSize(Number(selectedDocument.file_size)) : 'Unknown'}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="subtitle2" gutterBottom>Entity:</Typography>
                  <Typography variant="body2">
                    {selectedDocument.entity_type} - {selectedDocument.entity_id.toString()}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="subtitle2" gutterBottom>Upload bởi:</Typography>
                  <Typography variant="body2">
                    {selectedDocument.uploaded_by ? `User ID: ${selectedDocument.uploaded_by}` : 'Unknown'}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Typography variant="subtitle2" gutterBottom>Mô tả:</Typography>
                  <Typography variant="body2">
                    {selectedDocument.description || 'Không có mô tả'}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12 }}>
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
              <ViewIcon fontSize="small" color="secondary"/>
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
              <DownloadIcon fontSize="small" color="primary"/>
            </ListItemIcon>
            Tải xuống
          </MenuItem>
          <Divider />
          <MenuItem onClick={() => {
            if (contextMenuDocument) {
              handleDelete(contextMenuDocument, false);
            }
            handleContextMenuClose();
          }}>
            <ListItemIcon>
              <DeleteIcon fontSize="small" color="error"/>
            </ListItemIcon>
            Xóa
          </MenuItem>
        </MenuList>
      </Menu>

      {/* Entity Selection Dialog */}
      <Dialog open={entityDialogOpen} onClose={() => setEntityDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Chọn {uploadForm.entity_type}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <TextField
              fullWidth
              placeholder="Tìm kiếm..."
              value={entitySearchTerm}
              onChange={(e) => setEntitySearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
            <Button
              variant="outlined"
              onClick={() => setShowManualInput(!showManualInput)}
              sx={{ minWidth: 'auto', px: 2 }}
            >
              Nhập ID
            </Button>
          </Box>
          
          {showManualInput && (
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <TextField
                fullWidth
                label="Entity ID"
                placeholder="Nhập ID thủ công..."
                value={manualEntityId}
                onChange={(e) => setManualEntityId(e.target.value)}
                type="number"
              />
              <Button
                variant="contained"
                onClick={handleManualIdSubmit}
                disabled={!manualEntityId.trim()}
                sx={{ minWidth: 'auto', px: 2 }}
              >
                Chọn
              </Button>
            </Box>
          )}
          
          {loadingEntities ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          ) : (
            <List>
              {entities
                .filter(entity => {
                  const searchTerm = entitySearchTerm.toLowerCase();
                  return (
                    entity.name?.toLowerCase().includes(searchTerm) ||
                    entity.name_vi?.toLowerCase().includes(searchTerm) ||
                    entity.name_en?.toLowerCase().includes(searchTerm) ||
                    entity.code?.toLowerCase().includes(searchTerm) ||
                    entity.title?.toLowerCase().includes(searchTerm) ||
                    entity.label?.toLowerCase().includes(searchTerm)
                  );
                })
                .map((entity) => (
                  <ListItem
                    key={entity.id}
                    component="button"
                    onClick={() => handleEntitySelect(entity)}
                    sx={{
                      cursor: 'pointer',
                      '&:hover': {
                        backgroundColor: 'action.hover'
                      }
                    }}
                  >
                    <ListItemText
                      secondary={
                        <>
                          {entity.name || entity.name_vi || entity.name_en || entity.title || entity.code || entity.label || `ID: ${entity.id}`}
                          <br />
                          {entity.code || entity.description || entity.email || entity.type || entity.status}
                        </>
                      }
                    />
                  </ListItem>
                ))}
            </List>
          )}
          
          {entities.length === 0 && !loadingEntities && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body2" color="text.secondary">
                Không có dữ liệu
              </Typography>
            </Box>
          )}
          
          {entities.length > 0 && entities.filter(entity => {
            const searchTerm = entitySearchTerm.toLowerCase();
            return (
              entity.name?.toLowerCase().includes(searchTerm) ||
              entity.name_vi?.toLowerCase().includes(searchTerm) ||
              entity.name_en?.toLowerCase().includes(searchTerm) ||
              entity.code?.toLowerCase().includes(searchTerm) ||
              entity.title?.toLowerCase().includes(searchTerm) ||
              entity.label?.toLowerCase().includes(searchTerm)
            );
          }).length === 0 && entitySearchTerm && !loadingEntities && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body2" color="text.secondary">
                Không tìm thấy kết quả phù hợp
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Thử tìm kiếm khác hoặc nhập ID thủ công
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEntityDialogOpen(false)}>Đóng</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
