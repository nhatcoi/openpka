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
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';

export interface RubricCriterion {
  name: string;
  weight: number;
}

export interface RubricComponent {
  id?: string;
  code: string;
  name: string;
  criteria: RubricCriterion[];
}

interface RubricsFormProps {
  rubrics: RubricComponent[];
  onChange: (rubrics: RubricComponent[]) => void;
}

export default function RubricsForm({ rubrics, onChange }: RubricsFormProps) {
  const [editingComponent, setEditingComponent] = useState<RubricComponent | null>(null);
  const [editingCriterion, setEditingCriterion] = useState<{ componentIndex: number; criterionIndex: number | null } | null>(null);
  const [componentDialogOpen, setComponentDialogOpen] = useState(false);
  const [criterionDialogOpen, setCriterionDialogOpen] = useState(false);

  const handleAddComponent = () => {
    setEditingComponent({
      code: '',
      name: '',
      criteria: [],
    });
    setComponentDialogOpen(true);
  };

  const handleEditComponent = (component: RubricComponent, index: number) => {
    setEditingComponent({ ...component });
    setComponentDialogOpen(true);
  };

  const handleDeleteComponent = (index: number) => {
    onChange(rubrics.filter((_, i) => i !== index));
  };

  const handleSaveComponent = () => {
    if (!editingComponent?.code || !editingComponent?.name) return;

    const componentId = editingComponent.id || `rubric-${Date.now()}`;
    const updatedComponent = { ...editingComponent, id: componentId };

    const existingIndex = rubrics.findIndex(c => c.id === componentId);
    if (existingIndex >= 0) {
      // Update existing
      onChange(rubrics.map((c, i) => i === existingIndex ? updatedComponent : c));
    } else {
      // Add new
      onChange([...rubrics, updatedComponent]);
    }
    setComponentDialogOpen(false);
    setEditingComponent(null);
  };

  const handleAddCriterion = (componentIndex: number) => {
    setEditingCriterion({ componentIndex, criterionIndex: null });
    setCriterionDialogOpen(true);
  };

  const handleEditCriterion = (componentIndex: number, criterionIndex: number) => {
    setEditingCriterion({ componentIndex, criterionIndex });
    setCriterionDialogOpen(true);
  };

  const handleDeleteCriterion = (componentIndex: number, criterionIndex: number) => {
    const updatedRubrics = [...rubrics];
    updatedRubrics[componentIndex].criteria = updatedRubrics[componentIndex].criteria.filter((_, i) => i !== criterionIndex);
    onChange(updatedRubrics);
  };

  const handleSaveCriterion = () => {
    if (!editingCriterion || !editingCriterion.componentIndex) return;

    const component = rubrics[editingCriterion.componentIndex];
    const criterionName = (document.getElementById('criterion-name') as HTMLInputElement)?.value || '';
    const criterionWeight = parseFloat((document.getElementById('criterion-weight') as HTMLInputElement)?.value || '0') || 0;

    if (!criterionName) return;

    const newCriterion: RubricCriterion = { name: criterionName, weight: criterionWeight };

    const updatedRubrics = [...rubrics];
    if (editingCriterion.criterionIndex !== null) {
      // Update existing
      updatedRubrics[editingCriterion.componentIndex].criteria[editingCriterion.criterionIndex] = newCriterion;
    } else {
      // Add new
      updatedRubrics[editingCriterion.componentIndex].criteria.push(newCriterion);
    }
    onChange(updatedRubrics);
    setCriterionDialogOpen(false);
    setEditingCriterion(null);
  };

  const getTotalWeight = (criteria: RubricCriterion[]) => {
    return criteria.reduce((sum, c) => sum + (c.weight || 0), 0);
  };

  const getCurrentCriterion = () => {
    if (!editingCriterion || editingCriterion.criterionIndex === null) return null;
    return rubrics[editingCriterion.componentIndex]?.criteria[editingCriterion.criterionIndex] || null;
  };

  return (
    <>
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">
              Rubrics (Tiêu chí chấm điểm)
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddComponent}
            >
              Thêm rubric
            </Button>
          </Box>

          {rubrics.length === 0 ? (
            <Alert severity="info" sx={{ mb: 2 }}>
              Chưa có rubric nào. Nhấn "Thêm rubric" để bắt đầu.
            </Alert>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {rubrics.map((component, componentIndex) => {
                const totalWeight = getTotalWeight(component.criteria);
                return (
                  <Accordion key={component.id || componentIndex} defaultExpanded>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', pr: 2 }}>
                        <Box>
                          <Typography variant="subtitle1" fontWeight="bold">
                            [{component.code}] {component.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {component.criteria.length} tiêu chí • Tổng trọng số: {totalWeight}%
                            {totalWeight !== 100 && totalWeight > 0 && (
                              <Typography component="span" color="error" variant="caption" sx={{ ml: 1 }}>
                                (Cần đạt 100%)
                              </Typography>
                            )}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1 }} onClick={(e) => e.stopPropagation()}>
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditComponent(component, componentIndex);
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteComponent(componentIndex);
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Tiêu chí chấm điểm
                        </Typography>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<AddIcon />}
                          onClick={() => handleAddCriterion(componentIndex)}
                        >
                          Thêm tiêu chí
                        </Button>
                      </Box>

                      {component.criteria.length === 0 ? (
                        <Alert severity="info" sx={{ mb: 2 }}>
                          Chưa có tiêu chí nào. Nhấn "Thêm tiêu chí" để bắt đầu.
                        </Alert>
                      ) : (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                          {component.criteria.map((criterion, criterionIndex) => (
                            <Card key={criterionIndex} variant="outlined">
                              <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <Box sx={{ flex: 1 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 0.5 }}>
                                      <Typography variant="body1" fontWeight="medium">
                                        {criterion.name}
                                      </Typography>
                                      <Chip
                                        label={`${criterion.weight}%`}
                                        color="primary"
                                        size="small"
                                        variant="outlined"
                                      />
                                    </Box>
                                  </Box>
                                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                                    <IconButton
                                      size="small"
                                      onClick={() => handleEditCriterion(componentIndex, criterionIndex)}
                                    >
                                      <EditIcon fontSize="small" />
                                    </IconButton>
                                    <IconButton
                                      size="small"
                                      color="error"
                                      onClick={() => handleDeleteCriterion(componentIndex, criterionIndex)}
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
                    </AccordionDetails>
                  </Accordion>
                );
              })}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Component Edit Dialog */}
      <Dialog open={componentDialogOpen} onClose={() => setComponentDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingComponent?.id && rubrics.find(c => c.id === editingComponent.id) ? 'Sửa rubric' : 'Thêm rubric mới'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <TextField
              fullWidth
              label="Mã rubric"
              value={editingComponent?.code || ''}
              onChange={(e) => setEditingComponent(editingComponent ? { ...editingComponent, code: e.target.value } : null)}
              placeholder="VD: PRJ, ASS, QUIZ..."
              required
              helperText="Mã ngắn gọn để nhận diện rubric (VD: PRJ cho Project)"
            />

            <TextField
              fullWidth
              label="Tên rubric"
              value={editingComponent?.name || ''}
              onChange={(e) => setEditingComponent(editingComponent ? { ...editingComponent, name: e.target.value } : null)}
              placeholder="VD: Project cuối kỳ, Bài tập lớn..."
              required
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setComponentDialogOpen(false);
            setEditingComponent(null);
          }}>
            Hủy
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveComponent}
            disabled={!editingComponent?.code || !editingComponent?.name}
          >
            Lưu
          </Button>
        </DialogActions>
      </Dialog>

      {/* Criterion Edit Dialog */}
      <Dialog open={criterionDialogOpen} onClose={() => setCriterionDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingCriterion?.criterionIndex !== null ? 'Sửa tiêu chí' : 'Thêm tiêu chí mới'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <TextField
              fullWidth
              id="criterion-name"
              label="Tên tiêu chí"
              defaultValue={getCurrentCriterion()?.name || ''}
              placeholder="VD: Hiểu bài toán, Thiết kế & cài đặt..."
              required
            />

            <TextField
              fullWidth
              id="criterion-weight"
              label="Trọng số (%)"
              type="number"
              defaultValue={getCurrentCriterion()?.weight || 0}
              required
              inputProps={{ min: 0, max: 100, step: 0.1 }}
              helperText={
                editingCriterion && editingCriterion.componentIndex !== null
                  ? `Tổng trọng số hiện tại: ${getTotalWeight(rubrics[editingCriterion.componentIndex]?.criteria || [])}%`
                  : ''
              }
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setCriterionDialogOpen(false);
            setEditingCriterion(null);
          }}>
            Hủy
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveCriterion}
          >
            Lưu
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

