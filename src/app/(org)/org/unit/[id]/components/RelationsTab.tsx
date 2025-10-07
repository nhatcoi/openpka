'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_ROUTES } from '@/constants/routes';
import { buildUrl } from '@/lib/api/api-handler';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
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
} from '@mui/material';
import {
  Business as BusinessIcon,
  AccountTree as AccountTreeIcon,
  Gavel as GavelIcon,
  Support as SupportIcon,
  Handshake as HandshakeIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { 
  type OrgUnit, 
  type OrgUnitRelation
} from '@/features/org/api/api';
import { 
  getTypeColor, 
  getTypeIcon,
  getRelationTypeColor,
  getRelationTypeIcon,
  getRelationTypeLabel
} from '@/utils/org-unit-utils';

interface RelationsTabProps {
  unitId: string;
}

interface EditRelationData {
  relation_type: 'direct' | 'advisory' | 'support' | 'collab';
  effective_from: string;
  effective_to: string;
  description: string;
}

interface AddRelationData {
  relation_type: 'direct' | 'advisory' | 'support' | 'collab';
  relation_direction: 'parent' | 'child';
  related_unit_id: string;
  effective_from: string;
  effective_to: string;
  description: string;
}

// Extend OrgUnitRelation to include parent and child info
interface OrgUnitWithRelation extends OrgUnitRelation {
  parent?: OrgUnit;
  child?: OrgUnit;
}

const relationTypes = [
  { value: 'direct', label: 'Trực tiếp', color: '#1976d2' },
  { value: 'advisory', label: 'Tư vấn', color: '#ed6c02' },
  { value: 'support', label: 'Hỗ trợ', color: '#2e7d32' },
  { value: 'collab', label: 'Hợp tác', color: '#9c27b0' },
];


export default function RelationsTab({ unitId }: RelationsTabProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedRelation, setSelectedRelation] = useState<OrgUnitWithRelation | null>(null);
  const [editData, setEditData] = useState<EditRelationData>({
    relation_type: 'direct',
    effective_from: '',
    effective_to: '',
    description: '',
  });
  const [addData, setAddData] = useState<AddRelationData>({
    relation_type: 'direct',
    relation_direction: 'parent',
    related_unit_id: '',
    effective_from: new Date().toISOString().split('T')[0],
    effective_to: '',
    description: '',
  });
  const [availableUnits, setAvailableUnits] = useState<OrgUnit[]>([]);

  // State for relations data
  const [relationsData, setRelationsData] = useState<{
    parentRelations: OrgUnitWithRelation[];
    childRelations: OrgUnitWithRelation[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [relationsError, setRelationsError] = useState<string | null>(null);

  // Fetch relations data
  const fetchRelationsData = async () => {
    try {
      setIsLoading(true);
      setRelationsError(null);
      
        const [parentResponse, childResponse] = await Promise.all([
          fetch(buildUrl(API_ROUTES.ORG.UNIT_RELATIONS, { parent_id: unitId })),
          fetch(buildUrl(API_ROUTES.ORG.UNIT_RELATIONS, { child_id: unitId }))
        ]);
      
      const parentData = await parentResponse.json();
      const childData = await childResponse.json();
      
      const response = {
        parentRelations: parentData.data?.items || [],
        childRelations: childData.data?.items || []
      };
      
      setRelationsData(response);
    } catch (err) {
      setRelationsError(err instanceof Error ? err.message : 'Failed to fetch relations');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch available units for adding relations
  const fetchAvailableUnits = async () => {
    try {
      // Gọi API trực tiếp để lấy tất cả đơn vị
      const response = await fetch(buildUrl(API_ROUTES.ORG.UNITS, { size: 1000, page: 1, sort: 'name', order: 'asc' }));
      const data = await response.json();
      
      if (data.success) {
        // Filter out current unit and units already in relations
        const currentRelations = [
          ...(relationsData?.parentRelations || []),
          ...(relationsData?.childRelations || [])
        ];
        const relatedUnitIds = currentRelations.map(rel => 
          rel.parent_id === unitId ? rel.child_id : rel.parent_id
        );
        
        const filteredUnits = data.data.items.filter((unit: OrgUnit) => 
          unit.id !== unitId && !relatedUnitIds.includes(unit.id)
        );
        setAvailableUnits(filteredUnits);
      }
    } catch (err) {
      console.error('Failed to fetch available units:', err);
    }
  };

  // Fetch data on mount
  React.useEffect(() => {
    if (unitId) {
      fetchRelationsData();
    }
  }, [unitId]);

  const parentRelations = relationsData?.parentRelations || [];
  const childRelations = relationsData?.childRelations || [];

  // Update relation function
  const updateRelation = async (relationKey: string, data: { relation_type?: string; effective_to?: string; description?: string }) => {
    try {
      const response = await fetch(`/api/org/unit-relations/${encodeURIComponent(relationKey)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      
      if (result.success) {
        fetchRelationsData(); // Refresh data
        return result.data;
      } else {
        throw new Error(result.error || 'Failed to update relation');
      }
    } catch (err) {
      throw err;
    }
  };

  // Create relation function
  const createRelation = async (data: AddRelationData) => {
    try {
      const relationData = {
        parent_id: data.relation_direction === 'parent' ? data.related_unit_id : unitId,
        child_id: data.relation_direction === 'parent' ? unitId : data.related_unit_id,
        relation_type: data.relation_type,
        effective_from: data.effective_from,
        effective_to: data.effective_to || undefined,
        description: data.description || '',
      };
      
      const response = await fetch(API_ROUTES.ORG.UNIT_RELATIONS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(relationData),
      });
      const result = await response.json();
      if (result.success) {
        fetchRelationsData(); // Refresh data
        return true;
      } else {
        throw new Error(result.error || 'Failed to create relation');
      }
    } catch (err) {
      throw err;
    }
  };

  // Delete relation function
  const deleteRelation = async (relationKey: string) => {
    try {
      const response = await fetch(`/api/org/unit-relations/${encodeURIComponent(relationKey)}`, {
        method: 'DELETE',
      });
      const result = await response.json();
      if (result.success) {
        fetchRelationsData(); // Refresh data
        return true;
      } else {
        throw new Error(result.error || 'Failed to delete relation');
      }
    } catch (err) {
      throw err;
    }
  };

  const handleUnitClick = (unitId: string) => {
    router.push(`/org/unit/${unitId}`);
  };

  const handleEdit = () => {
    setIsEditing(true);
    setError(null);
    setSuccess(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setError(null);
    setSuccess(null);
  };

  const handleEditRelation = (relation: OrgUnitWithRelation) => {
    setSelectedRelation(relation);
    setEditData({
      relation_type: relation.relation_type as 'direct' | 'advisory' | 'support' | 'collab',
      effective_from: relation.effective_from ? new Date(relation.effective_from).toISOString().split('T')[0] : '',
      effective_to: relation.effective_to ? new Date(relation.effective_to).toISOString().split('T')[0] : '',
      description: relation.note || '',
    });
    setEditDialogOpen(true);
  };

  const handleSaveRelation = async () => {
    if (!selectedRelation) return;

    setError(null);

    try {
      const key = {
        parent_id: selectedRelation.parent_id,
        child_id: selectedRelation.child_id,
        relation_type: selectedRelation.relation_type,
        effective_from: selectedRelation.effective_from,
      };

      const updateData = {
        relation_type: editData.relation_type,
        effective_to: editData.effective_to || undefined,
        description: editData.description || '',
      };

      // Create a composite key for the relation (format: parent_id/child_id/relation_type/effective_from)
      const effectiveFromDate = selectedRelation.effective_from ? selectedRelation.effective_from.split('T')[0] : '';
      const relationKey = `${selectedRelation.parent_id}/${selectedRelation.child_id}/${selectedRelation.relation_type}/${effectiveFromDate}`;
      await updateRelation(relationKey, updateData);
      
      setEditDialogOpen(false);
      setSuccess('Cập nhật quan hệ thành công!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra khi cập nhật quan hệ');
    }
  };

  const handleInputChange = (field: keyof EditRelationData, value: string) => {
    setEditData(prev => ({
      ...prev,
      [field]: field === 'relation_type' ? value as 'direct' | 'advisory' | 'support' | 'collab' : value,
    }));
  };

  const handleAddInputChange = (field: keyof AddRelationData, value: string) => {
    setAddData(prev => ({
      ...prev,
      [field]: field === 'relation_type' ? value as 'direct' | 'advisory' | 'support' | 'collab' : 
               field === 'relation_direction' ? value as 'parent' | 'child' : value,
    }));
  };

  const handleAddRelation = () => {
    setAddData({
      relation_type: 'direct',
      relation_direction: 'parent',
      related_unit_id: '',
      effective_from: new Date().toISOString().split('T')[0],
      effective_to: '',
      description: '',
    });
    fetchAvailableUnits();
    setAddDialogOpen(true);
  };

  const handleSaveAddRelation = async () => {
    if (!addData.related_unit_id) {
      setError('Vui lòng chọn đơn vị liên quan');
      return;
    }

    try {
      await createRelation(addData);
      setAddDialogOpen(false);
      setSuccess('Thêm quan hệ thành công!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra khi thêm quan hệ');
    }
  };

  const handleDeleteRelation = async (relation: OrgUnitWithRelation) => {
    if (!confirm('Bạn có chắc chắn muốn xóa quan hệ này?')) return;
    
    try {
      // Create composite key with date-only format (format: parent_id/child_id/relation_type/effective_from)
      const effectiveFromDate = relation.effective_from ? relation.effective_from.split('T')[0] : '';
      const relationKey = `${relation.parent_id}/${relation.child_id}/${relation.relation_type}/${effectiveFromDate}`;
      await deleteRelation(relationKey);
      setSuccess('Xóa quan hệ thành công!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra khi xóa quan hệ');
    }
  };

  const getRelationIcon = (relationType: string) => {
    switch (relationType) {
      case 'direct': return AccountTreeIcon;
      case 'advisory': return GavelIcon;
      case 'support': return SupportIcon;
      case 'collab': return HandshakeIcon;
      default: return BusinessIcon;
    }
  };


  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
          Quan hệ tổ chức
        </Typography>
        
        <Stack direction="row" spacing={2}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddRelation}
            sx={{ backgroundColor: '#1976d2' }}
          >
            Thêm quan hệ
          </Button>
          {!isEditing ? (
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={handleEdit}
              sx={{ minWidth: 120 }}
            >
              Chỉnh sửa
            </Button>
          ) : (
            <Button
              variant="outlined"
              startIcon={<CancelIcon />}
              onClick={handleCancel}
              disabled={isLoading}
            >
              Hủy
            </Button>
          )}
        </Stack>
      </Box>

      {/* Alerts */}
      {(error || relationsError) && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error || relationsError || 'Có lỗi xảy ra khi tải dữ liệu quan hệ'}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Loading state */}
      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      )}

      <Stack spacing={3}>
        {/* Parent Relations */}
        {parentRelations && parentRelations.length > 0 && (
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                Đơn vị cấp dưới ({parentRelations.length})
              </Typography>
              
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Quan hệ</TableCell>
                      <TableCell>Loại quan hệ</TableCell>
                      <TableCell>Hiệu lực từ</TableCell>
                      <TableCell align="right">Thao tác</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {parentRelations.map((relation: OrgUnitWithRelation) => (
                      <TableRow 
                        key={`${relation.parent_id}-${relation.child_id}-${relation.relation_type}`} 
                        hover
                        sx={{ cursor: 'pointer' }}
                        onClick={() => handleUnitClick(relation.child?.id || '')}
                      >
                        <TableCell>
                          <Stack direction="row" alignItems="center" spacing={2}>
                            <Avatar sx={{ backgroundColor: getTypeColor(relation.child?.type || ''), width: 32, height: 32 }}>
                              {React.createElement(getTypeIcon(relation.child?.type || ''), { fontSize: 'small' })}
                            </Avatar>
                            <Box>
                              <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                {relation.child?.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {relation.child?.code}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                {relation.note || 'Không có mô tả'}
                              </Typography>
                            </Box>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <Avatar sx={{ 
                              backgroundColor: getRelationTypeColor(relation.relation_type), 
                              width: 20, 
                              height: 20 
                            }}>
                              {React.createElement(getRelationIcon(relation.relation_type), { fontSize: 'small' })}
                            </Avatar>
                            <Typography variant="body2">
                              {getRelationTypeLabel(relation.relation_type)}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {new Date(relation.effective_from).toLocaleDateString('vi-VN')}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={1}>
                            {isEditing && (
                              <Stack direction="row" spacing={1}>
                                <Tooltip title="Chỉnh sửa quan hệ">
                                  <IconButton
                                    size="small"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEditRelation(relation);
                                    }}
                                  >
                                    <EditIcon />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Xóa quan hệ">
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteRelation(relation);
                                    }}
                                  >
                                    <DeleteIcon />
                                  </IconButton>
                                </Tooltip>
                              </Stack>
                            )}
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        )}

        {/* Child Relations */}
        {childRelations && childRelations.length > 0 && (
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                Đơn vị cấp trên ({childRelations.length})
              </Typography>
              
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Quan hệ</TableCell>
                      <TableCell>Loại quan hệ</TableCell>
                      <TableCell>Hiệu lực từ</TableCell>
                      <TableCell align="right">Thao tác</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {childRelations.map((relation: OrgUnitWithRelation) => (
                      <TableRow 
                        key={`${relation.parent_id}-${relation.child_id}-${relation.relation_type}`} 
                        hover
                        sx={{ cursor: 'pointer' }}
                        onClick={() => handleUnitClick(relation.parent?.id || '')}
                      >
                        <TableCell>
                          <Stack direction="row" alignItems="center" spacing={2}>
                            <Avatar sx={{ backgroundColor: getTypeColor(relation.parent?.type || ''), width: 32, height: 32 }}>
                              {React.createElement(getTypeIcon(relation.parent?.type || ''), { fontSize: 'small' })}
                            </Avatar>
                            <Box>
                              <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                {relation.parent?.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {relation.parent?.code}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                {relation.note || 'Không có mô tả'}
                              </Typography>
                            </Box>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <Avatar sx={{ 
                              backgroundColor: getRelationTypeColor(relation.relation_type), 
                              width: 20, 
                              height: 20 
                            }}>
                              {React.createElement(getRelationIcon(relation.relation_type), { fontSize: 'small' })}
                            </Avatar>
                            <Typography variant="body2">
                              {getRelationTypeLabel(relation.relation_type)}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {new Date(relation.effective_from).toLocaleDateString('vi-VN')}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={1}>
                            {isEditing && (
                              <Stack direction="row" spacing={1}>
                                <Tooltip title="Chỉnh sửa quan hệ">
                                  <IconButton
                                    size="small"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEditRelation(relation);
                                    }}
                                  >
                                    <EditIcon />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Xóa quan hệ">
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteRelation(relation);
                                    }}
                                  >
                                    <DeleteIcon />
                                  </IconButton>
                                </Tooltip>
                              </Stack>
                            )}
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        )}


        {/* No Relations Message */}
        {!isLoading && parentRelations.length === 0 && childRelations.length === 0 && (
          <Card>
            <CardContent>
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <AccountTreeIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  Chưa có quan hệ tổ chức
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Đơn vị này chưa có đơn vị cha, đơn vị con hoặc quan hệ với các đơn vị khác
                </Typography>
              </Box>
            </CardContent>
          </Card>
        )}
      </Stack>

      {/* Add Relation Dialog */}
      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Thêm quan hệ mới
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Hướng quan hệ</InputLabel>
              <Select
                value={addData.relation_direction}
                onChange={(e) => handleAddInputChange('relation_direction', e.target.value)}
                label="Hướng quan hệ"
              >
                <MenuItem value="parent">
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <BusinessIcon color="primary" />
                    <Typography>Đơn vị cha (đơn vị này là con)</Typography>
                  </Stack>
                </MenuItem>
                <MenuItem value="child">
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <AccountTreeIcon color="secondary" />
                    <Typography>Đơn vị con (đơn vị này là cha)</Typography>
                  </Stack>
                </MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Đơn vị liên quan</InputLabel>
              <Select
                value={addData.related_unit_id}
                onChange={(e) => handleAddInputChange('related_unit_id', e.target.value)}
                label="Đơn vị liên quan"
              >
                {availableUnits.map((unit) => (
                  <MenuItem key={unit.id} value={unit.id}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Avatar sx={{ backgroundColor: getTypeColor(unit.type || ''), width: 24, height: 24 }}>
                        {React.createElement(getTypeIcon(unit.type || ''), { fontSize: 'small' })}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight="bold">{unit.name}</Typography>
                        <Typography variant="caption" color="text.secondary">{unit.code}</Typography>
                      </Box>
                    </Stack>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Loại quan hệ</InputLabel>
              <Select
                value={addData.relation_type}
                onChange={(e) => handleAddInputChange('relation_type', e.target.value)}
                label="Loại quan hệ"
              >
                {relationTypes.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Avatar sx={{ backgroundColor: type.color, width: 20, height: 20 }}>
                        {React.createElement(getRelationIcon(type.value), { fontSize: 'small' })}
                      </Avatar>
                      <Typography>{type.label}</Typography>
                    </Stack>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              type="date"
              label="Hiệu lực từ"
              value={addData.effective_from}
              onChange={(e) => handleAddInputChange('effective_from', e.target.value)}
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              fullWidth
              type="date"
              label="Hiệu lực đến"
              value={addData.effective_to}
              onChange={(e) => handleAddInputChange('effective_to', e.target.value)}
              InputLabelProps={{ shrink: true }}
              helperText="Để trống nếu không giới hạn thời gian"
            />

            <TextField
              fullWidth
              multiline
              rows={3}
              label="Ghi chú"
              value={addData.description}
              onChange={(e) => handleAddInputChange('description', e.target.value)}
              placeholder="Nhập ghi chú về quan hệ..."
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)}>
            Hủy
          </Button>
          <Button
            variant="contained"
            startIcon={isLoading ? <CircularProgress size={16} /> : <AddIcon />}
            onClick={handleSaveAddRelation}
            disabled={isLoading}
          >
            {isLoading ? 'Đang thêm...' : 'Thêm quan hệ'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Relation Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Chỉnh sửa quan hệ
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Loại quan hệ</InputLabel>
              <Select
                value={editData.relation_type}
                onChange={(e) => handleInputChange('relation_type', e.target.value)}
                label="Loại quan hệ"
              >
                {relationTypes.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Avatar sx={{ backgroundColor: type.color, width: 20, height: 20 }}>
                        {React.createElement(getRelationIcon(type.value), { fontSize: 'small' })}
                      </Avatar>
                      <Typography>{type.label}</Typography>
                    </Stack>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              type="date"
              label="Hiệu lực từ"
              value={editData.effective_from}
              onChange={(e) => handleInputChange('effective_from', e.target.value)}
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              fullWidth
              type="date"
              label="Hiệu lực đến"
              value={editData.effective_to}
              onChange={(e) => handleInputChange('effective_to', e.target.value)}
              InputLabelProps={{ shrink: true }}
              helperText="Để trống nếu không giới hạn thời gian"
            />

            <TextField
              fullWidth
              multiline
              rows={3}
              label="Ghi chú"
              value={editData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Nhập ghi chú về quan hệ..."
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>
            Hủy
          </Button>
          <Button
            variant="contained"
            startIcon={isLoading ? <CircularProgress size={16} /> : <SaveIcon />}
            onClick={handleSaveRelation}
            disabled={isLoading}
          >
            {isLoading ? 'Đang lưu...' : 'Lưu thay đổi'}
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
}