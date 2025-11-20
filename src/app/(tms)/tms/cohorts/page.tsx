'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Pagination,
  Paper,
  Select,
  SelectChangeEvent,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  Breadcrumbs,
  Link,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import {
  COHORT_WORKFLOW_STATUS_OPTIONS,
  getCohortStatusLabel,
  getCohortStatusColor,
  getCohortIntakeTermLabel,
  getRawCohortStatuses,
} from '@/constants/cohorts';
import { WorkflowStatus } from '@/constants/workflow-statuses';
import {
  CohortApiResponseItem,
  CohortListApiResponse,
  CohortListItem,
  mapCohortResponse,
} from './cohort-utils';

interface PaginationState {
  page: number;
  totalPages: number;
  totalItems: number;
}

const DEFAULT_COHORT_PAGE_SIZE = 10;

export default function CohortsPage(): JSX.Element {
  const router = useRouter();
  const [cohorts, setCohorts] = useState<CohortListItem[]>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    totalPages: 1,
    totalItems: 0,
  });
  const [selectedStatus, setSelectedStatus] = useState<WorkflowStatus | 'all'>('all');
  const [searchValue, setSearchValue] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; cohort: CohortListItem | null }>({
    open: false,
    cohort: null,
  });
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const fetchCohorts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: String(DEFAULT_COHORT_PAGE_SIZE),
      });

      if (selectedStatus !== 'all') {
        const rawStatuses = getRawCohortStatuses(selectedStatus);
        if (rawStatuses.length > 0) {
          params.set('status', rawStatuses[0]);
        }
      }

      if (searchTerm) {
        params.set('search', searchTerm);
      }

      const response = await fetch(`/api/cohorts?${params.toString()}`);
      const result = (await response.json()) as CohortListApiResponse;

      if (!response.ok) {
        throw new Error(result.error || 'Không thể tải danh sách khóa học');
      }

      const items: CohortApiResponseItem[] = result.cohorts ?? [];
      const mapped = items.map(mapCohortResponse);

      setCohorts(mapped);
      setPagination((prev) => ({
        ...prev,
        totalPages: result.pagination?.totalPages ?? 1,
        totalItems: result.pagination?.total ?? mapped.length,
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Đã xảy ra lỗi khi tải dữ liệu';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, searchTerm, selectedStatus]);

  useEffect(() => {
    fetchCohorts();
  }, [fetchCohorts]);

  const handleSearch = () => {
    setPagination((prev) => ({ ...prev, page: 1 }));
    setSearchTerm(searchValue.trim());
  };

  const handleResetFilters = () => {
    setSelectedStatus('all');
    setSearchValue('');
    setSearchTerm('');
    setPagination({ page: 1, totalItems: 0, totalPages: 1 });
  };

  const handlePageChange = (_: React.ChangeEvent<unknown>, newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const handleStatusChange = (event: SelectChangeEvent<WorkflowStatus | 'all'>) => {
    setSelectedStatus(event.target.value as WorkflowStatus | 'all');
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleDelete = async (cohortId: string) => {
    try {
      const response = await fetch(`/api/cohorts/${cohortId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Không thể xóa khóa học');
      }

      setSnackbar({ open: true, message: 'Đã xóa khóa học thành công', severity: 'success' });
      setDeleteDialog({ open: false, cohort: null });
      fetchCohorts();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể xóa khóa học';
      setSnackbar({ open: true, message, severity: 'error' });
    }
  };

  const isEmpty = useMemo(() => !loading && cohorts.length === 0, [loading, cohorts.length]);

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default', py: 4 }}>
      <Container maxWidth={false} sx={{ px: 2 }}>
        <Breadcrumbs sx={{ mb: 2 }}>
          <Link
            color="inherit"
            href="/tms"
            sx={{ textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
          >
            TMS
          </Link>
          <Typography color="text.primary">Khóa học</Typography>
        </Breadcrumbs>

        <Paper
          elevation={0}
          sx={{
            p: 4,
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            color: 'white',
            borderRadius: 2,
            mb: 4,
          }}
        >
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }}>
            <Box>
              <Typography variant="h3" component="h1" sx={{ fontWeight: 'bold', mb: 1 }}>
                Quản lý khóa học
              </Typography>
              <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
                Theo dõi, tạo mới và cập nhật thông tin khóa học trong hệ thống
              </Typography>
            </Box>
            <Stack direction="row" spacing={2}>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={fetchCohorts}
                disabled={loading}
                color="inherit"
                sx={{ color: '#fff', borderColor: 'rgba(255,255,255,0.7)' }}
              >
                Làm mới
              </Button>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                sx={{
                  backgroundColor: 'white',
                  color: '#f5576c',
                  '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.9)' },
                }}
                onClick={() => router.push('/tms/cohorts/create')}
              >
                Tạo khóa học mới
              </Button>
            </Stack>
          </Stack>
        </Paper>

        <Paper sx={{ p: 3, mb: 3 }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ xs: 'stretch', md: 'center' }}>
            <TextField
              placeholder="Tìm kiếm theo tên hoặc mã khóa học"
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  handleSearch();
                }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{ flexGrow: 1, minWidth: 220 }}
            />

            <FormControl sx={{ minWidth: 160 }}>
              <InputLabel>Trạng thái</InputLabel>
              <Select value={selectedStatus} label="Trạng thái" onChange={handleStatusChange}>
                <MenuItem value="all">Tất cả</MenuItem>
                {COHORT_WORKFLOW_STATUS_OPTIONS.map((status) => (
                  <MenuItem key={status.value} value={status.value}>
                    {status.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Stack direction="row" spacing={1}>
              <Button variant="contained" onClick={handleSearch} disabled={loading}>
                Tìm kiếm
              </Button>
              <Button variant="text" onClick={handleResetFilters} disabled={loading}>
                Xóa bộ lọc
              </Button>
            </Stack>
          </Stack>
        </Paper>

        <Paper sx={{ p: 0, overflow: 'hidden' }}>
          <TableContainer sx={{ width: '100%' }}>
            <Table sx={{ width: '100%' }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Mã khóa</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Tên khóa học</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Năm học</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Năm tuyển sinh</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Học kỳ</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }} align="center">
                    Chỉ tiêu
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }} align="center">
                    Trạng thái
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }} align="center">
                    Thao tác
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading && (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                      <CircularProgress size={28} />
                    </TableCell>
                  </TableRow>
                )}

                {error && !loading && (
                  <TableRow>
                    <TableCell colSpan={8}>
                      <Alert severity="error" action={
                        <Button color="inherit" size="small" onClick={fetchCohorts}>
                          Thử lại
                        </Button>
                      }>
                        {error}
                      </Alert>
                    </TableCell>
                  </TableRow>
                )}

                {isEmpty && (
                  <TableRow>
                    <TableCell colSpan={8}>
                      <Alert severity="info">Không tìm thấy khóa học phù hợp.</Alert>
                    </TableCell>
                  </TableRow>
                )}

                {!loading && !error && cohorts.map((cohort) => (
                  <TableRow key={cohort.id} hover>
                    <TableCell sx={{ fontWeight: 'bold', color: 'primary.main' }}>{cohort.code}</TableCell>
                    <TableCell>
                      <Typography variant="subtitle2" fontWeight="medium">
                        {cohort.nameVi}
                      </Typography>
                      {cohort.nameEn && (
                        <Typography variant="body2" color="text.secondary">
                          {cohort.nameEn}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>{cohort.academicYear}</TableCell>
                    <TableCell>{cohort.intakeYear}</TableCell>
                    <TableCell>
                      {getCohortIntakeTermLabel(cohort.intakeTerm)}
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2">
                        {cohort.actualQuota || 0} / {cohort.plannedQuota || 0}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={getCohortStatusLabel(cohort.status)}
                        color={getCohortStatusColor(cohort.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={1} justifyContent="center">
                        <Tooltip title="Xem chi tiết">
                          <IconButton size="small" color="primary" onClick={() => router.push(`/tms/cohorts/${cohort.id}`)}>
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Chỉnh sửa">
                          <IconButton size="small" color="secondary" onClick={() => router.push(`/tms/cohorts/${cohort.id}/edit`)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Xóa">
                          <IconButton size="small" color="error" onClick={() => setDeleteDialog({ open: true, cohort })}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 3, py: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Hiển thị {cohorts.length} / {pagination.totalItems} khóa học
            </Typography>
            <Pagination
              color="primary"
              page={pagination.page}
              count={Math.max(pagination.totalPages, 1)}
              onChange={handlePageChange}
            />
          </Box>
        </Paper>

        <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, cohort: null })}>
          <DialogTitle>Xác nhận xóa</DialogTitle>
          <DialogContent>
            <Typography>
              Bạn có chắc chắn muốn xóa khóa học "{deleteDialog.cohort?.nameVi}"? Hành động này không thể hoàn tác.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialog({ open: false, cohort: null })}>
              Hủy
            </Button>
            <Button
              color="error"
              variant="contained"
              onClick={() => deleteDialog.cohort && handleDelete(deleteDialog.cohort.id)}
            >
              Xóa
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        >
          <Alert
            onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </Box>
  );
}
