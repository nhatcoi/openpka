'use client';

import { useState, useEffect } from 'react';
import { API_ROUTES } from '@/constants/routes';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Alert,
  CircularProgress,
  Container,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Breadcrumbs,
  Link,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Stack,
} from '@mui/material';
import {
  RefreshCw,
  History,
  Search,
  X,
  Eye,
} from 'lucide-react';

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

export default function AcademicHistoryPage() {
  const [data, setData] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    entity_type: '',
    action: '',
    search: '',
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '100',
        ...filters,
      });
      
      
      const response = await fetch(`${API_ROUTES.ACADEMIC.HISTORY}?${params}`);
      const result = await response.json();
      
      if (result.success) {
        setData(result.data.items);
        setTotalPages(result.data.pagination.totalPages);
      } else {
        setError(result.error || 'Lỗi khi tải dữ liệu');
      }
    } catch (err) {
      setError('Lỗi kết nối');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, filters]);

  // Reset page to 1 when filters change
  useEffect(() => {
    if (page !== 1) {
      setPage(1);
    }
  }, [filters.entity_type, filters.action, filters.search]);

  const getActionColor = (action: string) => {
    switch (action.toUpperCase()) {
      case 'CREATE': return 'success';
      case 'UPDATE': return 'info';
      case 'DELETE': return 'error';
      default: return 'default';
    }
  };

  const getEntityTypeLabel = (type: string) => {
    switch (type.toUpperCase()) {
      case 'MAJOR': return 'Ngành đào tạo';
      case 'PROGRAM': return 'Chương trình đào tạo';
      case 'COURSE': return 'Học phần';
      case 'COHORT': return 'Khóa học';
      case 'PROGRAM_COURSE_MAP': return 'Bản đồ chương trình-học phần';
      case 'PROGRAM_BLOCK': return 'Khối chương trình';
      case 'PROGRAM_BLOCK_GROUP': return 'Nhóm khối chương trình';
      case 'CURRICULUM_VERSION': return 'Phiên bản chương trình';
      case 'COURSE_VERSION': return 'Phiên bản học phần';
      default: return type;
    }
  };

  const handleRowClick = (item: HistoryItem) => {
    setSelectedItem(item);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedItem(null);
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

  const getEntityUrl = (entityType: string, entityId: string): string | null => {
    const type = entityType.toUpperCase();
    const id = entityId;
    
    switch (type) {
      case 'COURSE':
        return `/tms/courses/${id}`;
      case 'MAJOR':
        return `/tms/majors/${id}`;
      case 'PROGRAM':
        return `/tms/programs/${id}`;
      case 'COHORT':
        return `/tms/cohorts/${id}`;
      default:
        return null;
    }
  };

  return (
    <Container maxWidth={false} sx={{ py: 4, px: 1 }}>
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link
          color="inherit"
          href="/tms"
          sx={{ textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
        >
          TMS
        </Link>
        <Typography color="text.primary">Lịch sử</Typography>
      </Breadcrumbs>

      <Card>
        <CardHeader
          title={
            <Box display="flex" alignItems="center" gap={1}>
              <History size={24} />
              <Typography variant="h5">Lịch sử học tập</Typography>
            </Box>
          }
          subheader="Theo dõi các thay đổi trong hệ thống học tập"
          action={
            <Button
              variant="outlined"
              startIcon={<RefreshCw />}
              onClick={fetchData}
              disabled={loading}
            >
              Làm mới
            </Button>
          }
        />
        
        <CardContent>
          {/* Search and Filters */}
          <Box sx={{ mb: 3 }}>
            <Box sx={{ 
              display: 'flex', 
              gap: 2, 
              flexWrap: 'wrap', 
              alignItems: 'flex-end',
              '@media (min-width: 1200px)': {
                flexWrap: 'nowrap'
              }
            }}>
              {/* Search Bar */}
              <TextField
                size="small"
                placeholder="Tìm kiếm theo tóm tắt thay đổi, người thực hiện, tên field..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search size={20} />
                    </InputAdornment>
                  ),
                }}
                sx={{ 
                  flex: '1 1 300px',
                  minWidth: 300,
                  maxWidth: 500
                }}
              />
              
              {/* Filters */}
              <FormControl size="small" sx={{ minWidth: 180 }}>
                <InputLabel>Loại thực thể</InputLabel>
                <Select
                  value={filters.entity_type}
                  label="Loại thực thể"
                  onChange={(e) => setFilters({ ...filters, entity_type: e.target.value })}
                >
                  <MenuItem value="">Tất cả</MenuItem>
                  <MenuItem value="MAJOR">Ngành đào tạo</MenuItem>
                  <MenuItem value="PROGRAM">Chương trình đào tạo</MenuItem>
                  <MenuItem value="COURSE">Học phần</MenuItem>
                  <MenuItem value="PROGRAM_COURSE_MAP">Bản đồ chương trình-học phần</MenuItem>
                  <MenuItem value="PROGRAM_BLOCK">Khối chương trình</MenuItem>
                  <MenuItem value="CURRICULUM_VERSION">Phiên bản chương trình</MenuItem>
                </Select>
              </FormControl>
              
              <FormControl size="small" sx={{ minWidth: 140 }}>
                <InputLabel>Hành động</InputLabel>
                <Select
                  value={filters.action}
                  label="Hành động"
                  onChange={(e) => setFilters({ ...filters, action: e.target.value })}
                >
                  <MenuItem value="">Tất cả</MenuItem>
                  <MenuItem value="CREATE">Tạo mới</MenuItem>
                  <MenuItem value="UPDATE">Cập nhật</MenuItem>
                  <MenuItem value="DELETE">Xóa</MenuItem>
                </Select>
              </FormControl>
              
              <Button
                variant="outlined"
                size="small"
                onClick={() => setFilters({ entity_type: '', action: '', search: '' })}
                sx={{ minWidth: 100 }}
              >
                Xóa bộ lọc
              </Button>
            </Box>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {loading ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Thời gian</TableCell>
                      <TableCell>Loại</TableCell>
                      <TableCell>Hành động</TableCell>
                      <TableCell>Thay đổi</TableCell>
                      <TableCell>Người thực hiện</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.map((item) => (
                      <TableRow 
                        key={item.id}
                        onClick={() => handleRowClick(item)}
                        sx={{
                          cursor: 'pointer',
                          '&:hover': {
                            backgroundColor: 'action.hover',
                          },
                        }}
                      >
                        <TableCell>
                          {new Date(item.created_at).toLocaleString('vi-VN')}
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={getEntityTypeLabel(item.entity_type)} 
                            size="small" 
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={item.action} 
                            size="small" 
                            color={getActionColor(item.action) as any}
                          />
                        </TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            <span>{item.change_summary || '—'}</span>
                            <Eye size={14} color="#666" />
                          </Box>
                        </TableCell>
                        <TableCell>
                          {item.actor_name || 'Hệ thống'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {totalPages > 1 && (
                <Box display="flex" justifyContent="center" mt={3}>
                  <Pagination
                    count={totalPages}
                    page={page}
                    onChange={(_, newPage) => setPage(newPage)}
                    color="primary"
                  />
                </Box>
              )}
            </>
          )}
        </CardContent>
      </Card>

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
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center" gap={1}>
              <History size={24} />
              <Typography variant="h6">Chi tiết lịch sử sửa đổi</Typography>
            </Box>
            <Button
              onClick={handleCloseDialog}
              sx={{ minWidth: 'auto', p: 0.5 }}
            >
              <X size={24} />
            </Button>
          </Box>
        </DialogTitle>
        
        <DialogContent>
          {selectedItem && (
            <Stack spacing={3}>
              {/* Basic Info */}
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Thông tin cơ bản
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                  <Box sx={{ flex: '1 1 calc(50% - 8px)', minWidth: 200 }}>
                    <Typography variant="caption" color="text.secondary">
                      ID
                    </Typography>
                    <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                      {selectedItem.id}
                    </Typography>
                  </Box>
                  <Box sx={{ flex: '1 1 calc(50% - 8px)', minWidth: 200 }}>
                    <Typography variant="caption" color="text.secondary">
                      Thời gian
                    </Typography>
                    <Typography variant="body2">
                      {new Date(selectedItem.created_at).toLocaleString('vi-VN', {
                        dateStyle: 'full',
                        timeStyle: 'medium',
                      })}
                    </Typography>
                  </Box>
                  <Box sx={{ flex: '1 1 calc(50% - 8px)', minWidth: 200 }}>
                    <Typography variant="caption" color="text.secondary">
                      Loại thực thể
                    </Typography>
                    <Box mt={0.5}>
                      <Chip 
                        label={getEntityTypeLabel(selectedItem.entity_type)} 
                        size="small" 
                        variant="outlined"
                      />
                    </Box>
                  </Box>
                  <Box sx={{ flex: '1 1 calc(50% - 8px)', minWidth: 200 }}>
                    <Typography variant="caption" color="text.secondary">
                      Hành động
                    </Typography>
                    <Box mt={0.5}>
                      <Chip 
                        label={selectedItem.action} 
                        size="small" 
                        color={getActionColor(selectedItem.action) as any}
                      />
                    </Box>
                  </Box>
                  <Box sx={{ flex: '1 1 100%' }}>
                    <Typography variant="caption" color="text.secondary">
                      ID thực thể
                    </Typography>
                    <Box mt={0.5} display="flex" alignItems="center" gap={1}>
                      <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                        {selectedItem.entity_id}
                      </Typography>
                      {getEntityUrl(selectedItem.entity_type, selectedItem.entity_id) && (
                        <Button
                          size="small"
                          variant="outlined"
                          component={Link}
                          href={getEntityUrl(selectedItem.entity_type, selectedItem.entity_id) || '#'}
                          target="_blank"
                        >
                          Xem chi tiết
                        </Button>
                      )}
                    </Box>
                  </Box>
                </Box>
              </Box>

              {/* Change Details */}
              {selectedItem.change_details && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Chi tiết thay đổi
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  {selectedItem.change_details.fields && selectedItem.change_details.fields.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" color="text.secondary">
                        Các trường đã thay đổi ({selectedItem.change_details.fields.length})
                      </Typography>
                      <Box sx={{ mt: 0.5, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selectedItem.change_details.fields.map((field, idx) => (
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

                  {selectedItem.change_details.changes && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" color="text.secondary" gutterBottom>
                        Chi tiết từng thay đổi
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                        {Object.entries(selectedItem.change_details.changes).map(([field, change]: [string, any]) => (
                          <Box key={field}>
                            <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
                              {field}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 2, mt: 0.5 }}>
                              <Box sx={{ flex: 1 }}>
                                <Typography variant="caption" color="error.main">
                                  Giá trị cũ:
                                </Typography>
                                <Box
                                  sx={{
                                    mt: 0.5,
                                    p: 1,
                                    bgcolor: 'error.lighter',
                                    borderRadius: 1,
                                    border: '1px solid',
                                    borderColor: 'error.light',
                                  }}
                                >
                                  <Typography 
                                    variant="body2" 
                                    sx={{ 
                                      fontFamily: 'monospace',
                                      whiteSpace: 'pre-wrap',
                                      wordBreak: 'break-word',
                                      color: 'error.dark',
                                      fontSize: '0.875rem',
                                    }}
                                  >
                                    {formatValue(change.old_value)}
                                  </Typography>
                                </Box>
                              </Box>
                              <Box sx={{ flex: 1 }}>
                                <Typography variant="caption" color="success.main">
                                  Giá trị mới:
                                </Typography>
                                <Box
                                  sx={{
                                    mt: 0.5,
                                    p: 1,
                                    bgcolor: 'success.lighter',
                                    borderRadius: 1,
                                    border: '1px solid',
                                    borderColor: 'success.light',
                                  }}
                                >
                                  <Typography 
                                    variant="body2" 
                                    sx={{ 
                                      fontFamily: 'monospace',
                                      whiteSpace: 'pre-wrap',
                                      wordBreak: 'break-word',
                                      color: 'success.dark',
                                      fontSize: '0.875rem',
                                    }}
                                  >
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

                  {selectedItem.change_details.initial_values && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" color="text.secondary" gutterBottom>
                        Giá trị ban đầu (INSERT)
                      </Typography>
                      <Box
                        sx={{
                          mt: 0.5,
                          p: 1.5,
                          bgcolor: 'info.lighter',
                          borderRadius: 1,
                          border: '1px solid',
                          borderColor: 'info.light',
                          maxHeight: 300,
                          overflow: 'auto',
                        }}
                      >
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontFamily: 'monospace',
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                            fontSize: '0.875rem',
                          }}
                        >
                          {formatValue(selectedItem.change_details.initial_values)}
                        </Typography>
                      </Box>
                    </Box>
                  )}

                  {selectedItem.change_details.deleted_values && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" color="text.secondary" gutterBottom>
                        Giá trị đã xóa (DELETE)
                      </Typography>
                      <Box
                        sx={{
                          mt: 0.5,
                          p: 1.5,
                          bgcolor: 'error.lighter',
                          borderRadius: 1,
                          border: '1px solid',
                          borderColor: 'error.light',
                          maxHeight: 300,
                          overflow: 'auto',
                        }}
                      >
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontFamily: 'monospace',
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                            fontSize: '0.875rem',
                            color: 'error.dark',
                          }}
                        >
                          {formatValue(selectedItem.change_details.deleted_values)}
                        </Typography>
                      </Box>
                    </Box>
                  )}

                  {selectedItem.change_summary && (
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Tóm tắt thay đổi
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 0.5 }}>
                        {selectedItem.change_summary}
                      </Typography>
                    </Box>
                  )}
                </Box>
              )}

              {/* Actor Info */}
              {(selectedItem.actor_id || selectedItem.actor_name) && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Người thực hiện
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                    {selectedItem.actor_id && (
                      <Box sx={{ flex: '1 1 calc(50% - 8px)', minWidth: 200 }}>
                        <Typography variant="caption" color="text.secondary">
                          ID người dùng
                        </Typography>
                        <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                          {selectedItem.actor_id}
                        </Typography>
                      </Box>
                    )}
                    {selectedItem.actor_name && (
                      <Box sx={{ flex: '1 1 calc(50% - 8px)', minWidth: 200 }}>
                        <Typography variant="caption" color="text.secondary">
                          Tên người dùng
                        </Typography>
                        <Typography variant="body2">
                          {selectedItem.actor_name}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Box>
              )}

              {/* Request Context */}
              {(selectedItem.user_agent || selectedItem.metadata || selectedItem.change_details?.metadata) && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Ngữ cảnh yêu cầu
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {selectedItem.user_agent && (
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          User Agent
                        </Typography>
                        <Typography variant="body2" sx={{ wordBreak: 'break-word', mt: 0.5 }}>
                          {selectedItem.user_agent}
                        </Typography>
                      </Box>
                    )}
                    {(selectedItem.metadata || selectedItem.change_details?.metadata) && (
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Metadata
                        </Typography>
                        <Box
                          sx={{
                            mt: 0.5,
                            p: 1.5,
                            bgcolor: 'grey.50',
                            borderRadius: 1,
                            border: '1px solid',
                            borderColor: 'divider',
                            maxHeight: 200,
                            overflow: 'auto',
                          }}
                        >
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              fontFamily: 'monospace',
                              whiteSpace: 'pre-wrap',
                              wordBreak: 'break-word',
                              fontSize: '0.875rem',
                            }}
                          >
                            {formatValue(selectedItem.metadata || selectedItem.change_details?.metadata)}
                          </Typography>
                        </Box>
                      </Box>
                    )}
                  </Box>
                </Box>
              )}
            </Stack>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleCloseDialog} variant="contained">
            Đóng
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}