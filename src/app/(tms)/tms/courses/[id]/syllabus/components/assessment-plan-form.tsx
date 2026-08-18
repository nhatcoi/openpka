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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
} from '@mui/icons-material';

export interface AssessmentComponent {
  id?: string;
  name: string;
  type: string;
  weight: number;
  description?: string;
  criteria?: string;
}

interface AssessmentPlanFormProps {
  assessmentPlan: AssessmentComponent[];
  onChange: (assessmentPlan: AssessmentComponent[]) => void;
}

export default function AssessmentPlanForm({ assessmentPlan, onChange }: AssessmentPlanFormProps) {
  const [editingComponent, setEditingComponent] = useState<AssessmentComponent | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleAddComponent = () => {
    setEditingComponent({
      name: '',
      type: 'assignment',
      weight: 0,
      description: '',
      criteria: '',
    });
    setDialogOpen(true);
  };

  const handleEditComponent = (component: AssessmentComponent) => {
    setEditingComponent({ ...component });
    setDialogOpen(true);
  };

  const handleDeleteComponent = (index: number) => {
    onChange(assessmentPlan.filter((_, i) => i !== index));
  };

  const handleSaveComponent = () => {
    if (!editingComponent?.name || !editingComponent?.type) return;

    const componentId = editingComponent.id || `assessment-${Date.now()}`;
    const updatedComponent = { ...editingComponent, id: componentId };

    if (assessmentPlan.find(c => c.id === componentId)) {
      // Update existing
      onChange(assessmentPlan.map(c => c.id === componentId ? updatedComponent : c));
    } else {
      // Add new
      onChange([...assessmentPlan, updatedComponent]);
    }
    setDialogOpen(false);
    setEditingComponent(null);
  };

  const totalWeight = assessmentPlan.reduce((sum, c) => sum + (c.weight || 0), 0);

  return (
    <>
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box>
              <Typography variant="h6">
                Kế hoạch đánh giá (Assessment Plan)
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Tổng trọng số: {totalWeight}% {totalWeight !== 100 && totalWeight > 0 && (
                  <Typography component="span" color="error" variant="caption">
                    (Cần đạt 100%)
                  </Typography>
                )}
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddComponent}
            >
              Thêm thành phần
            </Button>
          </Box>

          {assessmentPlan.length === 0 ? (
            <Alert severity="info" sx={{ mb: 2 }}>
              Chưa có thành phần đánh giá nào. Nhấn "Thêm thành phần" để bắt đầu.
            </Alert>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {assessmentPlan.map((component, index) => (
                <Card key={component.id || index} variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                          <Typography variant="subtitle1" fontWeight="bold">
                            {component.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {component.type}
                          </Typography>
                          <Typography variant="body2" color="primary" fontWeight="bold">
                            {component.weight}%
                          </Typography>
                        </Box>
                        {component.description && (
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            {component.description}
                          </Typography>
                        )}
                        {component.criteria && (
                          <Typography variant="body2" color="text.secondary">
                            <strong>Tiêu chí:</strong> {component.criteria}
                          </Typography>
                        )}
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          size="small"
                          startIcon={<EditIcon />}
                          onClick={() => handleEditComponent(component)}
                        >
                          Sửa
                        </Button>
                        <Button
                          size="small"
                          color="error"
                          startIcon={<DeleteIcon />}
                          onClick={() => handleDeleteComponent(index)}
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

      {/* Component Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingComponent?.id && assessmentPlan.find(c => c.id === editingComponent.id) ? 'Sửa thành phần đánh giá' : 'Thêm thành phần đánh giá mới'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <TextField
              fullWidth
              label="Tên thành phần"
              value={editingComponent?.name || ''}
              onChange={(e) => setEditingComponent(editingComponent ? { ...editingComponent, name: e.target.value } : null)}
              placeholder="VD: Bài tập về nhà, Kiểm tra giữa kỳ, Thi cuối kỳ..."
              required
            />

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 2 }}>
              <FormControl fullWidth required>
                <InputLabel>Loại đánh giá</InputLabel>
                <Select
                  value={editingComponent?.type || 'assignment'}
                  onChange={(e) => setEditingComponent(editingComponent ? { ...editingComponent, type: e.target.value } : null)}
                  label="Loại đánh giá"
                >
                  <MenuItem value="assignment">Bài tập</MenuItem>
                  <MenuItem value="quiz">Quiz/Kiểm tra ngắn</MenuItem>
                  <MenuItem value="midterm">Kiểm tra giữa kỳ</MenuItem>
                  <MenuItem value="final">Thi cuối kỳ</MenuItem>
                  <MenuItem value="project">Dự án</MenuItem>
                  <MenuItem value="presentation">Thuyết trình</MenuItem>
                  <MenuItem value="participation">Tham gia lớp học</MenuItem>
                  <MenuItem value="other">Khác</MenuItem>
                </Select>
              </FormControl>

              <TextField
                fullWidth
                label="Trọng số (%)"
                type="number"
                value={editingComponent?.weight || 0}
                onChange={(e) => setEditingComponent(editingComponent ? { ...editingComponent, weight: parseFloat(e.target.value) || 0 } : null)}
                required
                inputProps={{ min: 0, max: 100, step: 0.1 }}
                helperText={`Tổng trọng số hiện tại: ${totalWeight}%`}
              />
            </Box>

            <TextField
              fullWidth
              label="Mô tả"
              multiline
              rows={3}
              value={editingComponent?.description || ''}
              onChange={(e) => setEditingComponent(editingComponent ? { ...editingComponent, description: e.target.value } : null)}
              placeholder="Mô tả chi tiết về thành phần đánh giá này..."
            />

            <TextField
              fullWidth
              label="Tiêu chí đánh giá"
              multiline
              rows={3}
              value={editingComponent?.criteria || ''}
              onChange={(e) => setEditingComponent(editingComponent ? { ...editingComponent, criteria: e.target.value } : null)}
              placeholder="Các tiêu chí cụ thể để đánh giá..."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setDialogOpen(false);
            setEditingComponent(null);
          }}>
            Hủy
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveComponent}
            disabled={!editingComponent?.name || !editingComponent?.type}
          >
            Lưu
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

