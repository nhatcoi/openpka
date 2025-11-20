'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  AlertTitle,
  CircularProgress,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  TextField,
  InputAdornment,
  Stack,
  Divider,
  Breadcrumbs,
  Link as MuiLink,
} from '@mui/material';
import {
  History as HistoryIcon,
  Visibility as ViewIcon,
  RemoveRedEye as EyeIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Close as XIcon,
} from '@mui/icons-material';

interface OrgUnit {
  id: string;
  name: string;
  code: string;
  type: string | null;
  status: string | null;
  description: string | null;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
}

interface HistoryItem {
  id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  change_summary?: string;
  change_details?: {
    fields?: string[];
    changes?: Record<string, { old_value: any; new_value: any }>;
    initial_values?: any;
    deleted_values?: any;
    metadata?: any;
  };
  actor_id?: string;
  actor_name?: string;
  user_agent?: string;
  metadata?: any;
  created_at: string;
}

export default function CreateAuditPage() {
  const router = useRouter();
  const [units, setUnits] = useState<OrgUnit[]>([]);
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<OrgUnit | null>(null);
  const [openHistoryDialog, setOpenHistoryDialog] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<HistoryItem | null>(null);
  
  const [filters, setFilters] = useState({
    status: '',
    type: '',
    page: 1,
    size: 50,
    sort: 'created_at',
    order: 'desc' as 'asc' | 'desc',
  });

  const [historyFilters, setHistoryFilters] = useState({
    action: '',
    search: '',
    page: 1,
    limit: 100,
  });

  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchUnits();
  }, [filters]);

  useEffect(() => {
    if (openHistoryDialog && selectedUnit) {
      fetchHistory(selectedUnit.id);
    }
  }, [openHistoryDialog, selectedUnit, historyFilters]);

  const fetchUnits = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const queryParams = new URLSearchParams();
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.type) queryParams.append('type', filters.type);
      queryParams.append('page', filters.page.toString());
      queryParams.append('size', filters.size.toString());
      queryParams.append('sort', filters.sort);
      queryParams.append('order', filters.order);

      const response = await fetch(`/api/org/units?${queryParams.toString()}`);
      const data = await response.json();
      
      if (data.success) {
        const items = data.data?.items || data.data || [];
        setUnits(Array.isArray(items) ? items : []);
      } else {
        setError(data.error || 'Failed to fetch units');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch units');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchHistory = async (unitId: string) => {
    if (!unitId) return;
    
    try {
      setHistoryLoading(true);
      
      const queryParams = new URLSearchParams();
      queryParams.append('entity_id', unitId);
      queryParams.append('page', historyFilters.page.toString());
      queryParams.append('limit', historyFilters.limit.toString());
      if (historyFilters.action) queryParams.append('action', historyFilters.action);
      if (historyFilters.search) queryParams.append('search', historyFilters.search);

      const response = await fetch(`/api/org/units/history?${queryParams.toString()}`);
      const data = await response.json();
      
      if (data.success) {
        setHistoryItems(data.data.items || []);
        setTotalPages(data.data.pagination?.totalPages || 1);
      } else {
        setError(data.error || 'Failed to fetch history');
      }
    } catch (err) {
      console.error('Error fetching history:', err);
      setHistoryItems([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleOpenHistoryDialog = (unit: OrgUnit) => {
    setSelectedUnit(unit);
    setOpenHistoryDialog(true);
    setHistoryFilters({ ...historyFilters, page: 1 });
  };

  const handleCloseHistoryDialog = () => {
    setOpenHistoryDialog(false);
    setSelectedUnit(null);
    setHistoryItems([]);
  };

  const handleRowClick = (item: HistoryItem) => {
    setSelectedHistoryItem(item);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedHistoryItem(null);
  };

  const getActionColor = (action: string) => {
    switch (action.toUpperCase()) {
      case 'CREATE': return 'success';
      case 'UPDATE': return 'info';
      case 'DELETE': return 'error';
      default: return 'default';
    }
  };

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return '—';
    if (typeof value === 'object') {
      try {
        return JSON.stringify(value, null, 2);
      } catch {
        return String(value);
      }
    }
    return String(value);
  };

  const getStatusLabel = (status: string | null) => {
    if (!status) return '—';
    const statusMap: Record<string, string> = {
      'DRAFT': 'Nháp',
      'REVIEWING': 'Đang xem xét',
      'APPROVED': 'Đã phê duyệt',
      'ACTIVE': 'Đang hoạt động',
      'REJECTED': 'Bị từ chối',
      'INACTIVE': 'Không hoạt động',
      'SUSPENDED': 'Tạm dừng',
      'ARCHIVED': 'Đã lưu trữ',
    };
    return statusMap[status] || status;
  };

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
        <Typography color="text.primary">Lịch sử thay đổi</Typography>
      </Breadcrumbs>

      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 1 }}>
          Lịch sử thay đổi
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Xem lịch sử thay đổi của các đơn vị trong hệ thống
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={fetchUnits}
          disabled={isLoading}
        >
          Làm mới
        </Button>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Trạng thái</InputLabel>
              <Select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
                label="Trạng thái"
              >
                <MenuItem value="">Tất cả</MenuItem>
                <MenuItem value="DRAFT">Nháp</MenuItem>
                <MenuItem value="REVIEWING">Đang xem xét</MenuItem>
                <MenuItem value="APPROVED">Đã phê duyệt</MenuItem>
                <MenuItem value="ACTIVE">Đang hoạt động</MenuItem>
                <MenuItem value="REJECTED">Bị từ chối</MenuItem>
                <MenuItem value="INACTIVE">Không hoạt động</MenuItem>
                <MenuItem value="SUSPENDED">Tạm dừng</MenuItem>
                <MenuItem value="ARCHIVED">Đã lưu trữ</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Loại</InputLabel>
              <Select
                value={filters.type}
                onChange={(e) => setFilters({ ...filters, type: e.target.value, page: 1 })}
                label="Loại"
              >
                <MenuItem value="">Tất cả</MenuItem>
                <MenuItem value="FACULTY">Khoa</MenuItem>
                <MenuItem value="DEPARTMENT">Bộ môn</MenuItem>
                <MenuItem value="OFFICE">Văn phòng</MenuItem>
                <MenuItem value="CENTER">Trung tâm</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent>
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : units.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <Typography variant="body2" color="text.secondary">
                Không có đơn vị nào
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Tên đơn vị</TableCell>
                    <TableCell>Mã code</TableCell>
                    <TableCell>Loại</TableCell>
                    <TableCell>Trạng thái</TableCell>
                    <TableCell>Ngày tạo</TableCell>
                    <TableCell align="right">Thao tác</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {units.map((unit) => (
                    <TableRow key={unit.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {unit.name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {unit.code}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={unit.type || '—'} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={getStatusLabel(unit.status)} 
                          size="small" 
                          color={getActionColor(unit.status || '') as any}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {new Date(unit.created_at).toLocaleDateString('vi-VN')}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <IconButton
                            size="small"
                            onClick={() => router.push(`/org/unit/${unit.id}`)}
                            title="Xem chi tiết"
                          >
                            <ViewIcon fontSize="small" />
                          </IconButton>
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<HistoryIcon />}
                            onClick={() => handleOpenHistoryDialog(unit)}
                          >
                            Lịch sử
                          </Button>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* History Dialog */}
      <Dialog open={openHistoryDialog} onClose={handleCloseHistoryDialog} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <HistoryIcon />
              <Typography variant="h6">Lịch sử thay đổi: {selectedUnit?.name}</Typography>
            </Box>
            <IconButton onClick={handleCloseHistoryDialog} size="small">
              <XIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedUnit && (
            <Box sx={{ mt: 2 }}>
              {/* Filters */}
              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <TextField
                  size="small"
                  placeholder="Tìm kiếm..."
                  value={historyFilters.search}
                  onChange={(e) => setHistoryFilters({ ...historyFilters, search: e.target.value, page: 1 })}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ flex: 1 }}
                />
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>Hành động</InputLabel>
                  <Select
                    value={historyFilters.action}
                    onChange={(e) => setHistoryFilters({ ...historyFilters, action: e.target.value, page: 1 })}
                    label="Hành động"
                  >
                    <MenuItem value="">Tất cả</MenuItem>
                    <MenuItem value="CREATE">Tạo mới</MenuItem>
                    <MenuItem value="UPDATE">Cập nhật</MenuItem>
                    <MenuItem value="DELETE">Xóa</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              {historyLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                  <CircularProgress />
                </Box>
              ) : historyItems.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
                  Không có lịch sử thay đổi
                </Typography>
              ) : (
                <>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Thời gian</TableCell>
                          <TableCell>Hành động</TableCell>
                          <TableCell>Thay đổi</TableCell>
                          <TableCell>Người thực hiện</TableCell>
                          <TableCell align="right">Chi tiết</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {historyItems.map((item) => (
                          <TableRow 
                            key={item.id} 
                            hover
                            sx={{ cursor: 'pointer' }}
                            onClick={() => handleRowClick(item)}
                          >
                            <TableCell>
                              {new Date(item.created_at).toLocaleString('vi-VN')}
                            </TableCell>
                            <TableCell>
                              <Chip 
                                label={item.action} 
                                size="small" 
                                color={getActionColor(item.action) as any}
                              />
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" noWrap>
                                {item.change_summary || '—'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              {item.actor_name || 'Hệ thống'}
                            </TableCell>
                            <TableCell align="right">
                              <IconButton size="small">
                                <EyeIcon fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  {totalPages > 1 && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                      <Pagination
                        count={totalPages}
                        page={historyFilters.page}
                        onChange={(_, newPage) => setHistoryFilters({ ...historyFilters, page: newPage })}
                        color="primary"
                      />
                    </Box>
                  )}
                </>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseHistoryDialog}>Đóng</Button>
        </DialogActions>
      </Dialog>

      {/* History Detail Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { minHeight: '60vh' }
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <HistoryIcon />
              <Typography variant="h6">Chi tiết lịch sử sửa đổi</Typography>
            </Box>
            <IconButton onClick={handleCloseDialog} size="small">
              <XIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent>
          {selectedHistoryItem && (
            <Stack spacing={3}>
              {/* Basic Info */}
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Thông tin cơ bản
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                  <Box sx={{ flex: '1 1 calc(50% - 8px)', minWidth: 200 }}>
                    <Typography variant="caption" color="text.secondary">ID</Typography>
                    <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                      {selectedHistoryItem.id}
                    </Typography>
                  </Box>
                  <Box sx={{ flex: '1 1 calc(50% - 8px)', minWidth: 200 }}>
                    <Typography variant="caption" color="text.secondary">Thời gian</Typography>
                    <Typography variant="body2">
                      {new Date(selectedHistoryItem.created_at).toLocaleString('vi-VN', {
                        dateStyle: 'full',
                        timeStyle: 'medium',
                      })}
                    </Typography>
                  </Box>
                  <Box sx={{ flex: '1 1 calc(50% - 8px)', minWidth: 200 }}>
                    <Typography variant="caption" color="text.secondary">Hành động</Typography>
                    <Box mt={0.5}>
                      <Chip 
                        label={selectedHistoryItem.action} 
                        size="small" 
                        color={getActionColor(selectedHistoryItem.action) as any}
                      />
                    </Box>
                  </Box>
                  <Box sx={{ flex: '1 1 calc(50% - 8px)', minWidth: 200 }}>
                    <Typography variant="caption" color="text.secondary">ID đơn vị</Typography>
                    <Typography variant="body2">{selectedHistoryItem.entity_id}</Typography>
                  </Box>
                  {selectedHistoryItem.actor_name && (
                    <Box sx={{ flex: '1 1 calc(50% - 8px)', minWidth: 200 }}>
                      <Typography variant="caption" color="text.secondary">Người thực hiện</Typography>
                      <Typography variant="body2">{selectedHistoryItem.actor_name}</Typography>
                    </Box>
                  )}
                </Box>
              </Box>

              {/* Change Details */}
              {selectedHistoryItem.change_details && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Chi tiết thay đổi
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  {selectedHistoryItem.change_details.fields && selectedHistoryItem.change_details.fields.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" color="text.secondary">
                        Các trường đã thay đổi ({selectedHistoryItem.change_details.fields.length})
                      </Typography>
                      <Box sx={{ mt: 0.5, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selectedHistoryItem.change_details.fields.map((field, idx) => (
                          <Chip 
                            key={idx}
                            label={field} 
                            size="small" 
                            variant="outlined"
                            sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}
                          />
                        ))}
                      </Box>
                    </Box>
                  )}

                  {selectedHistoryItem.change_details.changes && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" color="text.secondary" gutterBottom>
                        Chi tiết từng thay đổi
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                        {Object.entries(selectedHistoryItem.change_details.changes).map(([field, change]: [string, any]) => (
                          <Box key={field}>
                            <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
                              {field}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 2, mt: 0.5 }}>
                              <Box sx={{ flex: 1 }}>
                                <Typography variant="caption" color="error.main">Giá trị cũ:</Typography>
                                <Box sx={{ mt: 0.5, p: 1, bgcolor: 'error.lighter', borderRadius: 1, border: '1px solid', borderColor: 'error.light' }}>
                                  <Typography variant="body2" sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: '0.875rem', color: 'error.dark' }}>
                                    {formatValue(change.old_value)}
                                  </Typography>
                                </Box>
                              </Box>
                              <Box sx={{ flex: 1 }}>
                                <Typography variant="caption" color="success.main">Giá trị mới:</Typography>
                                <Box sx={{ mt: 0.5, p: 1, bgcolor: 'success.lighter', borderRadius: 1, border: '1px solid', borderColor: 'success.light' }}>
                                  <Typography variant="body2" sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: '0.875rem', color: 'success.dark' }}>
                                    {formatValue(change.new_value)}
                                  </Typography>
                                </Box>
                              </Box>
                            </Box>
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  )}

                  {selectedHistoryItem.change_details.initial_values && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" color="text.secondary" gutterBottom>
                        Giá trị ban đầu (INSERT)
                      </Typography>
                      <Box sx={{ mt: 0.5, p: 1.5, bgcolor: 'info.lighter', borderRadius: 1, border: '1px solid', borderColor: 'info.light', maxHeight: 300, overflow: 'auto' }}>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: '0.875rem' }}>
                          {formatValue(selectedHistoryItem.change_details.initial_values)}
                        </Typography>
                      </Box>
                    </Box>
                  )}

                  {selectedHistoryItem.change_details.deleted_values && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" color="text.secondary" gutterBottom>
                        Giá trị đã xóa (DELETE)
                      </Typography>
                      <Box sx={{ mt: 0.5, p: 1.5, bgcolor: 'error.lighter', borderRadius: 1, border: '1px solid', borderColor: 'error.light', maxHeight: 300, overflow: 'auto' }}>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: '0.875rem', color: 'error.dark' }}>
                          {formatValue(selectedHistoryItem.change_details.deleted_values)}
                        </Typography>
                      </Box>
                    </Box>
                  )}

                  {selectedHistoryItem.change_summary && (
                    <Box>
                      <Typography variant="caption" color="text.secondary">Tóm tắt thay đổi</Typography>
                      <Typography variant="body2" sx={{ mt: 0.5 }}>
                        {selectedHistoryItem.change_summary}
                      </Typography>
                    </Box>
                  )}
                </Box>
              )}
            </Stack>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleCloseDialog} variant="contained">Đóng</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
