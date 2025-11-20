'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Stack,
  Button,
  Pagination,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  Skeleton,
  Breadcrumbs,
  Link,
} from '@mui/material';
import {
  Add as AddIcon,
  RateReview as RateReviewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import {
  getMajorStatusColor,
  getMajorStatusLabel,
  getMajorDegreeLevelLabel,
} from '@/constants/majors';
import { WORKFLOW_STATUS_OPTIONS, WorkflowStatus } from '@/constants/workflow-statuses';

interface Major {
  id: number;
  code: string;
  name_vi: string;
  name_en?: string | null;
  short_name?: string | null;
  slug?: string | null;
  degree_level: string;
  org_unit_id: number;
  duration_years?: number | null;
  total_credits_min?: number | null;
  total_credits_max?: number | null;
  semesters_per_year?: number | null;
  status: string;
  closed_at?: string | null;
  metadata?: Record<string, any> | null;
  created_by?: number | null;
  updated_by?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
  is_active?: boolean | null;
}

export default function MajorsPage() {
  const router = useRouter();
  const [majors, setMajors] = useState<Major[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchValue, setSearchValue] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<WorkflowStatus | 'all'>('all');
  const [selectedOrgUnit, setSelectedOrgUnit] = useState<string>('all');
  const [orgUnits, setOrgUnits] = useState<Array<{id: number; name: string; code: string}>>([]);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; major: Major | null }>({
    open: false,
    major: null
  });
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });


  // Fetch majors data
  const fetchMajors = useCallback(async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
      });

      if (searchTerm) {
        params.append('search', searchTerm);
      }
      if (selectedStatus !== 'all') {
        params.append('status', selectedStatus);
      }
      if (selectedOrgUnit !== 'all') {
        params.append('org_unit_id', selectedOrgUnit);
      }

      const response = await fetch(`/api/tms/majors?${params}`);
      const data = await response.json();

      if (data.success) {
        setMajors(data.data?.items || []);
        setTotalPages(data.data?.pagination?.pages || 1);
        setTotalItems(data.data?.pagination?.total || 0);
      } else {
        setError(data.error || 'Failed to fetch majors');
      }
    } catch (err: any) {
      setError('Failed to fetch majors');
    } finally {
      setLoading(false);
    }
  }, [page, searchTerm, selectedStatus, selectedOrgUnit]);

  // Fetch org units for filter
  const fetchOrgUnits = useCallback(async () => {
    try {
      const response = await fetch('/api/tms/majors/org-units');
      const data = await response.json();
      if (data.success) {
        setOrgUnits(data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch org units:', err);
    }
  }, []);

  useEffect(() => {
    fetchMajors();
  }, [fetchMajors]);

  useEffect(() => {
    fetchOrgUnits();
  }, [fetchOrgUnits]);

  const orgUnitMap = useMemo(() => {
    const map = new Map<number, { id: number; name: string; code: string }>();
    for (const unit of orgUnits) {
      map.set(unit.id, unit);
    }
    return map;
  }, [orgUnits]);

  // Handle search
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(event.target.value);
  };

  const handleSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setSearchTerm(searchValue);
    setPage(1);
  };

  const handleSearchClear = () => {
    setSearchValue('');
    setSearchTerm('');
    setPage(1);
  };

  // Handle filter changes
  const handleStatusChange = (event: any) => {
    setSelectedStatus(event.target.value as WorkflowStatus | 'all');
    setPage(1);
  };

  const handleOrgUnitChange = (event: any) => {
    setSelectedOrgUnit(event.target.value);
    setPage(1);
  };

  // Handle page change
  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  // Handle refresh
  const handleRefresh = () => {
    fetchMajors();
  };

  // Handle delete
  const handleDelete = async (major: Major) => {
    try {
      const response = await fetch(`/api/tms/majors/${major.id}`, {
        method: 'DELETE',
      });
      const data = await response.json();

      if (data.success) {
        setSnackbar({
          open: true,
          message: 'Xóa ngành học thành công!',
          severity: 'success'
        });
        fetchMajors();
        setDeleteDialog({ open: false, major: null });
      } else {
        setSnackbar({
          open: true,
          message: data.error || 'Không thể xóa ngành học',
          severity: 'error'
        });
      }
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Lỗi mạng khi xóa ngành học',
        severity: 'error'
      });
    }
  };


  if (loading) {
    return (
      <Box sx={{ width: '100%', py: 2, px: 2 }}>
        <Stack spacing={2}>
          <Skeleton variant="rectangular" height={120} />
          <Skeleton variant="rectangular" height={80} />
          <Skeleton variant="rectangular" height={400} />
        </Stack>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', py: 2, px: 2 }}>
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link
          color="inherit"
          href="/tms"
          sx={{ textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
        >
          TMS
        </Link>
        <Typography color="text.primary">Ngành đào tạo</Typography>
      </Breadcrumbs>

      <Stack spacing={2}>
        {/* Header */}
        <Paper 
          sx={{ 
            p: 2, 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
                Quản lý Ngành học
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Quản lý thông tin các ngành học trong hệ thống
              </Typography>
            </Box>
          </Stack>
        </Paper>

        {/* Action Buttons */}
        <Paper sx={{ p: 2 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Button
              variant="outlined"
              startIcon={<RateReviewIcon />}
              onClick={() => router.push('/tms/review')}
              color="primary"
              size="small"
            >
              Trung tâm phê duyệt
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => router.push('/tms/majors/create')}
              size="small"
            >
              Thêm ngành
            </Button>
          </Stack>
        </Paper>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Search and Filters */}
        <Paper sx={{ p: 2 }}>
          <Stack spacing={2}>
            {/* Search Bar */}
            <Box component="form" onSubmit={handleSearchSubmit}>
              <TextField
                fullWidth
                placeholder="Tìm kiếm theo mã, tên ngành..."
                value={searchValue}
                onChange={handleSearchChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                  endAdornment: searchValue && (
                    <InputAdornment position="end">
                      <IconButton onClick={handleSearchClear} size="small">
                        ×
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            {/* Filters */}
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>Trạng thái</InputLabel>
                <Select
                  value={selectedStatus}
                  label="Trạng thái"
                  onChange={handleStatusChange}
                >
                  <MenuItem value="all">Tất cả</MenuItem>
                {WORKFLOW_STATUS_OPTIONS.map((status) => (
                  <MenuItem key={status.value} value={status.value}>
                    {status.label}
                  </MenuItem>
                ))}
                </Select>
              </FormControl>

              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>Đơn vị</InputLabel>
                <Select
                  value={selectedOrgUnit}
                  label="Đơn vị"
                  onChange={handleOrgUnitChange}
                >
                  <MenuItem value="all">Tất cả</MenuItem>
                  {orgUnits.map((unit) => (
                    <MenuItem key={unit.id} value={unit.id.toString()}>
                      {unit.name} ({unit.code})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Box sx={{ flex: 1 }} />
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={handleRefresh}
                disabled={loading}
              >
                Làm mới
              </Button>
            </Stack>
          </Stack>
        </Paper>

        {/* Majors Table */}
        <Paper sx={{ p: 0, overflow: 'hidden', width: '100%' }}>
          <TableContainer sx={{ width: '100%', maxHeight: 'calc(100vh - 300px)' }}>
            <Table sx={{ width: '100%' }} stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold', width: '10%' }}>Mã</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', width: '25%' }}>Tên ngành</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', width: '20%' }}>Đơn vị</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', width: '12%' }}>Bằng cấp</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', width: '10%' }} align="center">Thời gian</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', width: '13%' }} align="center">Trạng thái</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', width: '10%' }} align="center">Thao tác</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : majors.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        Không tìm thấy ngành học nào
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  majors.map((major) => (
                    <TableRow key={major.id} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {major.code}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {major.name_vi}
                          </Typography>
                          {major.name_en && (
                            <Typography variant="caption" color="text.secondary">
                              {major.name_en}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {orgUnitMap.get(major.org_unit_id)?.name || `Đơn vị #${major.org_unit_id}`}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {orgUnitMap.get(major.org_unit_id)?.code || ''}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {getMajorDegreeLevelLabel(major.degree_level)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2">
                          {major.duration_years ? `${major.duration_years} năm` : 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={getMajorStatusLabel(major.status)}
                          color={getMajorStatusColor(major.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Stack direction="row" spacing={1} justifyContent="center">
                          <Tooltip title="Xem chi tiết">
                            <IconButton
                              size="small"
                              onClick={() => router.push(`/tms/majors/${major.id}`)}
                            >
                              <VisibilityIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Chỉnh sửa">
                            <IconButton
                              size="small"
                              onClick={() => router.push(`/tms/majors/${major.id}/edit`)}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Xóa">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => setDeleteDialog({ open: true, major })}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 3, py: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Hiển thị {majors.length} / {totalItems} ngành học
            </Typography>
            <Pagination
              color="primary"
              page={page}
              count={Math.max(totalPages, 1)}
              onChange={handlePageChange}
            />
          </Box>
        </Paper>

        {/* Delete Dialog */}
        <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, major: null })}>
          <DialogTitle>Xác nhận xóa</DialogTitle>
          <DialogContent>
            <Typography>
              Bạn có chắc chắn muốn xóa ngành học "{deleteDialog.major?.name_vi}"?
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialog({ open: false, major: null })}>
              Hủy
            </Button>
            <Button
              color="error"
              onClick={() => deleteDialog.major && handleDelete(deleteDialog.major)}
            >
              Xóa
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert 
            onClose={() => setSnackbar({ ...snackbar, open: false })} 
            severity={snackbar.severity} 
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Stack>
    </Box>
  );
}