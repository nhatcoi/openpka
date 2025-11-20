'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
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
  Card,
  CardContent,
  Skeleton,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  School as SchoolIcon,
  Note as DraftIcon,
  Pending as PendingIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Publish as PublishIcon,
  Archive as ArchiveIcon,
  NewReleases as NewReleasesIcon,
  Category as CategoryIcon,
  Link as LinkIcon,
  CreditCard as CreditCardIcon,
  EventAvailable as EventAvailableIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import {
  DEFAULT_PROGRAM_PAGE_SIZE,
  PROGRAM_WORKFLOW_STATUS_OPTIONS,
  getProgramDegreeLabel,
  getProgramStatusColor,
  getProgramStatusLabel,
} from '@/constants/programs';
import { useConfirmDialog } from '@/components/dialogs/ConfirmDialogProvider';
import { WorkflowStatus } from '@/constants/workflow-statuses';
import { API_ROUTES } from '@/constants/routes';
import {
  OrgUnitApiItem,
  OrgUnitOption,
  ProgramApiResponseItem,
  ProgramListApiResponse,
  ProgramListItem,
  mapOrgUnitOptions,
  mapProgramResponse,
} from './program-utils';

interface PaginationState {
  page: number;
  totalPages: number;
  totalItems: number;
}

export default function ProgramsPage(): JSX.Element {
  const router = useRouter();
  const confirmDialog = useConfirmDialog();
  const [programs, setPrograms] = useState<ProgramListItem[]>([]);
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
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });
  const [stats, setStats] = useState<{
    total: number;
    pending: number;
    reviewing: number;
    approved: number;
    rejected: number;
    published: number;
    archived: number;
    newThisMonth: number;
    withMajor: number;
    active: number;
    withCourses: number;
    totalCredits: number;
    byVersion: Record<string, number>;
  } | null>(null);
  const [statsLoading, setStatsLoading] = useState<boolean>(false);

  const fetchOrgUnits = useCallback(async () => {
    try {
      const response = await fetch(`${API_ROUTES.TMS.FACULTIES}?limit=200`);
      const result = (await response.json()) as {
        data?: { items?: OrgUnitApiItem[] };
      };

      if (response.ok && result?.data?.items) {
        setOrgUnits(mapOrgUnitOptions(result.data.items));
      }
    } catch (err) {
      console.error('Failed to fetch faculties', err);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const response = await fetch(API_ROUTES.TMS.PROGRAMS_STATS);
      const result = await response.json();

      if (response.ok && result.success) {
        setStats(result.data);
      }
    } catch (err) {
      console.error('Failed to fetch program stats', err);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const fetchPrograms = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: String(DEFAULT_PROGRAM_PAGE_SIZE),
      });

      if (selectedStatus !== 'all') {
        params.set('status', selectedStatus);
      }

      if (selectedOrgUnit !== 'all') {
        params.set('orgUnitId', selectedOrgUnit);
      }

      if (searchTerm) {
        params.set('search', searchTerm);
      }

      const response = await fetch(`${API_ROUTES.TMS.PROGRAMS}?${params.toString()}`);
      const result = (await response.json()) as ProgramListApiResponse;

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Không thể tải danh sách chương trình');
      }

      const items: ProgramApiResponseItem[] = result.data?.items ?? [];
      const mapped = items.map(mapProgramResponse);

      setPrograms(mapped);
      setPagination((prev) => ({
        ...prev,
        totalPages: result.data?.pagination?.totalPages ?? 1,
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
    fetchStats();
  }, [fetchOrgUnits, fetchStats]);

  useEffect(() => {
    fetchPrograms();
  }, [fetchPrograms]);

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

  const handleDelete = async (programId: string) => {
    const confirmed = await confirmDialog({
      title: 'Xóa chương trình',
      message: 'Bạn có chắc chắn muốn xóa chương trình này?',
      confirmText: 'Xóa',
      cancelText: 'Hủy',
      destructive: true,
    });
    if (!confirmed) return;

    try {
      const response = await fetch(API_ROUTES.TMS.PROGRAMS_BY_ID(programId), {
        method: 'DELETE',
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Không thể xóa chương trình');
      }

      setSnackbar({ open: true, message: 'Đã xóa chương trình thành công', severity: 'success' });
      fetchPrograms();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể xóa chương trình';
      setSnackbar({ open: true, message, severity: 'error' });
    }
  };

  const isEmpty = useMemo(() => !loading && programs.length === 0, [loading, programs.length]);

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
          <Typography color="text.primary">Chương trình đào tạo</Typography>
        </Breadcrumbs>

        <Paper
          elevation={0}
          sx={{
            p: 4,
            background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
            color: 'white',
            borderRadius: 2,
            mb: 4,
          }}
        >
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }}>
            <Box>
              <Typography variant="h3" component="h1" sx={{ fontWeight: 'bold', mb: 1 }}>
                Quản lý chương trình đào tạo
              </Typography>
              <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
                Theo dõi, tạo mới và cập nhật thông tin chương trình trong hệ thống
              </Typography>
            </Box>
            <Stack direction="row" spacing={2}>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={fetchPrograms}
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
                  color: '#1976d2',
                  '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.9)' },
                }}
                onClick={() => router.push('/tms/programs/create')}
              >
                Tạo chương trình mới
              </Button>
            </Stack>
          </Stack>
        </Paper>

        {/* stats */}
        {stats && (
          <>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(5, 1fr)' }, gap: 2, mb: 3 }}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <SchoolIcon color="primary" sx={{ fontSize: 32 }} />
                    <Box>
                      {statsLoading ? (
                        <Skeleton variant="text" width={60} height={32} />
                      ) : (
                        <Typography variant="h5" component="div">
                          {stats.total || 0}
                        </Typography>
                      )}
                      <Typography variant="body2" color="text.secondary">
                        Tổng số
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <DraftIcon color="action" sx={{ fontSize: 32 }} />
                    <Box>
                      {statsLoading ? (
                        <Skeleton variant="text" width={60} height={32} />
                      ) : (
                        <Typography variant="h5" component="div">
                          {stats.pending || 0}
                        </Typography>
                      )}
                      <Typography variant="body2" color="text.secondary">
                        Bản nháp
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <PendingIcon color="warning" sx={{ fontSize: 32 }} />
                    <Box>
                      {statsLoading ? (
                        <Skeleton variant="text" width={60} height={32} />
                      ) : (
                        <Typography variant="h5" component="div">
                          {stats.reviewing || 0}
                        </Typography>
                      )}
                      <Typography variant="body2" color="text.secondary">
                        Đang xem xét
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <CheckCircleIcon color="success" sx={{ fontSize: 32 }} />
                    <Box>
                      {statsLoading ? (
                        <Skeleton variant="text" width={60} height={32} />
                      ) : (
                        <Typography variant="h5" component="div">
                          {stats.approved || 0}
                        </Typography>
                      )}
                      <Typography variant="body2" color="text.secondary">
                        Đã phê duyệt
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <CancelIcon color="error" sx={{ fontSize: 32 }} />
                    <Box>
                      {statsLoading ? (
                        <Skeleton variant="text" width={60} height={32} />
                      ) : (
                        <Typography variant="h5" component="div">
                          {stats.rejected || 0}
                        </Typography>
                      )}
                      <Typography variant="body2" color="text.secondary">
                        Từ chối
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2, mb: 3 }}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <PublishIcon color="info" sx={{ fontSize: 32 }} />
                    <Box>
                      {statsLoading ? (
                        <Skeleton variant="text" width={60} height={32} />
                      ) : (
                        <Typography variant="h5" component="div">
                          {stats.published || 0}
                        </Typography>
                      )}
                      <Typography variant="body2" color="text.secondary">
                        Đã xuất bản
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <NewReleasesIcon color="primary" sx={{ fontSize: 32 }} />
                    <Box>
                      {statsLoading ? (
                        <Skeleton variant="text" width={60} height={32} />
                      ) : (
                        <Typography variant="h5" component="div">
                          {stats.newThisMonth || 0}
                        </Typography>
                      )}
                      <Typography variant="body2" color="text.secondary">
                        Mới trong tháng
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <EventAvailableIcon color="success" sx={{ fontSize: 32 }} />
                    <Box>
                      {statsLoading ? (
                        <Skeleton variant="text" width={60} height={32} />
                      ) : (
                        <Typography variant="h5" component="div">
                          {stats.active || 0}
                        </Typography>
                      )}
                      <Typography variant="body2" color="text.secondary">
                        Đang hiệu lực
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <CreditCardIcon color="success" sx={{ fontSize: 32 }} />
                    <Box>
                      {statsLoading ? (
                        <Skeleton variant="text" width={60} height={32} />
                      ) : (
                        <Typography variant="h5" component="div">
                          {stats.totalCredits || 0}
                        </Typography>
                      )}
                      <Typography variant="body2" color="text.secondary">
                        Tổng số tín chỉ
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 2, mb: 3 }}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <CategoryIcon color="secondary" sx={{ fontSize: 32 }} />
                    <Box>
                      {statsLoading ? (
                        <Skeleton variant="text" width={60} height={32} />
                      ) : (
                        <Typography variant="h5" component="div">
                          {stats.withMajor || 0}
                        </Typography>
                      )}
                      <Typography variant="body2" color="text.secondary">
                        Có ngành học
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <LinkIcon color="secondary" sx={{ fontSize: 32 }} />
                    <Box>
                      {statsLoading ? (
                        <Skeleton variant="text" width={60} height={32} />
                      ) : (
                        <Typography variant="h5" component="div">
                          {stats.withCourses || 0}
                        </Typography>
                      )}
                      <Typography variant="body2" color="text.secondary">
                        Có học phần
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>

              {stats.archived > 0 && (
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <ArchiveIcon color="action" sx={{ fontSize: 32 }} />
                      <Box>
                        {statsLoading ? (
                          <Skeleton variant="text" width={60} height={32} />
                        ) : (
                          <Typography variant="h5" component="div">
                            {stats.archived || 0}
                          </Typography>
                        )}
                        <Typography variant="body2" color="text.secondary">
                          Lưu trữ
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              )}
            </Box>

            {stats.byVersion && Object.keys(stats.byVersion).length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                  Thống kê theo phiên bản
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 2 }}>
                  {Object.entries(stats.byVersion)
                    .sort(([a], [b]) => b.localeCompare(a))
                    .map(([version, count]) => (
                      <Card key={version}>
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <CategoryIcon color="action" sx={{ fontSize: 28 }} />
                            <Box>
                              {statsLoading ? (
                                <Skeleton variant="text" width={60} height={28} />
                              ) : (
                                <Typography variant="h6" component="div">
                                  {count || 0}
                                </Typography>
                              )}
                              <Typography variant="body2" color="text.secondary">
                                Phiên bản {version}
                              </Typography>
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    ))}
                </Box>
              </Box>
            )}
          </>
        )}

        <Paper sx={{ p: 3, mb: 3 }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ xs: 'stretch', md: 'center' }}>
            <TextField
              placeholder="Tìm kiếm theo tên hoặc mã chương trình"
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
                {PROGRAM_WORKFLOW_STATUS_OPTIONS.map((status) => (
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
                  <TableCell sx={{ fontWeight: 'bold' }}>Tên chương trình</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Đơn vị</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Ngành</TableCell>

                  <TableCell sx={{ fontWeight: 'bold' }} align="center">
                    Tổng tín chỉ
                  </TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }} align="center">
                      Trạng thái
                    </TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }} align="center">
                      Thống kê
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
                        <Button color="inherit" size="small" onClick={fetchPrograms}>
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
                      <Alert severity="info">Không tìm thấy chương trình phù hợp.</Alert>
                    </TableCell>
                  </TableRow>
                )}

                {!loading && !error && programs.map((program) => (
                  <TableRow key={program.id} hover>
                    <TableCell sx={{ fontWeight: 'bold', color: 'primary.main' }}>{program.code}</TableCell>
                    <TableCell>
                      <Typography variant="subtitle2" fontWeight="medium">
                        {program.nameVi}
                      </Typography>
                      {program.nameEn && (
                        <Typography variant="body2" color="text.secondary">
                          {program.nameEn}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {program.orgUnit ? (
                        <>
                          <Typography variant="body2" fontWeight="medium">
                            {program.orgUnit.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {program.orgUnit.code}
                          </Typography>
                        </>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          Chưa cập nhật
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {program.major ? (
                        <>
                          <Typography variant="body2" fontWeight="medium">
                            {program.major.name_vi}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {program.major.code}
                          </Typography>
                        </>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          Chưa cập nhật
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="center">{program.totalCredits}</TableCell>
                    <TableCell align="center">
                      <Chip
                        label={getProgramStatusLabel(program.status)}
                        color={getProgramStatusColor(program.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2" color="text.secondary">
                        {program.stats.studentCount} SV • {program.stats.blockCount} khối • {program.stats.courseCount} HP
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={1} justifyContent="center">
                        <Tooltip title="Xem chi tiết">
                          <IconButton size="small" color="primary" onClick={() => router.push(`/tms/programs/${program.id}`)}>
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Chỉnh sửa">
                          <IconButton size="small" color="secondary" onClick={() => router.push(`/tms/programs/${program.id}/edit`)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Xóa">
                          <IconButton size="small" color="error" onClick={() => handleDelete(program.id)}>
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
              Hiển thị {programs.length} / {pagination.totalItems} chương trình
            </Typography>
            <Pagination
              color="primary"
              page={pagination.page}
              count={Math.max(pagination.totalPages, 1)}
              onChange={handlePageChange}
            />
          </Box>
        </Paper>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
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
