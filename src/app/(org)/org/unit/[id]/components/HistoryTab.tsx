'use client';

import React, { useState } from 'react';
import { API_ROUTES } from '@/constants/routes';
import { buildUrl } from '@/lib/api/api-handler';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Stack,
  CircularProgress,
  Alert,
  AlertTitle,
  Chip,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Avatar,
  Paper,
  Divider,
  Tooltip,
} from '@mui/material';
import {
  History as HistoryIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  SwapHoriz as SwapIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { type OrgUnitHistory } from '@/features/org/api/api';

interface HistoryTabProps {
  unitId: string;
}

// Timeline utility functions
const getChangeIcon = (changeType: string) => {
  switch (changeType) {
    case 'create': return AddIcon;
    case 'update': return EditIcon;
    case 'delete': return DeleteIcon;
    case 'status_change': return SwapIcon;
    case 'name_change': return EditIcon;
    case 'parent_change': return SwapIcon;
    case 'type_change': return SwapIcon;
    default: return HistoryIcon;
  }
};

const getChangeTypeColor = (changeType: string) => {
  switch (changeType) {
    case 'create': return '#4caf50';
    case 'update': return '#2196f3';
    case 'delete': return '#f44336';
    case 'status_change': return '#ff9800';
    case 'name_change': return '#9c27b0';
    case 'parent_change': return '#607d8b';
    case 'type_change': return '#795548';
    default: return '#757575';
  }
};

const getChangeTypeLabel = (changeType: string) => {
  switch (changeType) {
    case 'create': return 'Tạo mới';
    case 'update': return 'Cập nhật';
    case 'delete': return 'Xóa';
    case 'status_change': return 'Thay đổi trạng thái';
    case 'name_change': return 'Thay đổi tên';
    case 'parent_change': return 'Thay đổi đơn vị cha';
    case 'type_change': return 'Thay đổi loại';
    default: return changeType;
  }
};

const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'Vừa xong';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} phút trước`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} giờ trước`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} ngày trước`;
  
  return date.toLocaleDateString('vi-VN');
};

export default function HistoryTab({ unitId }: HistoryTabProps) {
  const [filters, setFilters] = useState({
    change_type: '',
    page: 1,
    size: 20,
  });

  // State for history data
  const [historyResponse, setHistoryResponse] = useState<{ [key: string]: unknown } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch history data
  const fetchHistoryData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(buildUrl(API_ROUTES.ORG.HISTORY, {
        org_unit_id: unitId,
        page: filters.page,
        size: filters.size,
        sort: 'changed_at',
        order: 'desc',
        ...(filters.change_type && { change_type: filters.change_type }),
      }));
      const data = await response.json();
      
      if (data.success) {
        setHistoryResponse(data.data);
      } else {
        setError('Failed to fetch history');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch history');
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on mount and when filters change
  React.useEffect(() => {
    if (unitId) {
      fetchHistoryData();
    }
  }, [unitId, filters.change_type, filters.page, filters.size]);

  const history = historyResponse?.items || [];

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [field]: value,
      page: 1, // Reset to first page when filter changes
    }));
  };

  const handleRefresh = () => {
    fetchHistoryData();
  };

  return (
    <Box>
      {/* Header Section */}
      <Box sx={{ mb: 4 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold', background: 'linear-gradient(135deg, #ff9800 0%, #ffc107 100%)', backgroundClip: 'text', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Lịch sử thay đổi
          </Typography>
          
          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            disabled={loading}
            sx={{ 
              minWidth: 140,
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 'bold',
              boxShadow: 2,
              backgroundColor: '#ff9800',
              '&:hover': {
                backgroundColor: '#f57c00',
                boxShadow: 4,
                transform: 'translateY(-2px)',
              },
              transition: 'all 0.3s ease-in-out'
            }}
          >
            Làm mới
          </Button>
        </Stack>
        
        {/* Stats Summary */}
        <Card sx={{ 
          background: 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)',
          borderRadius: 3,
          overflow: 'hidden',
          boxShadow: 3,
          mb: 3
        }}>
          <CardContent sx={{ p: 3 }}>
            <Stack direction="row" alignItems="center" spacing={3}>
              <Avatar sx={{ backgroundColor: '#ff9800', width: 60, height: 60 }}>
                <HistoryIcon sx={{ fontSize: 30 }} />
              </Avatar>
              
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#e65100', mb: 1 }}>
                  Tổng quan lịch sử
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Đã có <strong>{history.length}</strong> thay đổi được ghi nhận
                  {filters.change_type && (
                    <span> • Lọc theo: <strong>{getChangeTypeLabel(filters.change_type)}</strong></span>
                  )}
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Box>

      {/* Filters */}
      <Card sx={{ 
        mb: 3,
        borderRadius: 3,
        boxShadow: 2,
        border: '1px solid',
        borderColor: 'divider'
      }}>
        <CardContent sx={{ p: 3 }}>
          <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
            <Avatar sx={{ backgroundColor: '#9c27b0', width: 40, height: 40 }}>
              <FilterIcon />
            </Avatar>
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#9c27b0' }}>
              Bộ lọc
            </Typography>
          </Stack>
          
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3}>
            <FormControl fullWidth size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Loại thay đổi</InputLabel>
              <Select
                value={filters.change_type}
                label="Loại thay đổi"
                onChange={(e) => handleFilterChange('change_type', e.target.value)}
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value="">Tất cả</MenuItem>
                <MenuItem value="create">Tạo mới</MenuItem>
                <MenuItem value="update">Cập nhật</MenuItem>
                <MenuItem value="delete">Xóa</MenuItem>
                <MenuItem value="status_change">Thay đổi trạng thái</MenuItem>
                <MenuItem value="name_change">Thay đổi tên</MenuItem>
                <MenuItem value="parent_change">Thay đổi đơn vị cha</MenuItem>
                <MenuItem value="type_change">Thay đổi loại</MenuItem>
              </Select>
            </FormControl>
            
            <FormControl fullWidth size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Số lượng hiển thị</InputLabel>
              <Select
                value={filters.size}
                label="Số lượng hiển thị"
                onChange={(e) => handleFilterChange('size', e.target.value.toString())}
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value={10}>10</MenuItem>
                <MenuItem value={20}>20</MenuItem>
                <MenuItem value={50}>50</MenuItem>
                <MenuItem value={100}>100</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card sx={{ 
        borderRadius: 3,
        boxShadow: 2,
        border: '1px solid',
        borderColor: 'divider'
      }}>
        <CardContent sx={{ p: 3 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <Stack alignItems="center" spacing={2}>
                <CircularProgress size={40} />
                <Typography variant="body2" color="text.secondary">
                  Đang tải lịch sử...
                </Typography>
              </Stack>
            </Box>
          ) : error ? (
            <Alert severity="error" sx={{ borderRadius: 2 }}>
              <AlertTitle>Lỗi</AlertTitle>
              {error || 'Có lỗi xảy ra khi tải lịch sử'}
            </Alert>
          ) : history.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <Avatar sx={{ backgroundColor: 'text.secondary', width: 80, height: 80, mx: 'auto', mb: 3 }}>
                <HistoryIcon sx={{ fontSize: 40 }} />
              </Avatar>
              <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                Không có lịch sử thay đổi
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Chưa có thay đổi nào được ghi nhận cho đơn vị này
              </Typography>
            </Box>
          ) : (
            <Box>
              {/* Timeline Header */}
              <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
                <Avatar sx={{ backgroundColor: '#2196f3', width: 40, height: 40 }}>
                  <ScheduleIcon />
                </Avatar>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#2196f3' }}>
                  Timeline ({history.length} thay đổi)
                </Typography>
              </Stack>

              {/* Timeline Items */}
              <Box sx={{ position: 'relative' }}>
                {/* Timeline Line */}
                <Box
                  sx={{
                    position: 'absolute',
                    left: 24,
                    top: 0,
                    bottom: 0,
                    width: 2,
                    backgroundColor: '#e0e0e0',
                    borderRadius: 1,
                  }}
                />

                <Stack spacing={3}>
                  {history.map((record: OrgUnitHistory, index: number) => {
                    const ChangeIcon = getChangeIcon(record.change_type);
                    const color = getChangeTypeColor(record.change_type);
                    
                    return (
                      <Box
                        key={record.id}
                        sx={{
                          position: 'relative',
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 3,
                        }}
                      >
                        {/* Timeline Dot */}
                        <Box
                          sx={{
                            position: 'relative',
                            zIndex: 1,
                            width: 48,
                            height: 48,
                            borderRadius: '50%',
                            backgroundColor: 'white',
                            border: `3px solid ${color}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: 2,
                          }}
                        >
                          <ChangeIcon sx={{ color, fontSize: 20 }} />
                        </Box>

                        {/* Content Card */}
                        <Card
                          sx={{
                            flex: 1,
                            borderRadius: 2,
                            border: '1px solid',
                            borderColor: 'divider',
                            boxShadow: 1,
                            transition: 'all 0.3s ease-in-out',
                            '&:hover': {
                              boxShadow: 3,
                              transform: 'translateY(-2px)',
                            },
                          }}
                        >
                          <CardContent sx={{ p: 3 }}>
                            <Stack spacing={2}>
                              {/* Header */}
                              <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                                <Stack spacing={1}>
                                  <Stack direction="row" alignItems="center" spacing={2}>
                                    <Chip
                                      label={getChangeTypeLabel(record.change_type)}
                                      size="small"
                                      sx={{
                                        backgroundColor: color,
                                        color: 'white',
                                        fontWeight: 'bold',
                                      }}
                                    />
                                    <Tooltip title={record.changed_at ? new Date(record.changed_at).toLocaleString('vi-VN') : 'Không xác định'}>
                                      <Typography variant="body2" color="text.secondary">
                                        {record.changed_at ? formatTimeAgo(record.changed_at) : 'Không xác định'}
                                      </Typography>
                                    </Tooltip>
                                  </Stack>
                                </Stack>
                                
                                <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                                  #{record.id}
                                </Typography>
                              </Stack>

                              {/* Changes */}
                              <Box>
                                {record.old_name && record.new_name && (
                                  <Box sx={{ mb: 2 }}>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 'bold' }}>
                                      Thay đổi tên:
                                    </Typography>
                                    <Stack direction="row" alignItems="center" spacing={2} sx={{ 
                                      p: 2, 
                                      backgroundColor: '#f8f9fa', 
                                      borderRadius: 2,
                                      border: '1px solid #e9ecef'
                                    }}>
                                      <Box sx={{ flex: 1 }}>
                                        <Typography variant="caption" color="text.secondary">
                                          Từ:
                                        </Typography>
                                        <Typography variant="body2" sx={{ 
                                          textDecoration: 'line-through', 
                                          color: '#d32f2f',
                                          fontWeight: 'bold'
                                        }}>
                                          {record.old_name}
                                        </Typography>
                                      </Box>
                                      <SwapIcon sx={{ color: '#666' }} />
                                      <Box sx={{ flex: 1 }}>
                                        <Typography variant="caption" color="text.secondary">
                                          Thành:
                                        </Typography>
                                        <Typography variant="body2" sx={{ 
                                          color: '#2e7d32', 
                                          fontWeight: 'bold'
                                        }}>
                                          {record.new_name}
                                        </Typography>
                                      </Box>
                                    </Stack>
                                  </Box>
                                )}

                                {record.details && (
                                  <Box>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 'bold' }}>
                                      Chi tiết:
                                    </Typography>
                                    <Paper
                                      variant="outlined"
                                      sx={{
                                        p: 2,
                                        backgroundColor: '#f8f9fa',
                                        borderRadius: 2,
                                        fontFamily: 'monospace',
                                        fontSize: '0.875rem',
                                        overflow: 'auto',
                                        maxHeight: 200,
                                      }}
                                    >
                                      <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                                        {JSON.stringify(record.details, null, 2)}
                                      </pre>
                                    </Paper>
                                  </Box>
                                )}

                                {record.details?.note && (
                                  <Box sx={{ mt: 2 }}>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 'bold' }}>
                                      Ghi chú:
                                    </Typography>
                                    <Typography 
                                      variant="body2" 
                                      sx={{ 
                                        p: 2, 
                                        backgroundColor: '#e3f2fd', 
                                        borderRadius: 2,
                                        border: '1px solid #bbdefb'
                                      }}
                                    >
                                      {record.details.note}
                                    </Typography>
                                  </Box>
                                )}
                              </Box>
                            </Stack>
                          </CardContent>
                        </Card>
                      </Box>
                    );
                  })}
                </Stack>
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
