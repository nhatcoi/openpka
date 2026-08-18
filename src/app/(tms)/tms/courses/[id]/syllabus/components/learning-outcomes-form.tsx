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
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Autocomplete,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
} from '@mui/icons-material';

export interface CLOItem {
  id: string;
  code: string;
  description: string;
  plo_mapping?: string[];
}

interface LearningOutcomesFormProps {
  learningOutcomes: CLOItem[];
  onChange: (learningOutcomes: CLOItem[]) => void;
}

export default function LearningOutcomesForm({ learningOutcomes, onChange }: LearningOutcomesFormProps) {
  const [editingCLO, setEditingCLO] = useState<CLOItem | null>(null);
  const [cloDialogOpen, setCloDialogOpen] = useState(false);

  const handleAddCLO = () => {
    setEditingCLO({
      id: `clo-${Date.now()}`,
      code: `CLO${learningOutcomes.length + 1}`,
      description: '',
      plo_mapping: [],
    });
    setCloDialogOpen(true);
  };

  const handleEditCLO = (clo: CLOItem) => {
    setEditingCLO(clo);
    setCloDialogOpen(true);
  };

  const handleDeleteCLO = (id: string) => {
    onChange(learningOutcomes.filter(item => item.id !== id));
  };

  const handleSaveCLO = () => {
    if (!editingCLO?.code || !editingCLO?.description) return;

    if (learningOutcomes.find(c => c.id === editingCLO.id)) {
      // Update existing
      onChange(learningOutcomes.map(c => c.id === editingCLO.id ? editingCLO : c));
    } else {
      // Add new
      onChange([...learningOutcomes, editingCLO]);
    }
    setCloDialogOpen(false);
    setEditingCLO(null);
  };

  return (
    <>
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">
              Mục tiêu học tập (Course Learning Outcomes - CLO)
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddCLO}
            >
              Thêm CLO
            </Button>
          </Box>

          {learningOutcomes.length === 0 ? (
            <Alert severity="info" sx={{ mb: 2 }}>
              Chưa có mục tiêu học tập nào. Nhấn "Thêm CLO" để bắt đầu.
            </Alert>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {learningOutcomes.map((clo) => (
                <Card key={clo.id} variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                          {clo.code}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {clo.description || 'Chưa có mô tả'}
                        </Typography>
                        {clo.plo_mapping && clo.plo_mapping.length > 0 && (
                          <Box sx={{ mt: 1, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                            {clo.plo_mapping.map((plo, idx) => (
                              <Chip key={idx} label={plo} size="small" variant="outlined" />
                            ))}
                          </Box>
                        )}
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          size="small"
                          startIcon={<EditIcon />}
                          onClick={() => handleEditCLO(clo)}
                        >
                          Sửa
                        </Button>
                        <Button
                          size="small"
                          color="error"
                          startIcon={<DeleteIcon />}
                          onClick={() => handleDeleteCLO(clo.id)}
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

      {/* CLO Edit Dialog */}
      <Dialog open={cloDialogOpen} onClose={() => setCloDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingCLO?.id && learningOutcomes.find(c => c.id === editingCLO.id) ? 'Sửa CLO' : 'Thêm CLO mới'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <TextField
              fullWidth
              label="Mã CLO"
              value={editingCLO?.code || ''}
              onChange={(e) => setEditingCLO(editingCLO ? { ...editingCLO, code: e.target.value } : null)}
              placeholder="VD: CLO1, CLO2..."
              required
            />
            <TextField
              fullWidth
              label="Mô tả mục tiêu học tập"
              multiline
              rows={4}
              value={editingCLO?.description || ''}
              onChange={(e) => setEditingCLO(editingCLO ? { ...editingCLO, description: e.target.value } : null)}
              placeholder="Mô tả chi tiết mục tiêu học tập mà sinh viên cần đạt được..."
              required
            />
            <Autocomplete
              multiple
              freeSolo
              options={[]}
              value={editingCLO?.plo_mapping || []}
              onChange={(_, newValue) => setEditingCLO(editingCLO ? { ...editingCLO, plo_mapping: newValue } : null)}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip variant="outlined" label={option} {...getTagProps({ index })} />
                ))
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Mapping với PLO (Program Learning Outcomes)"
                  placeholder="Nhập mã PLO (VD: PLO1, PLO2...)"
                  helperText="Nhập mã PLO mà CLO này đóng góp vào"
                />
              )}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setCloDialogOpen(false);
            setEditingCLO(null);
          }}>
            Hủy
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveCLO}
            disabled={!editingCLO?.code || !editingCLO?.description}
          >
            Lưu
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

