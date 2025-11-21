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
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Autocomplete,
  Link,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Description as DescriptionIcon,
} from '@mui/icons-material';

export interface WeekItem {
  id?: string;
  week_number: number;
  topic: string;
  objectives?: string;
  teaching_methods?: string;
  materials?: string;
  materials_documents?: string[]; // Array of document IDs
  assignments?: string;
  duration_hours?: number;
  is_exam_week?: boolean;
  is_midterm_week?: boolean;
  notes?: string;
}

interface MaterialDocument {
  id: string;
  file_name: string;
  original_name?: string;
  document_type: string;
  file_url?: string;
}

interface WeeklyPlanFormProps {
  weeklyPlan: WeekItem[];
  onChange: (weeklyPlan: WeekItem[]) => void;
  syllabusId?: string;
  courseVersionId?: string;
  courseId: string;
}

export default function WeeklyPlanForm({ weeklyPlan, onChange, syllabusId, courseVersionId, courseId }: WeeklyPlanFormProps) {
  const [editingWeek, setEditingWeek] = useState<WeekItem | null>(null);
  const [weekDialogOpen, setWeekDialogOpen] = useState(false);
  const [availableDocuments, setAvailableDocuments] = useState<MaterialDocument[]>([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);

  // Fetch available documents
  const fetchDocuments = async () => {
    if (!syllabusId && !courseVersionId) return;

    try {
      setLoadingDocuments(true);
      const entityId = syllabusId || courseVersionId || '';
      const entityType = 'course_syllabus';

      const response = await fetch(
        `/api/documents/entity/${entityType}/${entityId}?is_active=true`
      );
      const result = await response.json();

      if (result.success) {
        setAvailableDocuments(result.data.documents || []);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoadingDocuments(false);
    }
  };

  useEffect(() => {
    if (syllabusId || courseVersionId) {
      fetchDocuments();
    }
  }, [syllabusId, courseVersionId]);

  const handleAddWeek = () => {
    const nextWeekNumber = weeklyPlan.length > 0 
      ? Math.max(...weeklyPlan.map(w => w.week_number), 0) + 1 
      : 1;
    setEditingWeek({
      week_number: nextWeekNumber,
      topic: '',
      objectives: '',
      teaching_methods: '',
      materials: '',
      materials_documents: [],
      assignments: '',
      duration_hours: 3,
      is_exam_week: false,
      is_midterm_week: false,
      notes: '',
    });
    setWeekDialogOpen(true);
  };

  const handleEditWeek = (week: WeekItem) => {
    setEditingWeek({ ...week });
    setWeekDialogOpen(true);
  };

  const handleDeleteWeek = (index: number) => {
    const newPlan = weeklyPlan.filter((_, i) => i !== index);
    // Reorder week numbers
    const reordered = newPlan.map((week, idx) => ({
      ...week,
      week_number: idx + 1,
    }));
    onChange(reordered);
  };

  const handleSaveWeek = () => {
    if (!editingWeek?.topic) return;

    const weekId = editingWeek.id || `week-${Date.now()}`;
    const updatedWeek = { ...editingWeek, id: weekId };

    if (weeklyPlan.find(w => w.id === weekId || (w.week_number === editingWeek.week_number && !w.id))) {
      // Update existing
      onChange(weeklyPlan.map(w => 
        (w.id === weekId || (w.week_number === editingWeek.week_number && !w.id)) ? updatedWeek : w
      ));
    } else {
      // Add new
      onChange([...weeklyPlan, updatedWeek].sort((a, b) => a.week_number - b.week_number));
    }
    setWeekDialogOpen(false);
    setEditingWeek(null);
  };

  return (
    <>
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">
              Kế hoạch tuần (Weekly Plan)
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddWeek}
            >
              Thêm tuần
            </Button>
          </Box>

          {weeklyPlan.length === 0 ? (
            <Alert severity="info" sx={{ mb: 2 }}>
              Chưa có kế hoạch tuần nào. Nhấn "Thêm tuần" để bắt đầu.
            </Alert>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {weeklyPlan
                .sort((a, b) => a.week_number - b.week_number)
                .map((week, index) => (
                <Card key={week.id || index} variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <Typography variant="subtitle1" fontWeight="bold">
                            Tuần {week.week_number}
                          </Typography>
                          {week.is_exam_week && (
                            <Chip label="Tuần thi" color="error" size="small" />
                          )}
                          {week.is_midterm_week && (
                            <Chip label="Giữa kỳ" color="warning" size="small" />
                          )}
                        </Box>
                        <Typography variant="h6" gutterBottom>
                          {week.topic || 'Chưa có chủ đề'}
                        </Typography>
                        {week.objectives && (
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            <strong>Mục tiêu:</strong> {week.objectives}
                          </Typography>
                        )}
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 1, mt: 1 }}>
                          {week.duration_hours && (
                            <Typography variant="body2" color="text.secondary">
                              <strong>Thời lượng:</strong> {week.duration_hours} giờ
                            </Typography>
                          )}
                          {week.teaching_methods && (
                            <Typography variant="body2" color="text.secondary">
                              <strong>Phương pháp:</strong> {week.teaching_methods}
                            </Typography>
                          )}
                        </Box>
                        {week.materials_documents && week.materials_documents.length > 0 && (
                          <Box sx={{ mt: 1, mb: 1 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                              <strong>Tài liệu đã chọn:</strong>
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                              {week.materials_documents.map((docId) => {
                                const doc = availableDocuments.find(d => d.id === docId);
                                if (!doc) return null;
                                return (
                                  <Chip
                                    key={docId}
                                    icon={<DescriptionIcon />}
                                    label={doc.original_name || doc.file_name}
                                    component={doc.file_url ? Link : 'div'}
                                    href={doc.file_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => {
                                      if (doc.file_url) {
                                        e.stopPropagation();
                                        window.open(doc.file_url, '_blank', 'noopener,noreferrer');
                                      }
                                    }}
                                    sx={{
                                      cursor: doc.file_url ? 'pointer' : 'default',
                                      '&:hover': doc.file_url ? {
                                        backgroundColor: 'primary.light',
                                        color: 'primary.contrastText',
                                      } : {},
                                    }}
                                    size="small"
                                    color="primary"
                                    variant="outlined"
                                  />
                                );
                              })}
                            </Box>
                          </Box>
                        )}
                        {week.materials && (
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            <strong>Tài liệu (mô tả thêm):</strong> {week.materials}
                          </Typography>
                        )}
                        {week.assignments && (
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            <strong>Bài tập:</strong> {week.assignments}
                          </Typography>
                        )}
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          size="small"
                          startIcon={<EditIcon />}
                          onClick={() => handleEditWeek(week)}
                        >
                          Sửa
                        </Button>
                        <Button
                          size="small"
                          color="error"
                          startIcon={<DeleteIcon />}
                          onClick={() => handleDeleteWeek(index)}
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

      {/* Week Edit Dialog */}
      <Dialog open={weekDialogOpen} onClose={() => setWeekDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingWeek?.id && weeklyPlan.find(w => w.id === editingWeek.id) ? 'Sửa tuần học' : 'Thêm tuần học mới'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 2 }}>
              <TextField
                fullWidth
                label="Số tuần"
                type="number"
                value={editingWeek?.week_number || 1}
                onChange={(e) => setEditingWeek(editingWeek ? { ...editingWeek, week_number: parseInt(e.target.value) || 1 } : null)}
                required
                inputProps={{ min: 1 }}
              />
              <TextField
                fullWidth
                label="Thời lượng (giờ)"
                type="number"
                value={editingWeek?.duration_hours || 3}
                onChange={(e) => setEditingWeek(editingWeek ? { ...editingWeek, duration_hours: parseFloat(e.target.value) || 3 } : null)}
                inputProps={{ min: 0, step: 0.5 }}
              />
            </Box>

            <TextField
              fullWidth
              label="Chủ đề tuần"
              value={editingWeek?.topic || ''}
              onChange={(e) => setEditingWeek(editingWeek ? { ...editingWeek, topic: e.target.value } : null)}
              placeholder="Chủ đề/nội dung chính của tuần học..."
              required
              multiline
              rows={2}
            />

            <TextField
              fullWidth
              label="Mục tiêu tuần"
              multiline
              rows={3}
              value={editingWeek?.objectives || ''}
              onChange={(e) => setEditingWeek(editingWeek ? { ...editingWeek, objectives: e.target.value } : null)}
              placeholder="Mục tiêu học tập cụ thể cho tuần này..."
            />

            <TextField
              fullWidth
              label="Phương pháp giảng dạy"
              multiline
              rows={2}
              value={editingWeek?.teaching_methods || ''}
              onChange={(e) => setEditingWeek(editingWeek ? { ...editingWeek, teaching_methods: e.target.value } : null)}
              placeholder="Phương pháp giảng dạy sẽ sử dụng..."
            />

            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Tài liệu học tập từ Materials
              </Typography>
              <Autocomplete
                multiple
                options={availableDocuments}
                getOptionLabel={(option) => option.original_name || option.file_name}
                value={availableDocuments.filter(doc => 
                  editingWeek?.materials_documents?.includes(doc.id)
                )}
                onChange={(_, newValue) => {
                  setEditingWeek(editingWeek ? {
                    ...editingWeek,
                    materials_documents: newValue.map(doc => doc.id)
                  } : null);
                }}
                loading={loadingDocuments}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Chọn tài liệu từ Materials..."
                    helperText={editingWeek?.materials_documents?.length 
                      ? `Đã chọn ${editingWeek.materials_documents.length} tài liệu`
                      : 'Chọn một hoặc nhiều tài liệu từ danh sách Materials của syllabus'
                    }
                  />
                )}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      label={option.original_name || option.file_name}
                      {...getTagProps({ index })}
                      key={option.id}
                      size="small"
                    />
                  ))
                }
                disabled={!syllabusId && !courseVersionId}
              />
              {(!syllabusId && !courseVersionId) && (
                <Alert severity="info" sx={{ mt: 1 }}>
                  Vui lòng lưu đề cương trước để có thể chọn tài liệu từ Materials.
                </Alert>
              )}
            </Box>

            <TextField
              fullWidth
              label="Tài liệu học tập (mô tả thêm)"
              multiline
              rows={2}
              value={editingWeek?.materials || ''}
              onChange={(e) => setEditingWeek(editingWeek ? { ...editingWeek, materials: e.target.value } : null)}
              placeholder="Mô tả thêm về tài liệu, giáo trình, bài đọc (nếu có)..."
              helperText="Có thể nhập thêm mô tả về tài liệu ngoài danh sách đã chọn ở trên"
            />

            <TextField
              fullWidth
              label="Bài tập/Nhiệm vụ"
              multiline
              rows={2}
              value={editingWeek?.assignments || ''}
              onChange={(e) => setEditingWeek(editingWeek ? { ...editingWeek, assignments: e.target.value } : null)}
              placeholder="Bài tập, project, nhiệm vụ học tập..."
            />

            <TextField
              fullWidth
              label="Ghi chú"
              multiline
              rows={2}
              value={editingWeek?.notes || ''}
              onChange={(e) => setEditingWeek(editingWeek ? { ...editingWeek, notes: e.target.value } : null)}
              placeholder="Ghi chú bổ sung..."
            />

            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={editingWeek?.is_exam_week || false}
                    onChange={(e) => setEditingWeek(editingWeek ? { ...editingWeek, is_exam_week: e.target.checked } : null)}
                  />
                }
                label="Tuần thi"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={editingWeek?.is_midterm_week || false}
                    onChange={(e) => setEditingWeek(editingWeek ? { ...editingWeek, is_midterm_week: e.target.checked } : null)}
                  />
                }
                label="Tuần giữa kỳ"
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setWeekDialogOpen(false);
            setEditingWeek(null);
          }}>
            Hủy
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveWeek}
            disabled={!editingWeek?.topic}
          >
            Lưu
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

