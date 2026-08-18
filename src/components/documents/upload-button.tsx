'use client';

import React, { useState, useRef } from 'react';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Alert,
  CircularProgress,
  Typography,
  LinearProgress,
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  Upload as UploadIcon,
} from '@mui/icons-material';
import { ENTITY_TYPES, DOCUMENT_TYPES } from '@/types/documents';
import { getFileTypeFromMime } from '@/lib/cloudinary-client';

interface UploadButtonProps {
  onUploadSuccess?: () => void;
  entityType?: string;
  entityId?: string;
  folder?: string;
}

export default function UploadButton({ 
  onUploadSuccess, 
  entityType = 'org_unit', 
  entityId = '1',
  folder = 'documents'
}: UploadButtonProps) {
  const [open, setOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    entity_type: entityType,
    entity_id: entityId,
    document_type: 'other',
    description: '',
    folder: folder
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError(null);
      
      // Auto-detect document type from file extension
      const detectedType = getFileTypeFromMime(file.type);
      setForm(prev => ({ ...prev, document_type: detectedType }));
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('entity_type', form.entity_type);
      formData.append('entity_id', form.entity_id);
      formData.append('document_type', form.document_type);
      formData.append('description', form.description);
      formData.append('folder', form.folder);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      const result = await response.json();

      if (result.success) {
        setOpen(false);
        setSelectedFile(null);
        setForm({
          entity_type: entityType,
          entity_id: entityId,
          document_type: 'other',
          description: '',
          folder: folder
        });
        setUploadProgress(0);
        onUploadSuccess?.();
      } else {
        setError(result.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setError('Upload failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    if (!uploading) {
      setOpen(false);
      setSelectedFile(null);
      setError(null);
      setUploadProgress(0);
    }
  };

  return (
    <>
      <Button
        variant="contained"
        startIcon={<UploadIcon />}
        onClick={() => setOpen(true)}
      >
        Upload tài liệu
      </Button>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <CloudUploadIcon sx={{ mr: 1 }} />
            Upload tài liệu mới
          </Box>
        </DialogTitle>
        
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
              disabled={uploading}
            >
              {selectedFile ? selectedFile.name : 'Chọn file để upload'}
            </Button>

            {selectedFile && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Kích thước: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Loại: {selectedFile.type || 'Unknown'}
                </Typography>
              </Box>
            )}

            {uploading && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" gutterBottom>
                  Đang upload... {uploadProgress}%
                </Typography>
                <LinearProgress variant="determinate" value={uploadProgress} />
              </Box>
            )}

            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Entity Type</InputLabel>
                <Select
                  value={form.entity_type}
                  onChange={(e) => setForm(prev => ({ ...prev, entity_type: e.target.value }))}
                  label="Entity Type"
                  disabled={uploading}
                >
                  {Object.entries(ENTITY_TYPES).map(([key, value]) => (
                    <MenuItem key={key} value={value}>
                      {value}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <TextField
                fullWidth
                label="Entity ID"
                value={form.entity_id}
                onChange={(e) => setForm(prev => ({ ...prev, entity_id: e.target.value }))}
                type="number"
                disabled={uploading}
              />
            </Box>

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Document Type</InputLabel>
              <Select
                value={form.document_type}
                onChange={(e) => setForm(prev => ({ ...prev, document_type: e.target.value }))}
                label="Document Type"
                disabled={uploading}
              >
                {Object.entries(DOCUMENT_TYPES).map(([key, value]) => (
                  <MenuItem key={key} value={value}>
                    {value}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Mô tả"
              multiline
              rows={3}
              value={form.description}
              onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
              disabled={uploading}
            />
          </Box>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleClose} disabled={uploading}>
            Hủy
          </Button>
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
    </>
  );
}
