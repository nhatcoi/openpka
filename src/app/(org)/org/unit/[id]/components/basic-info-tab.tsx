'use client';

import React, { useState, useEffect } from 'react';
import { API_ROUTES } from '@/constants/routes';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Stack,
  Grid,
  Chip,
  Avatar,
  Button,
  IconButton,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Business as BusinessIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  CalendarToday as CalendarIcon,
  Analytics as AnalyticsIcon,
  People as PeopleIcon,
} from '@mui/icons-material';
import { type OrgUnit } from '@/features/org/api/api';
import { getTypeColor, getTypeIcon } from '@/utils/org-unit-utils';

interface BasicInfoTabProps {
  unit: OrgUnit;
  onUpdate: (updatedUnit: Partial<OrgUnit>) => Promise<void>;
}

interface EditFormData {
  name: string;
  code: string;
  type: string;
  status: string;
  description: string;
  effective_from: string;
  effective_to: string;
}

export default function BasicInfoTab({ unit, onUpdate }: BasicInfoTabProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editData, setEditData] = useState<EditFormData>({
    name: unit.name,
    code: unit.code,
    type: unit.type || '',
    status: unit.status || '',
    description: unit.description || '',
    effective_from: unit.effective_from ? String(unit.effective_from).split('T')[0] : '',
    effective_to: unit.effective_to ? String(unit.effective_to).split('T')[0] : '',
  });

  const [orgUnitTypes, setOrgUnitTypes] = useState<Array<{ value: string; label: string }>>([]);
  const [orgUnitStatuses, setOrgUnitStatuses] = useState<Array<{ value: string; label: string }>>([]);
  const [typesLoading, setTypesLoading] = useState(false);
  const [statusesLoading, setStatusesLoading] = useState(false);

  // Fetch org unit types
  const fetchOrgUnitTypes = async () => {
    try {
      setTypesLoading(true);
      const response = await fetch(API_ROUTES.ORG.TYPES);
      const result = await response.json();
      
      if (result.success) {
        const types = result.data.map((type: any) => ({
          value: type.code, // Use code as value instead of ID
          label: `${type.name} (${type.code})`
        }));
        setOrgUnitTypes(types);
      }
    } catch (err) {
      console.error('Failed to fetch org unit types:', err);
    } finally {
      setTypesLoading(false);
    }
  };

  // Fetch org unit statuses
  const fetchOrgUnitStatuses = async () => {
    try {
      setStatusesLoading(true);
      const response = await fetch(API_ROUTES.ORG.STATUSES);
      const result = await response.json();
      
      if (result.success) {
        const statuses = result.data.map((status: any) => ({
          value: status.code, // Use code as value instead of ID
          label: `${status.name} (${status.code})`
        }));
        setOrgUnitStatuses(statuses);
      }
    } catch (err) {
      console.error('Failed to fetch org unit statuses:', err);
    } finally {
      setStatusesLoading(false);
    }
  };

  // Fetch data only when needed (on edit)
  // useEffect removed - will fetch on demand

  // Helper functions to get type and status names
  const getTypeName = (typeCode: string | null) => {
    if (!typeCode) return 'Chưa xác định';
    const type = orgUnitTypes.find(t => t.value === typeCode);
    return type ? type.label : typeCode; // Show code if no data available yet
  };

  const getStatusName = (statusCode: string | null) => {
    if (!statusCode) return 'Chưa xác định';
    const status = orgUnitStatuses.find(s => s.value === statusCode);
    return status ? status.label : statusCode; // Show code if no data available yet
  };

  const handleEdit = async () => {
    setIsEditing(true);
    setError(null);
    setSuccess(null);
    
    // Fetch data when user starts editing
    await Promise.all([
      fetchOrgUnitTypes(),
      fetchOrgUnitStatuses()
    ]);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData({
      name: unit.name,
      code: unit.code,
      type: unit.type || '',
      status: unit.status || '',
      description: unit.description || '',
      effective_from: unit.effective_from ? new Date(unit.effective_from).toISOString().split('T')[0] : '',
      effective_to: unit.effective_to ? new Date(unit.effective_to).toISOString().split('T')[0] : '',
    });
    setError(null);
    setSuccess(null);
  };

  const handleSave = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Prepare update data
      const updateData: Partial<OrgUnit> = {
        name: editData.name,
        code: editData.code,
        type: editData.type || null,
        status: editData.status || null,
        description: editData.description || null,
        effective_from: editData.effective_from ? new Date(editData.effective_from).toISOString() : null,
        effective_to: editData.effective_to ? new Date(editData.effective_to).toISOString() : null,
      };

      await onUpdate(updateData);
      
      setIsEditing(false);
      setSuccess('Cập nhật thông tin thành công!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra khi cập nhật');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof EditFormData, value: string) => {
    setEditData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <Box>
      {/* Header Section */}
      <Box sx={{ mb: 4 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold', background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)', backgroundClip: 'text', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Thông tin cơ bản
          </Typography>
          
          {!isEditing ? (
            <Button
              variant="contained"
              startIcon={<EditIcon />}
              onClick={handleEdit}
              sx={{ 
                minWidth: 140,
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 'bold',
                boxShadow: 2,
                '&:hover': {
                  boxShadow: 4,
                  transform: 'translateY(-2px)',
                },
                transition: 'all 0.3s ease-in-out'
              }}
            >
              Chỉnh sửa
            </Button>
          ) : (
            <Stack direction="row" spacing={2}>
              <Button
                variant="outlined"
                startIcon={<CancelIcon />}
                onClick={handleCancel}
                disabled={isLoading}
                sx={{ 
                  minWidth: 100,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 'bold'
                }}
              >
                Hủy
              </Button>
              <Button
                variant="contained"
                startIcon={isLoading ? <CircularProgress size={16} /> : <SaveIcon />}
                onClick={handleSave}
                disabled={isLoading}
                sx={{ 
                  minWidth: 140,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 'bold',
                  boxShadow: 2,
                  '&:hover': {
                    boxShadow: 4,
                    transform: 'translateY(-2px)',
                  },
                  transition: 'all 0.3s ease-in-out'
                }}
              >
                {isLoading ? 'Đang lưu...' : 'Lưu thay đổi'}
              </Button>
            </Stack>
          )}
        </Stack>
        
        {/* Unit Avatar & Basic Info Header */}
        <Card sx={{ 
          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
          borderRadius: 3,
          overflow: 'hidden',
          boxShadow: 3
        }}>
          <CardContent sx={{ p: 3 }}>
            <Stack direction="row" alignItems="center" spacing={3}>
              <Avatar
                sx={{
                  width: 80,
                  height: 80,
                  backgroundColor: getTypeColor(unit.type || ''),
                  boxShadow: 4,
                  border: '4px solid white'
                }}
              >
                {React.createElement(getTypeIcon(unit.type || ''), { sx: { fontSize: 40 } })}
              </Avatar>
              
              <Box sx={{ flex: 1 }}>
                <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1, color: '#1976d2' }}>
                  {unit.name}
                </Typography>
                <Typography variant="h6" sx={{ fontFamily: 'monospace', color: '#666', mb: 2 }}>
                  {unit.code}
                </Typography>
                
                <Stack direction="row" spacing={2}>
                  <Chip
                    label={getTypeName(unit.type)}
                    size="small"
                    sx={{
                      backgroundColor: getTypeColor(unit.type || ''),
                      color: 'white',
                      fontWeight: 'bold',
                      boxShadow: 1
                    }}
                  />
                  <Chip
                    label={getStatusName(unit.status)}
                    size="small"
                    sx={{
                      backgroundColor: unit.status === 'ACTIVE' ? '#4caf50' : '#ff9800',
                      color: 'white',
                      fontWeight: 'bold',
                      boxShadow: 1
                    }}
                  />
                </Stack>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Box>

      {/* Alerts */}
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

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 3 }}>
        {/* Basic Information */}
        <Card sx={{ 
          borderRadius: 3,
          boxShadow: 2,
          border: '1px solid',
          borderColor: 'divider',
          transition: 'all 0.3s ease-in-out',
          '&:hover': {
            boxShadow: 4,
            transform: 'translateY(-2px)',
          }
        }}>
          <CardContent sx={{ p: 3 }}>
            <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
              <Avatar sx={{ backgroundColor: '#1976d2', width: 40, height: 40 }}>
                <BusinessIcon />
              </Avatar>
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                Thông tin chính
              </Typography>
            </Stack>
            
            <Stack spacing={3}>
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 'bold' }}>
                    Tên đơn vị
                  </Typography>
                  {isEditing ? (
                    <TextField
                      fullWidth
                      size="small"
                      value={editData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Nhập tên đơn vị"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#1976d2',
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#1976d2',
                          },
                        },
                      }}
                    />
                  ) : (
                    <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#1976d2', p: 1.5, backgroundColor: '#f5f7fa', borderRadius: 2 }}>
                      {unit.name}
                    </Typography>
                  )}
                </Box>

                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 'bold' }}>
                    Mã đơn vị
                  </Typography>
                  {isEditing ? (
                    <TextField
                      fullWidth
                      size="small"
                      value={editData.code}
                      onChange={(e) => handleInputChange('code', e.target.value)}
                      placeholder="Nhập mã đơn vị"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#1976d2',
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#1976d2',
                          },
                        },
                      }}
                    />
                  ) : (
                    <Typography variant="body1" sx={{ fontFamily: 'monospace', fontWeight: 'bold', color: '#666', p: 1.5, backgroundColor: '#f5f7fa', borderRadius: 2 }}>
                      {unit.code}
                    </Typography>
                  )}
                </Box>

                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Loại đơn vị
                  </Typography>
                  {isEditing ? (
                    <FormControl fullWidth size="small">
                      <Select
                        value={editData.type}
                        onChange={(e) => handleInputChange('type', e.target.value)}
                        displayEmpty
                        disabled={typesLoading}
                      >
                        <MenuItem value="">
                          <em>Chọn loại đơn vị</em>
                        </MenuItem>
                        {orgUnitTypes.map((type) => (
                          <MenuItem key={type.value} value={type.value}>
                            {type.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  ) : (
                    <Chip
                      label={getTypeName(unit.type)}
                      size="small"
                      sx={{
                        backgroundColor: getTypeColor(unit.type || ''),
                        color: 'white',
                        fontSize: '0.75rem',
                      }}
                    />
                  )}
                </Box>

                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Trạng thái
                  </Typography>
                  {isEditing ? (
                    <FormControl fullWidth size="small">
                      <Select
                        value={editData.status}
                        onChange={(e) => handleInputChange('status', e.target.value)}
                        displayEmpty
                        disabled={statusesLoading}
                      >
                        <MenuItem value="">
                          <em>Chọn trạng thái</em>
                        </MenuItem>
                        {orgUnitStatuses.map((status) => (
                          <MenuItem key={status.value} value={status.value}>
                            {status.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  ) : (
                    <Chip
                      label={getStatusName(unit.status)}
                      size="small"
                      sx={{
                        backgroundColor: getTypeColor(unit.status || ''),
                        color: 'white',
                        fontSize: '0.75rem',
                      }}
                    />
                  )}
                </Box>

                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Mô tả
                  </Typography>
                  {isEditing ? (
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      size="small"
                      value={editData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="Nhập mô tả đơn vị"
                    />
                  ) : (
                    <Typography variant="body1">
                      {unit.description || 'Chưa có mô tả'}
                    </Typography>
                  )}
                </Box>
            </Stack>
          </CardContent>
        </Card>

        {/* Dates and Hierarchy */}
        <Card sx={{ 
          borderRadius: 3,
          boxShadow: 2,
          border: '1px solid',
          borderColor: 'divider',
          transition: 'all 0.3s ease-in-out',
          '&:hover': {
            boxShadow: 4,
            transform: 'translateY(-2px)',
          }
        }}>
          <CardContent sx={{ p: 3 }}>
            <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
              <Avatar sx={{ backgroundColor: '#42a5f5', width: 40, height: 40 }}>
                <CalendarIcon />
              </Avatar>
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#42a5f5' }}>
                Thời gian & Phân cấp
              </Typography>
            </Stack>
              
              <Stack spacing={3}>
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Có hiệu lực từ
                  </Typography>
                  {isEditing ? (
                    <TextField
                      fullWidth
                      type="date"
                      size="small"
                      value={editData.effective_from}
                      onChange={(e) => handleInputChange('effective_from', e.target.value)}
                      InputLabelProps={{ shrink: true }}
                    />
                  ) : (
                    <Typography variant="body1">
                      {unit.effective_from ? new Date(unit.effective_from).toLocaleDateString('vi-VN') : 'Chưa xác định'}
                    </Typography>
                  )}
                </Box>

                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Có hiệu lực đến
                  </Typography>
                  {isEditing ? (
                    <TextField
                      fullWidth
                      type="date"
                      size="small"
                      value={editData.effective_to}
                      onChange={(e) => handleInputChange('effective_to', e.target.value)}
                      InputLabelProps={{ shrink: true }}
                    />
                  ) : (
                    <Typography variant="body1">
                      {unit.effective_to ? new Date(unit.effective_to).toLocaleDateString('vi-VN') : 'Không giới hạn'}
                    </Typography>
                  )}
                </Box>

                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Ngày tạo
                  </Typography>
                  <Typography variant="body1">
                    {new Date(unit.created_at).toLocaleString('vi-VN')}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Cập nhật lần cuối
                  </Typography>
                  <Typography variant="body1">
                    {new Date(unit.updated_at).toLocaleString('vi-VN')}
                  </Typography>
                </Box>

                {unit.parent && (
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Đơn vị cha
                    </Typography>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Avatar sx={{ backgroundColor: getTypeColor(unit.parent.type || ''), width: 24, height: 24 }}>
                        {React.createElement(getTypeIcon(unit.parent.type || ''), { fontSize: 'small' })}
                      </Avatar>
                      <Typography variant="body1">
                        {unit.parent.name} ({unit.parent.code})
                      </Typography>
                    </Stack>
                  </Box>
                )}

                {unit.parent_id && !unit.parent && (
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      ID đơn vị cha
                    </Typography>
                    <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>
                      {unit.parent_id}
                    </Typography>
                  </Box>
                )}
              </Stack>
            </CardContent>
          </Card>

        {/* Statistics */}
        <Card sx={{ 
          gridColumn: '1 / -1',
          borderRadius: 3,
          boxShadow: 2,
          border: '1px solid',
          borderColor: 'divider',
          transition: 'all 0.3s ease-in-out',
          '&:hover': {
            boxShadow: 4,
            transform: 'translateY(-2px)',
          }
        }}>
          {/* <CardContent sx={{ p: 3 }}>
            <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
              <Avatar sx={{ backgroundColor: '#ff9800', width: 40, height: 40 }}>
                <AnalyticsIcon />
              </Avatar>
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#ff9800' }}>
                Thống kê tổng quan
              </Typography>
            </Stack>
            
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' }, gap: 3 }}>
              <Box sx={{ textAlign: 'center', p: 2, backgroundColor: '#f8f9fa', borderRadius: 2 }}>
                <Avatar sx={{ backgroundColor: '#1976d2', mx: 'auto', mb: 2, width: 50, height: 50 }}>
                  <BusinessIcon sx={{ fontSize: 24 }} />
                </Avatar>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1976d2', mb: 1 }}>
                  {unit.children?.length || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                  Đơn vị con
                </Typography>
              </Box>

              <Box sx={{ textAlign: 'center', p: 2, backgroundColor: '#f8f9fa', borderRadius: 2 }}>
                <Avatar sx={{ backgroundColor: '#2e7d32', mx: 'auto', mb: 2, width: 50, height: 50 }}>
                  <PeopleIcon sx={{ fontSize: 24 }} />
                </Avatar>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#2e7d32', mb: 1 }}>
                  {unit.Employee?.length || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                  Tổng nhân viên
                </Typography>
              </Box>

              <Box sx={{ textAlign: 'center', p: 2, backgroundColor: '#f8f9fa', borderRadius: 2 }}>
                <Avatar sx={{ backgroundColor: '#ed6c02', mx: 'auto', mb: 2, width: 50, height: 50 }}>
                  <BusinessIcon sx={{ fontSize: 24 }} />
                </Avatar>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#ed6c02', mb: 1 }}>
                  {unit.parentRelations?.length || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                  Quan hệ cấp trên
                </Typography>
              </Box>

              <Box sx={{ textAlign: 'center', p: 2, backgroundColor: '#f8f9fa', borderRadius: 2 }}>
                <Avatar sx={{ backgroundColor: '#9c27b0', mx: 'auto', mb: 2, width: 50, height: 50 }}>
                  <BusinessIcon sx={{ fontSize: 24 }} />
                </Avatar>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#9c27b0', mb: 1 }}>
                  {unit.childRelations?.length || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                  Quan hệ cấp dưới
                </Typography>
              </Box>
            </Box>
          </CardContent> */}
        </Card>
      </Box>
    </Box>
  );
}