'use client';

import React, { useState, useEffect } from 'react';
import { API_ROUTES } from '@/constants/routes';
import { buildUrl } from '@/lib/api/api-handler';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  List,
  ListItem,
  ListItemText,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Stack,
  Divider,
  Alert,
  CircularProgress,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Business as BusinessIcon,
  CheckCircle as StatusIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';

interface OrgUnitType {
  id: string;
  code: string;
  name: string;
  description?: string;
  color: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

interface OrgUnitStatus {
  id: string;
  code: string;
  name: string;
  description?: string;
  color: string;
  is_active: boolean;
  workflow_step: number;
  created_at: string;
  updated_at: string;
}

export default function ConfigPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [types, setTypes] = useState<OrgUnitType[]>([]);
  const [statuses, setStatuses] = useState<OrgUnitStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<OrgUnitType | OrgUnitStatus | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    color: '#1976d2',
    sort_order: 0,
    workflow_step: 0,
    is_active: true,
  });

  // Fetch data
  const fetchTypes = async () => {
    try {
      const response = await fetch(buildUrl(API_ROUTES.ORG.TYPES, { include_inactive: true }));
      const result = await response.json();
      if (result.success) {
        setTypes(result.data);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to fetch types');
    }
  };

  const fetchStatuses = async () => {
    try {
      const response = await fetch(buildUrl(API_ROUTES.ORG.STATUSES, { include_inactive: true }));
      const result = await response.json();
      if (result.success) {
        setStatuses(result.data);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to fetch statuses');
    }
  };

  useEffect(() => {
    fetchTypes();
    fetchStatuses();
  }, []);

  const handleOpenDialog = (item?: OrgUnitType | OrgUnitStatus, isType: boolean = true) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        code: item.code,
        name: item.name,
        description: item.description || '',
        color: item.color,
        sort_order: 'sort_order' in item ? item.sort_order : 0,
        workflow_step: 'workflow_step' in item ? item.workflow_step : 0,
        is_active: item.is_active,
      });
    } else {
      setEditingItem(null);
      setFormData({
        code: '',
        name: '',
        description: '',
        color: isType ? '#1976d2' : '#757575',
        sort_order: 0,
        workflow_step: 0,
        is_active: true,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingItem(null);
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);

      const isType = activeTab === 0;
      const url = editingItem 
        ? `/api/org/${isType ? 'types' : 'statuses'}/${editingItem.id}`
        : `/api/org/${isType ? 'types' : 'statuses'}`;
      
      const method = editingItem ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        if (isType) {
          await fetchTypes();
        } else {
          await fetchStatuses();
        }
        handleCloseDialog();
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (item: OrgUnitType | OrgUnitStatus, isType: boolean) => {
    if (!confirm(`Are you sure you want to delete "${item.name}"?`)) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/org/${isType ? 'types' : 'statuses'}/${item.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        if (isType) {
          await fetchTypes();
        } else {
          await fetchStatuses();
        }
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Cấu hình tổ chức
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
        <Button
          variant={activeTab === 0 ? 'contained' : 'outlined'}
          onClick={() => setActiveTab(0)}
          startIcon={<BusinessIcon />}
        >
          Loại đơn vị
        </Button>
        <Button
          variant={activeTab === 1 ? 'contained' : 'outlined'}
          onClick={() => setActiveTab(1)}
          startIcon={<StatusIcon />}
        >
          Trạng thái đơn vị
        </Button>
      </Stack>

      {/* Types Tab */}
      {activeTab === 0 && (
        <Card>
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Typography variant="h6">Loại đơn vị</Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpenDialog(undefined, true)}
              >
                Thêm loại
              </Button>
            </Stack>

            <List>
              {types.map((type, index) => (
                <React.Fragment key={type.id}>
                  <ListItem>
                    <ListItemText
                      primary={
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                            {type.name}
                          </Typography>
                          <Chip label={type.code} size="small" variant="outlined" />
                          <Chip 
                            label={type.is_active ? 'Hoạt động' : 'Tạm dừng'} 
                            color={type.is_active ? 'success' : 'default'}
                            size="small" 
                          />
                          <Chip 
                            label={`Thứ tự: ${type.sort_order}`}
                            size="small"
                            variant="outlined"
                            color="info"
                          />
                        </Stack>
                      }
                      secondary={
                        <Box>
                          <Box component="span" sx={{ display: 'block', mb: 0.5 }}>
                            {type.description || 'Không có mô tả'}
                          </Box>
                          <Box component="span" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                            Tạo: {new Date(type.created_at).toLocaleDateString('vi-VN')}
                          </Box>
                        </Box>
                      }
                    />
                    <Stack direction="row" spacing={1}>
                      <IconButton 
                        size="small"
                        onClick={() => handleOpenDialog(type, true)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        color="error"
                        onClick={() => handleDelete(type, true)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Stack>
                  </ListItem>
                  {index < types.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </CardContent>
        </Card>
      )}

      {/* Statuses Tab */}
      {activeTab === 1 && (
        <Card>
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Typography variant="h6">Trạng thái đơn vị</Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpenDialog(undefined, false)}
              >
                Thêm trạng thái
              </Button>
            </Stack>

            <List>
              {statuses.map((status, index) => (
                <React.Fragment key={status.id}>
                  <ListItem>
                    <ListItemText
                      primary={
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                            {status.name}
                          </Typography>
                          <Chip label={status.code} size="small" variant="outlined" />
                          <Chip 
                            label={status.is_active ? 'Hoạt động' : 'Tạm dừng'} 
                            color={status.is_active ? 'success' : 'default'}
                            size="small" 
                          />
                          <Chip 
                            label={`Bước ${status.workflow_step}`}
                            size="small"
                            variant="outlined"
                            color="info"
                          />
                        </Stack>
                      }
                      secondary={
                        <Box>
                          <Box component="span" sx={{ display: 'block', mb: 0.5 }}>
                            {status.description || 'Không có mô tả'}
                          </Box>
                          <Box component="span" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                            Tạo: {new Date(status.created_at).toLocaleDateString('vi-VN')}
                          </Box>
                        </Box>
                      }
                    />
                    <Stack direction="row" spacing={1}>
                      <IconButton 
                        size="small"
                        onClick={() => handleOpenDialog(status, false)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        color="error"
                        onClick={() => handleDelete(status, false)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Stack>
                  </ListItem>
                  {index < statuses.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingItem ? 'Chỉnh sửa' : 'Thêm mới'} {activeTab === 0 ? 'loại đơn vị' : 'trạng thái đơn vị'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Mã"
              value={formData.code}
              onChange={(e) => handleInputChange('code', e.target.value.toUpperCase())}
              fullWidth
              required
            />
            <TextField
              label="Tên"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              fullWidth
              required
            />
            <TextField
              label="Mô tả"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              fullWidth
              multiline
              rows={2}
            />
            <TextField
              label="Màu sắc"
              type="color"
              value={formData.color}
              onChange={(e) => handleInputChange('color', e.target.value)}
              fullWidth
              InputProps={{ style: { height: '56px' } }}
            />
            {activeTab === 0 ? (
              <TextField
                label="Thứ tự sắp xếp"
                type="number"
                value={formData.sort_order}
                onChange={(e) => handleInputChange('sort_order', parseInt(e.target.value) || 0)}
                fullWidth
              />
            ) : (
              <TextField
                label="Bước workflow"
                type="number"
                value={formData.workflow_step}
                onChange={(e) => handleInputChange('workflow_step', parseInt(e.target.value) || 0)}
                fullWidth
              />
            )}
            <FormControlLabel
              control={
                <Switch
                  checked={formData.is_active}
                  onChange={(e) => handleInputChange('is_active', e.target.checked)}
                />
              }
              label="Trạng thái hoạt động"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} startIcon={<CancelIcon />}>
            Hủy
          </Button>
          <Button 
            onClick={handleSave} 
            variant="contained" 
            startIcon={<SaveIcon />}
            disabled={loading || !formData.code || !formData.name}
          >
            {loading ? 'Đang lưu...' : 'Lưu'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}