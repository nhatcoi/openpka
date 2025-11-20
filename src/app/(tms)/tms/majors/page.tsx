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
  getMajorStatusColor,
  getMajorStatusLabel,
  getMajorDegreeLevelLabel,
} from '@/constants/majors';
import { WORKFLOW_STATUS_OPTIONS, WorkflowStatus } from '@/constants/workflow-statuses';
import {
  OrgUnitApiItem,
  OrgUnitOption,
  MajorApiResponseItem,
  MajorListApiResponse,
  MajorListItem,
  mapOrgUnitOptions,
  mapMajorResponse,
} from './major-utils';

interface PaginationState {
  page: number;
  totalPages: number;
  totalItems: number;
}

const DEFAULT_MAJOR_PAGE_SIZE = 10;

export default function MajorsPage(): JSX.Element {
  const router = useRouter();
  const [majors, setMajors] = useState<MajorListItem[]>([]);
  const [orgUnits, setOrgUnits] = useState<OrgUnitOption[]>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    totalPages: 1,
    totalItems: 0,
  });
  const [selectedStatus, setSelectedStatus] = useState<WorkflowStatus | 'all'>('all');
  const [selectedOrgUnit, setSelectedOrgUnit] = useState<string>('all');
  const [searchValue, setSearchValue] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; major: MajorListItem | null }>({
    open: false,
    major: null,
  });
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const fetchOrgUnits = useCallback(async () => {
    try {
      const response = await fetch('/api/tms/majors/org-units');
      const result = (await response.json()) as {
        success?: boolean;
        data?: OrgUnitApiItem[];
      };

      if (response.ok && result?.data) {
        setOrgUnits(mapOrgUnitOptions(result.data));
      }
    } catch (err) {
      console.error('Failed to fetch org units', err);
    }
  }, []);

  const fetchMajors = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: String(DEFAULT_MAJOR_PAGE_SIZE),
      });

      if (selectedStatus !== 'all') {
        params.set('status', selectedStatus);
      }

      if (selectedOrgUnit !== 'all') {
        params.set('org_unit_id', selectedOrgUnit);
      }

      if (searchTerm) {
        params.set('search', searchTerm);
      }

      const response = await fetch(`/api/tms/majors?${params.toString()}`);
      const result = (await response.json()) as MajorListApiResponse;

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Không thể tải danh sách ngành học');
      }

      const items: MajorApiResponseItem[] = result.data?.items ?? [];
      const mapped = items.map(mapMajorResponse);

      setMajors(mapped);
      setPagination((prev) => ({
        ...prev,
        totalPages: result.data?.pagination?.pages ?? 1,
        totalItems: result.data?.pagination?.total ?? mapped.length,
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Đã xảy ra lỗi khi tải dữ liệu';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, searchTerm, selectedOrgUnit, selectedStatus]);

  useEffect(() => {
    fetchOrgUnits();
  }, [fetchOrgUnits]);

  useEffect(() => {
    fetchMajors();
  }, [fetchMajors]);

  const handleSearch = () => {
    setPagination((prev) => ({ ...prev, page: 1 }));
    setSearchTerm(searchValue.trim());
  };

  const handleResetFilters = () => {
    setSelectedStatus('all');
    setSelectedOrgUnit('all');
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

  const handleOrgUnitChange = (event: SelectChangeEvent<string>) => {
    setSelectedOrgUnit(event.target.value);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleDelete = async (majorId: string) => {
    try {
      const response = await fetch(`/api/tms/majors/${majorId}`, {
        method: 'DELETE',
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Không thể xóa ngành học');
      }

      setSnackbar({ open: true, message: 'Đã xóa ngành học thành công', severity: 'success' });
      setDeleteDialog({ open: false, major: null });
      fetchMajors();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể xóa ngành học';
      setSnackbar({ open: true, message, severity: 'error' });
    }
  };

  const orgUnitMap = useMemo(() => {
    const map = new Map<string, OrgUnitOption>();
    for (const unit of orgUnits) {
      map.set(unit.id, unit);
    }
    return map;
  }, [orgUnits]);

  const isEmpty = useMemo(() => !loading && majors.length === 0, [loading, majors.length]);

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
          <Typography color="text.primary">Ngành đào tạo</Typography>
        </Breadcrumbs>

        <Paper
          elevation={0}
          sx={{
            p: 4,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            borderRadius: 2,
            mb: 4,
          }}
        >
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }}>
            <Box>
              <Typography variant="h3" component="h1" sx={{ fontWeight: 'bold', mb: 1 }}>
                Quản lý ngành đào tạo
              </Typography>
              <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
                Theo dõi, tạo mới và cập nhật thông tin ngành học trong hệ thống
              </Typography>
            </Box>
            <Stack direction="row" spacing={2}>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={fetchMajors}
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
                  color: '#667eea',
                  '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.9)' },
                }}
                onClick={() => router.push('/tms/majors/create')}
              >
                Tạo ngành mới
              </Button>
            </Stack>
          </Stack>
        </Paper>

        <Paper sx={{ p: 3, mb: 3 }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ xs: 'stretch', md: 'center' }}>
            <TextField
              placeholder="Tìm kiếm theo tên hoặc mã ngành"
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
                {WORKFLOW_STATUS_OPTIONS.map((status) => (
                  <MenuItem key={status.value} value={status.value}>
                    {status.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl sx={{ minWidth: 220 }}>
              <InputLabel>Đơn vị quản lý</InputLabel>
              <Select value={selectedOrgUnit} label="Đơn vị quản lý" onChange={handleOrgUnitChange}>
                <MenuItem value="all">Tất cả đơn vị</MenuItem>
                {orgUnits.map((unit) => (
                  <MenuItem key={unit.id} value={unit.id}>
                    {unit.label}
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
                  <TableCell sx={{ fontWeight: 'bold' }}>Mã</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Tên ngành</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Đơn vị</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Bằng cấp</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }} align="center">
                    Thời gian
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
                    <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                      <CircularProgress size={28} />
                    </TableCell>
                  </TableRow>
                )}

                {error && !loading && (
                  <TableRow>
                    <TableCell colSpan={7}>
                      <Alert severity="error" action={
                        <Button color="inherit" size="small" onClick={fetchMajors}>
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
                    <TableCell colSpan={7}>
                      <Alert severity="info">Không tìm thấy ngành học phù hợp.</Alert>
                    </TableCell>
                  </TableRow>
                )}

                {!loading && !error && majors.map((major) => (
                  <TableRow key={major.id} hover>
                    <TableCell sx={{ fontWeight: 'bold', color: 'primary.main' }}>{major.code}</TableCell>
                    <TableCell>
                      <Typography variant="subtitle2" fontWeight="medium">
                        {major.nameVi}
                      </Typography>
                      {major.nameEn && (
                        <Typography variant="body2" color="text.secondary">
                          {major.nameEn}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {orgUnitMap.get(major.orgUnitId) ? (
                        <>
                          <Typography variant="body2" fontWeight="medium">
                            {orgUnitMap.get(major.orgUnitId)!.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {orgUnitMap.get(major.orgUnitId)!.code}
                          </Typography>
                        </>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          Chưa cập nhật
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {getMajorDegreeLevelLabel(major.degreeLevel)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2">
                        {major.durationYears ? `${major.durationYears} năm` : 'N/A'}
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
                          <IconButton size="small" color="primary" onClick={() => router.push(`/tms/majors/${major.id}`)}>
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Chỉnh sửa">
                          <IconButton size="small" color="secondary" onClick={() => router.push(`/tms/majors/${major.id}/edit`)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Xóa">
                          <IconButton size="small" color="error" onClick={() => setDeleteDialog({ open: true, major })}>
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
              Hiển thị {majors.length} / {pagination.totalItems} ngành học
            </Typography>
            <Pagination
              color="primary"
              page={pagination.page}
              count={Math.max(pagination.totalPages, 1)}
              onChange={handlePageChange}
            />
          </Box>
        </Paper>

        <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, major: null })}>
          <DialogTitle>Xác nhận xóa</DialogTitle>
          <DialogContent>
            <Typography>
              Bạn có chắc chắn muốn xóa ngành học "{deleteDialog.major?.nameVi}"?
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialog({ open: false, major: null })}>
              Hủy
            </Button>
            <Button
              color="error"
              onClick={() => deleteDialog.major && handleDelete(deleteDialog.major.id)}
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
