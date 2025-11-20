'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { API_ROUTES } from '@/constants/routes';
import { buildUrl } from '@/lib/api/api-handler';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Stack,
  Button,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  Chip,
  Breadcrumbs,
  Link as MuiLink,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Business as BusinessIcon,
  AccountTree as AccountTreeIcon,
  Gavel as GavelIcon,
  Support as SupportIcon,
  Handshake as HandshakeIcon,
} from '@mui/icons-material';
import { 
  type OrgUnit, 
  type OrgUnitRelation
} from '@/features/org/api/api';
import { getRelationTypeLabel } from '@/utils/org-unit-utils';

interface OrgUnitRelationWithDetails extends OrgUnitRelation {
  parent?: OrgUnit;
  child?: OrgUnit;
}

const relationTypes = [
  { value: 'direct', label: 'Trực tiếp', icon: AccountTreeIcon },
  { value: 'advisory', label: 'Tư vấn', icon: GavelIcon },
  { value: 'support', label: 'Hỗ trợ', icon: SupportIcon },
  { value: 'collab', label: 'Hợp tác', icon: HandshakeIcon },
];

export default function UnitRelationsPage() {
  const router = useRouter();
  const [relations, setRelations] = useState<OrgUnitRelationWithDetails[]>([]);
  const [units, setUnits] = useState<OrgUnit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedRelation, setSelectedRelation] = useState<OrgUnitRelationWithDetails | null>(null);
  const [sortState, setSortState] = useState({ field: 'effective_from', order: 'desc' as 'asc' | 'desc' });
  
  const [formData, setFormData] = useState({
    parent_id: '',
    child_id: '',
    relation_type: 'direct' as 'direct' | 'advisory' | 'support' | 'collab',
    effective_from: new Date().toISOString().split('T')[0],
    effective_to: '',
    description: '',
  });

  useEffect(() => {
    fetchUnits();
  }, []);

  const fetchRelations = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        size: '1000',
        sort: sortState.field,
        order: sortState.order,
      });
      
      const response = await fetch(`${API_ROUTES.ORG.UNIT_RELATIONS}?${params.toString()}`);
      const data = await response.json();
      
      if (data.success) {
        const items = data.data?.items || [];
        setRelations(items);
      } else {
        setError(data.error || 'Failed to fetch relations');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch relations');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRelations();
  }, [sortState.field, sortState.order]);

  const handleSort = (field: string) => {
    setSortState(prev => ({
      field,
      order: prev.field === field && prev.order === 'asc' ? 'desc' : 'asc',
    }));
  };

  const fetchUnits = async () => {
    try {
      const response = await fetch(buildUrl(API_ROUTES.ORG.UNITS, { size: 1000 }));
      const data = await response.json();
      
      if (data.success) {
        const items = data.data?.items || data.data || [];
        setUnits(Array.isArray(items) ? items : []);
      }
    } catch (err) {
      console.error('Failed to fetch units:', err);
    }
  };


  const handleAddRelation = () => {
    setFormData({
      parent_id: '',
      child_id: '',
      relation_type: 'direct',
      effective_from: new Date().toISOString().split('T')[0],
      effective_to: '',
      description: '',
    });
    setAddDialogOpen(true);
  };

  const handleEditRelation = (relation: OrgUnitRelationWithDetails) => {
    setSelectedRelation(relation);
    setFormData({
      parent_id: relation.parent_id?.toString() || '',
      child_id: relation.child_id?.toString() || '',
      relation_type: relation.relation_type as 'direct' | 'advisory' | 'support' | 'collab',
      effective_from: relation.effective_from ? new Date(relation.effective_from).toISOString().split('T')[0] : '',
      effective_to: relation.effective_to ? new Date(relation.effective_to).toISOString().split('T')[0] : '',
      description: relation.note || '',
    });
    setEditDialogOpen(true);
  };

  const handleDeleteRelation = (relation: OrgUnitRelationWithDetails) => {
    setSelectedRelation(relation);
    setDeleteDialogOpen(true);
  };

  const handleSaveAdd = async () => {
    if (!formData.parent_id || !formData.child_id || !formData.effective_from) {
      setError('Vui lòng điền đầy đủ thông tin');
      return;
    }

    try {
      const response = await fetch(API_ROUTES.ORG.UNIT_RELATIONS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parent_id: formData.parent_id,
          child_id: formData.child_id,
          relation_type: formData.relation_type,
          effective_from: formData.effective_from,
          effective_to: formData.effective_to || undefined,
          description: formData.description || undefined,
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setSuccess('Thêm quan hệ thành công!');
        setAddDialogOpen(false);
        setTimeout(() => setSuccess(null), 3000);
        fetchRelations();
      } else {
        setError(result.error || 'Failed to create relation');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create relation');
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedRelation) return;

    try {
      const effectiveFromDate = selectedRelation.effective_from 
        ? new Date(selectedRelation.effective_from).toISOString().split('T')[0] 
        : '';
      const relationKey = `${selectedRelation.parent_id}/${selectedRelation.child_id}/${selectedRelation.relation_type}/${effectiveFromDate}`;
      
      const response = await fetch(`/api/org/unit-relations/${encodeURIComponent(relationKey)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          relation_type: formData.relation_type,
          effective_to: formData.effective_to || undefined,
          description: formData.description || undefined,
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setSuccess('Cập nhật quan hệ thành công!');
        setEditDialogOpen(false);
        setTimeout(() => setSuccess(null), 3000);
        fetchRelations();
      } else {
        setError(result.error || 'Failed to update relation');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update relation');
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedRelation) return;

    try {
      const effectiveFromDate = selectedRelation.effective_from 
        ? new Date(selectedRelation.effective_from).toISOString().split('T')[0] 
        : '';
      const relationKey = `${selectedRelation.parent_id}/${selectedRelation.child_id}/${selectedRelation.relation_type}/${effectiveFromDate}`;
      
      const response = await fetch(`/api/org/unit-relations/${encodeURIComponent(relationKey)}`, {
        method: 'DELETE',
      });
      
      const result = await response.json();
      
      if (result.success) {
        setSuccess('Xóa quan hệ thành công!');
        setDeleteDialogOpen(false);
        setTimeout(() => setSuccess(null), 3000);
        fetchRelations();
      } else {
        setError(result.error || 'Failed to delete relation');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete relation');
    }
  };

  const getRelationIcon = (relationType: string) => {
    const relationTypeConfig = relationTypes.find(t => t.value === relationType);
    return relationTypeConfig ? relationTypeConfig.icon : BusinessIcon;
  };

  const getParentUnit = (relation: OrgUnitRelationWithDetails) => relation.parent;
  const getChildUnit = (relation: OrgUnitRelationWithDetails) => relation.child;

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box sx={{ py: 4, px: 3, width: '100%' }}>
      <Breadcrumbs sx={{ mb: 3 }}>
        <MuiLink
          component="button"
          variant="body1"
          onClick={() => router.push('/org/unit')}
          sx={{ textDecoration: 'none' }}
        >
          Quản lý đơn vị
        </MuiLink>
        <Typography color="text.primary">Thiết lập quan hệ</Typography>
      </Breadcrumbs>

      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 1 }}>
            Thiết lập quan hệ
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Quản lý quan hệ giữa các đơn vị trong tổ chức
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddRelation}
        >
          Thêm quan hệ
        </Button>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Card>
        <CardContent>
          {relations.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <AccountTreeIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                Chưa có quan hệ tổ chức
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Bắt đầu bằng cách thêm quan hệ mới giữa các đơn vị
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell 
                      sx={{ cursor: 'pointer', '&:hover': { backgroundColor: 'action.hover' } }}
                      onClick={() => handleSort('parent_name')}
                    >
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <strong>Đơn vị</strong>
                        {sortState.field === 'parent_name' && (
                          <span>{sortState.order === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </Stack>
                    </TableCell>
                    <TableCell 
                      sx={{ cursor: 'pointer', '&:hover': { backgroundColor: 'action.hover' } }}
                      onClick={() => handleSort('child_name')}
                    >
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <strong>Đơn vị</strong>
                        {sortState.field === 'child_name' && (
                          <span>{sortState.order === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </Stack>
                    </TableCell>
                    <TableCell 
                      sx={{ cursor: 'pointer', '&:hover': { backgroundColor: 'action.hover' } }}
                      onClick={() => handleSort('relation_type')}
                    >
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <strong>Loại quan hệ</strong>
                        {sortState.field === 'relation_type' && (
                          <span>{sortState.order === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </Stack>
                    </TableCell>
                    <TableCell 
                      sx={{ cursor: 'pointer', '&:hover': { backgroundColor: 'action.hover' } }}
                      onClick={() => handleSort('effective_from')}
                    >
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <strong>Hiệu lực từ</strong>
                        {sortState.field === 'effective_from' && (
                          <span>{sortState.order === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </Stack>
                    </TableCell>
                    <TableCell 
                      sx={{ cursor: 'pointer', '&:hover': { backgroundColor: 'action.hover' } }}
                      onClick={() => handleSort('effective_to')}
                    >
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <strong>Hiệu lực đến</strong>
                        {sortState.field === 'effective_to' && (
                          <span>{sortState.order === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </Stack>
                    </TableCell>
                    <TableCell>Ghi chú</TableCell>
                    <TableCell align="right">Thao tác</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {relations.map((relation) => {
                    const parent = getParentUnit(relation);
                    const child = getChildUnit(relation);
                    const RelationIcon = getRelationIcon(relation.relation_type);
                    
                    return (
                      <TableRow key={`${relation.parent_id}-${relation.child_id}-${relation.relation_type}-${relation.effective_from}`} hover>
                        <TableCell>
                          {parent ? (
                            <Stack direction="row" alignItems="center" spacing={1}>
                              <BusinessIcon color="primary" fontSize="small" />
                              <Box>
                                <Typography variant="body2" fontWeight="medium">
                                  {parent.name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {parent.code}
                                </Typography>
                              </Box>
                            </Stack>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              {relation.parent_id}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          {child ? (
                            <Stack direction="row" alignItems="center" spacing={1}>
                              <BusinessIcon color="primary" fontSize="small" />
                              <Box>
                                <Typography variant="body2" fontWeight="medium">
                                  {child.name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {child.code}
                                </Typography>
                              </Box>
                            </Stack>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              {relation.child_id}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <RelationIcon fontSize="small" color="primary" />
                            <Typography variant="body2">
                              {getRelationTypeLabel(relation.relation_type)}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {relation.effective_from 
                              ? new Date(relation.effective_from).toLocaleDateString('vi-VN')
                              : '—'
                            }
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {relation.effective_to 
                              ? new Date(relation.effective_to).toLocaleDateString('vi-VN')
                              : '—'
                            }
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {relation.note || '—'}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <Tooltip title="Chỉnh sửa">
                              <IconButton
                                size="small"
                                onClick={() => handleEditRelation(relation)}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Xóa">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDeleteRelation(relation)}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Add Dialog */}
      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Thêm quan hệ mới</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <Autocomplete
              options={units}
              getOptionLabel={(option) => `${option.name} (${option.code})`}
              value={units.find(u => u.id === formData.parent_id) || null}
              onChange={(_, newValue) => {
                setFormData({ ...formData, parent_id: newValue?.id || '' });
              }}
              renderInput={(params) => (
                <TextField {...params} label="Đơn vị cha" required />
              )}
            />

            <Autocomplete
              options={units.filter(u => u.id !== formData.parent_id)}
              getOptionLabel={(option) => `${option.name} (${option.code})`}
              value={units.find(u => u.id === formData.child_id) || null}
              onChange={(_, newValue) => {
                setFormData({ ...formData, child_id: newValue?.id || '' });
              }}
              renderInput={(params) => (
                <TextField {...params} label="Đơn vị con" required />
              )}
            />

            <FormControl fullWidth>
              <InputLabel>Loại quan hệ</InputLabel>
              <Select
                value={formData.relation_type}
                onChange={(e) => setFormData({ ...formData, relation_type: e.target.value as any })}
                label="Loại quan hệ"
              >
                {relationTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <MenuItem key={type.value} value={type.value}>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Icon fontSize="small" />
                        <Typography>{type.label}</Typography>
                      </Stack>
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              type="date"
              label="Hiệu lực từ"
              value={formData.effective_from}
              onChange={(e) => setFormData({ ...formData, effective_from: e.target.value })}
              InputLabelProps={{ shrink: true }}
              required
            />

            <TextField
              fullWidth
              type="date"
              label="Hiệu lực đến"
              value={formData.effective_to}
              onChange={(e) => setFormData({ ...formData, effective_to: e.target.value })}
              InputLabelProps={{ shrink: true }}
              helperText="Để trống nếu không giới hạn thời gian"
            />

            <TextField
              fullWidth
              multiline
              rows={3}
              label="Ghi chú"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Nhập ghi chú về quan hệ..."
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)}>Hủy</Button>
          <Button variant="contained" onClick={handleSaveAdd}>
            Thêm
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Chỉnh sửa quan hệ</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Loại quan hệ</InputLabel>
              <Select
                value={formData.relation_type}
                onChange={(e) => setFormData({ ...formData, relation_type: e.target.value as any })}
                label="Loại quan hệ"
              >
                {relationTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <MenuItem key={type.value} value={type.value}>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Icon fontSize="small" />
                        <Typography>{type.label}</Typography>
                      </Stack>
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              type="date"
              label="Hiệu lực từ"
              value={formData.effective_from}
              disabled
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              fullWidth
              type="date"
              label="Hiệu lực đến"
              value={formData.effective_to}
              onChange={(e) => setFormData({ ...formData, effective_to: e.target.value })}
              InputLabelProps={{ shrink: true }}
              helperText="Để trống nếu không giới hạn thời gian"
            />

            <TextField
              fullWidth
              multiline
              rows={3}
              label="Ghi chú"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Nhập ghi chú về quan hệ..."
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Hủy</Button>
          <Button variant="contained" onClick={handleSaveEdit}>
            Lưu
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Xác nhận xóa</DialogTitle>
        <DialogContent>
          <Typography>
            Bạn có chắc chắn muốn xóa quan hệ này không?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Hủy</Button>
          <Button variant="contained" color="error" onClick={handleConfirmDelete}>
            Xóa
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
