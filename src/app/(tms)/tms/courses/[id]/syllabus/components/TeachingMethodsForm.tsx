'use client';

import React, { useState } from 'react';
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
  Chip,
  Autocomplete,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
} from '@mui/icons-material';

export interface TeachingMethod {
  id?: string;
  method: string;
  description?: string;
  frequency?: string;
  duration?: string;
}

interface TeachingMethodsFormProps {
  teachingMethods: TeachingMethod[];
  generalDescription?: string;
  onChange: (teachingMethods: TeachingMethod[], generalDescription?: string) => void;
}

export default function TeachingMethodsForm({ teachingMethods, generalDescription, onChange }: TeachingMethodsFormProps) {
  const [editingMethod, setEditingMethod] = useState<TeachingMethod | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [localDescription, setLocalDescription] = useState(generalDescription || '');

  const commonMethods = [
    'Thuyết trình',
    'Thảo luận nhóm',
    'Làm việc nhóm',
    'Thực hành/Lab',
    'Case study',
    'Project-based learning',
    'Flipped classroom',
    'Problem-based learning',
    'E-learning',
    'Seminar',
    'Workshop',
    'Field trip',
    'Guest lecture',
  ];

  const handleAddMethod = () => {
    setEditingMethod({
      method: '',
      description: '',
      frequency: '',
      duration: '',
    });
    setDialogOpen(true);
  };

  const handleEditMethod = (method: TeachingMethod) => {
    setEditingMethod({ ...method });
    setDialogOpen(true);
  };

  const handleDeleteMethod = (index: number) => {
    onChange(teachingMethods.filter((_, i) => i !== index), localDescription);
  };

  const handleSaveMethod = () => {
    if (!editingMethod?.method) return;

    const methodId = editingMethod.id || `method-${Date.now()}`;
    const updatedMethod = { ...editingMethod, id: methodId };

    if (teachingMethods.find(m => m.id === methodId)) {
      // Update existing
      onChange(teachingMethods.map(m => m.id === methodId ? updatedMethod : m), localDescription);
    } else {
      // Add new
      onChange([...teachingMethods, updatedMethod], localDescription);
    }
    setDialogOpen(false);
    setEditingMethod(null);
  };

  const handleDescriptionChange = (value: string) => {
    setLocalDescription(value);
    onChange(teachingMethods, value);
  };

  return (
    <>
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">
              Phương pháp giảng dạy (Teaching Methods)
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddMethod}
            >
              Thêm phương pháp
            </Button>
          </Box>

          <TextField
            fullWidth
            label="Mô tả chung về phương pháp giảng dạy"
            multiline
            rows={3}
            value={localDescription}
            onChange={(e) => handleDescriptionChange(e.target.value)}
            placeholder="Mô tả tổng quan về phương pháp giảng dạy được sử dụng trong môn học..."
            sx={{ mb: 3 }}
          />

          {teachingMethods.length === 0 ? (
            <Alert severity="info" sx={{ mb: 2 }}>
              Chưa có phương pháp giảng dạy nào. Nhấn "Thêm phương pháp" để bắt đầu.
            </Alert>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {teachingMethods.map((method, index) => (
                <Card key={method.id || index} variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                          {method.method}
                        </Typography>
                        {method.description && (
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            {method.description}
                          </Typography>
                        )}
                        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                          {method.frequency && (
                            <Typography variant="body2" color="text.secondary">
                              <strong>Tần suất:</strong> {method.frequency}
                            </Typography>
                          )}
                          {method.duration && (
                            <Typography variant="body2" color="text.secondary">
                              <strong>Thời lượng:</strong> {method.duration}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          size="small"
                          startIcon={<EditIcon />}
                          onClick={() => handleEditMethod(method)}
                        >
                          Sửa
                        </Button>
                        <Button
                          size="small"
                          color="error"
                          startIcon={<DeleteIcon />}
                          onClick={() => handleDeleteMethod(index)}
                        >
                          Xóa
                        </Button>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Method Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingMethod?.id && teachingMethods.find(m => m.id === editingMethod.id) ? 'Sửa phương pháp giảng dạy' : 'Thêm phương pháp giảng dạy mới'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <Autocomplete
              freeSolo
              options={commonMethods}
              value={editingMethod?.method || ''}
              onChange={(_, newValue) => setEditingMethod(editingMethod ? { ...editingMethod, method: newValue || '' } : null)}
              onInputChange={(_, newInputValue) => setEditingMethod(editingMethod ? { ...editingMethod, method: newInputValue } : null)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Phương pháp giảng dạy"
                  placeholder="Chọn hoặc nhập phương pháp..."
                  required
                />
              )}
            />

            <TextField
              fullWidth
              label="Mô tả"
              multiline
              rows={3}
              value={editingMethod?.description || ''}
              onChange={(e) => setEditingMethod(editingMethod ? { ...editingMethod, description: e.target.value } : null)}
              placeholder="Mô tả chi tiết về cách áp dụng phương pháp này..."
            />

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 2 }}>
              <TextField
                fullWidth
                label="Tần suất"
                value={editingMethod?.frequency || ''}
                onChange={(e) => setEditingMethod(editingMethod ? { ...editingMethod, frequency: e.target.value } : null)}
                placeholder="VD: Mỗi tuần, 2 lần/tuần, Theo từng chương..."
              />
              <TextField
                fullWidth
                label="Thời lượng"
                value={editingMethod?.duration || ''}
                onChange={(e) => setEditingMethod(editingMethod ? { ...editingMethod, duration: e.target.value } : null)}
                placeholder="VD: 2 giờ, 1 buổi học..."
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setDialogOpen(false);
            setEditingMethod(null);
          }}>
            Hủy
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveMethod}
            disabled={!editingMethod?.method}
          >
            Lưu
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

