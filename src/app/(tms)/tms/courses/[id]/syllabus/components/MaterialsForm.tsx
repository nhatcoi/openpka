'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Chip,
  LinearProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Link,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  Description as DescriptionIcon,
} from '@mui/icons-material';
import { DOCUMENT_TYPES, ENTITY_TYPES } from '@/types/documents';

export interface MaterialDocument {
  id: string;
  entity_type: string;
  entity_id: string;
  document_type: string;
  file_name: string;
  original_name?: string;
  file_url: string;
  file_size?: string;
  mime_type?: string;
  description?: string;
  uploaded_at?: string;
  is_active?: boolean;
}

interface MaterialsFormProps {
  syllabusId?: string;
  courseVersionId?: string;
  courseId: string;
}

export default function MaterialsForm({ syllabusId, courseVersionId, courseId }: MaterialsFormProps) {
  const [documents, setDocuments] = useState<MaterialDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editingDocument, setEditingDocument] = useState<MaterialDocument | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<string>('syllabus');
  const [description, setDescription] = useState<string>('');

  // Fetch documents
  const fetchDocuments = async () => {
    if (!syllabusId && !courseVersionId) return;

    try {
      setLoading(true);
      // Use syllabus_id as entity_id if available, otherwise use course_version_id
      const entityId = syllabusId || courseVersionId || '';
      const entityType = 'course_syllabus'; // or 'course_version' if needed

      const response = await fetch(
        `/api/documents/entity/${entityType}/${entityId}?is_active=true`
      );
      const result = await response.json();

      if (result.success) {
        setDocuments(result.data.documents || []);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (syllabusId || courseVersionId) {
      fetchDocuments();
    }
  }, [syllabusId, courseVersionId]);

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        alert('File size too large. Maximum size is 10MB.');
        return;
      }
      setSelectedFile(file);
    }
  };

  // Upload document
  const handleUpload = async () => {
    if (!selectedFile || !documentType) {
      alert('Vui lòng chọn file và loại tài liệu');
      return;
    }

    if (!syllabusId && !courseVersionId) {
      alert('Chưa có syllabus hoặc course version');
      return;
    }

    try {
      setUploading(true);

      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('entity_type', 'course_syllabus');
      formData.append('entity_id', syllabusId || courseVersionId || '');
      formData.append('document_type', documentType);
      if (description) {
        formData.append('description', description);
      }
      formData.append('folder', `documents/course_syllabus/${courseId}`);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setUploadDialogOpen(false);
        setSelectedFile(null);
        setDocumentType('syllabus');
        setDescription('');
        await fetchDocuments();
      } else {
        alert(result.error || 'Lỗi khi upload file');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Lỗi khi upload file');
    } finally {
      setUploading(false);
    }
  };

  // Update document
  const handleUpdate = async () => {
    if (!editingDocument) return;

    try {
      const response = await fetch(`/api/documents/${editingDocument.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          document_type: editingDocument.document_type,
          description: editingDocument.description,
          is_active: editingDocument.is_active,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setDialogOpen(false);
        setEditingDocument(null);
        await fetchDocuments();
      } else {
        alert(result.error || 'Lỗi khi cập nhật tài liệu');
      }
    } catch (error) {
      console.error('Error updating document:', error);
      alert('Lỗi khi cập nhật tài liệu');
    }
  };

  // Delete document
  const handleDelete = async (documentId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa tài liệu này?')) {
      return;
    }

    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        await fetchDocuments();
      } else {
        alert(result.error || 'Lỗi khi xóa tài liệu');
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('Lỗi khi xóa tài liệu');
    }
  };

  // Format file size
  const formatFileSize = (bytes?: string) => {
    if (!bytes) return 'N/A';
    const size = parseInt(bytes);
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`;
    return `${(size / (1024 * 1024)).toFixed(2)} MB`;
  };

  // Get document type label
  const getDocumentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      syllabus: 'Đề cương',
      textbook: 'Sách giáo khoa',
      reference: 'Tài liệu tham khảo',
      assignment: 'Bài tập',
      exam: 'Đề thi',
      other: 'Khác',
    };
    return labels[type] || type;
  };

  return (
    <>
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">
              Tài liệu (Materials)
            </Typography>
            <Button
              variant="contained"
              startIcon={<UploadIcon />}
              onClick={() => setUploadDialogOpen(true)}
              disabled={!syllabusId && !courseVersionId}
            >
              Upload tài liệu
            </Button>
          </Box>

          {!syllabusId && !courseVersionId && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Vui lòng lưu đề cương trước khi upload tài liệu.
            </Alert>
          )}

          {loading ? (
            <LinearProgress />
          ) : documents.length === 0 ? (
            <Alert severity="info" sx={{ mb: 2 }}>
              Chưa có tài liệu nào. Nhấn "Upload tài liệu" để thêm tài liệu mới.
            </Alert>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {documents.map((doc) => (
                <Card key={doc.id} variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                          <DescriptionIcon color="action" />
                          {doc.file_url ? (
                            <Link
                              href={doc.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(doc.file_url, '_blank', 'noopener,noreferrer');
                              }}
                              sx={{
                                textDecoration: 'none',
                                color: 'inherit',
                                cursor: 'pointer',
                                '&:hover': {
                                  textDecoration: 'underline',
                                  color: 'primary.main',
                                },
                              }}
                            >
                              <Typography variant="subtitle1" fontWeight="bold" component="span">
                                {doc.original_name || doc.file_name}
                              </Typography>
                            </Link>
                          ) : (
                            <Typography variant="subtitle1" fontWeight="bold">
                              {doc.original_name || doc.file_name}
                            </Typography>
                          )}
                          <Chip
                            label={getDocumentTypeLabel(doc.document_type)}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        </Box>
                        {doc.description && (
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            {doc.description}
                          </Typography>
                        )}
                        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                          <Typography variant="body2" color="text.secondary">
                            Kích thước: {formatFileSize(doc.file_size)}
                          </Typography>
                          {doc.uploaded_at && (
                            <Typography variant="body2" color="text.secondary">
                              Upload: {new Date(doc.uploaded_at).toLocaleDateString('vi-VN')}
                            </Typography>
                          )}
                        </Box>
                        {doc.file_url && (
                          <Link
                            href={doc.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{ mt: 1, display: 'inline-flex', alignItems: 'center', gap: 0.5 }}
                          >
                            <DownloadIcon fontSize="small" />
                            Tải xuống
                          </Link>
                        )}
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton
                          size="small"
                          onClick={() => {
                            setEditingDocument(doc);
                            setDialogOpen(true);
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDelete(doc.id)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onClose={() => setUploadDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Upload tài liệu mới</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <Button
              variant="outlined"
              component="label"
              startIcon={<UploadIcon />}
              fullWidth
            >
              Chọn file
              <input
                type="file"
                hidden
                onChange={handleFileSelect}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif"
              />
            </Button>
            {selectedFile && (
              <Typography variant="body2" color="text.secondary">
                File đã chọn: {selectedFile.name} ({formatFileSize(selectedFile.size.toString())})
              </Typography>
            )}

            <FormControl fullWidth required>
              <InputLabel>Loại tài liệu</InputLabel>
              <Select
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                label="Loại tài liệu"
              >
                <MenuItem value="syllabus">Đề cương</MenuItem>
                <MenuItem value="textbook">Sách giáo khoa</MenuItem>
                <MenuItem value="reference">Tài liệu tham khảo</MenuItem>
                <MenuItem value="assignment">Bài tập</MenuItem>
                <MenuItem value="exam">Đề thi</MenuItem>
                <MenuItem value="other">Khác</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Mô tả (tùy chọn)"
              multiline
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả về tài liệu này..."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setUploadDialogOpen(false);
            setSelectedFile(null);
            setDescription('');
          }}>
            Hủy
          </Button>
          <Button
            variant="contained"
            onClick={handleUpload}
            disabled={!selectedFile || !documentType || uploading}
          >
            {uploading ? 'Đang upload...' : 'Upload'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Sửa thông tin tài liệu</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Loại tài liệu</InputLabel>
              <Select
                value={editingDocument?.document_type || ''}
                onChange={(e) => setEditingDocument(editingDocument ? { ...editingDocument, document_type: e.target.value } : null)}
                label="Loại tài liệu"
              >
                <MenuItem value="syllabus">Đề cương</MenuItem>
                <MenuItem value="textbook">Sách giáo khoa</MenuItem>
                <MenuItem value="reference">Tài liệu tham khảo</MenuItem>
                <MenuItem value="assignment">Bài tập</MenuItem>
                <MenuItem value="exam">Đề thi</MenuItem>
                <MenuItem value="other">Khác</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Mô tả"
              multiline
              rows={3}
              value={editingDocument?.description || ''}
              onChange={(e) => setEditingDocument(editingDocument ? { ...editingDocument, description: e.target.value } : null)}
              placeholder="Mô tả về tài liệu này..."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setDialogOpen(false);
            setEditingDocument(null);
          }}>
            Hủy
          </Button>
          <Button
            variant="contained"
            onClick={handleUpdate}
            disabled={!editingDocument}
          >
            Lưu
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

