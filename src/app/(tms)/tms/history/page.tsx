'use client';

import { useState, useEffect } from 'react';
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
} from '@mui/material';
import {
  RefreshCw,
  History,
  Search,
} from 'lucide-react';

interface HistoryItem {
  id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  field_name?: string;
  old_value?: string;
  new_value?: string;
  change_summary?: string;
  actor_name?: string;
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

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '100',
        ...filters,
      });
      
      
      const response = await fetch(`/api/academic/history?${params}`);
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
                      <TableRow key={item.id}>
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
                          {item.change_summary || item.field_name || '—'}
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
    </Container>
  );
}