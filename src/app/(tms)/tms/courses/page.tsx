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
  MenuBook as MenuBookIcon,
  Note as DraftIcon,
  Pending as PendingIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Publish as PublishIcon,
  Archive as ArchiveIcon,
  NewReleases as NewReleasesIcon,
  Link as LinkIcon,
  CreditCard as CreditCardIcon,
  Category as CategoryIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import {
  COURSE_WORKFLOW_STATUS_OPTIONS,
  getCourseTypeLabel,
  getStatusColor,
  getStatusLabel,
  getRawCourseStatuses,
  CourseType,
} from '@/constants/courses';
import { WorkflowStatus } from '@/constants/workflow-statuses';
import { API_ROUTES } from '@/constants/routes';
import {
  OrgUnitApiItem,
  OrgUnitOption,
  CourseApiResponseItem,
  CourseListApiResponse,
  CourseListItem,
  mapOrgUnitOptions,
  mapCourseResponse,
} from './course-utils';
import { useConfirmDialog } from '@/components/dialogs/ConfirmDialogProvider';

interface PaginationState {
  page: number;
  totalPages: number;
  totalItems: number;
}

const DEFAULT_COURSE_PAGE_SIZE = 10;

export default function CoursesPage(): JSX.Element {
  const router = useRouter();
  const confirmDialog = useConfirmDialog();
  const [courses, setCourses] = useState<CourseListItem[]>([]);
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
    withPrerequisites: number;
    totalCredits: number;
    byType: Record<string, number>;
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
      const response = await fetch(API_ROUTES.TMS.COURSES_STATS);
      const result = await response.json();

      if (response.ok && result.success) {
        setStats(result.data);
      }
    } catch (err) {
      console.error('Failed to fetch course stats', err);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const fetchCourses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: String(DEFAULT_COURSE_PAGE_SIZE),
      });

      if (selectedStatus !== 'all') {
        const rawStatuses = getRawCourseStatuses(selectedStatus);
        if (rawStatuses.length === 1) {
          params.set('status', rawStatuses[0]);
        }
      }

      if (selectedOrgUnit !== 'all') {
        params.set('orgUnitId', selectedOrgUnit);
      }

      if (searchTerm) {
        params.set('search', searchTerm);
      }

      const response = await fetch(`${API_ROUTES.TMS.COURSES}?${params.toString()}`);
      const result = (await response.json()) as CourseListApiResponse;

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Không thể tải danh sách học phần');
      }

      const items: CourseApiResponseItem[] = result.data?.items ?? [];
      const mapped = items.map(mapCourseResponse);

      setCourses(mapped);
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
    fetchCourses();
  }, [fetchCourses]);

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

  const handleDelete = async (courseId: string) => {
    const confirmed = await confirmDialog({
      title: 'Xóa học phần',
      message: 'Bạn có chắc chắn muốn xóa học phần này?',
      confirmText: 'Xóa',
      cancelText: 'Hủy',
      destructive: true,
    });
    if (!confirmed) return;

    try {
      const response = await fetch(API_ROUTES.TMS.COURSES_BY_ID(courseId), {
        method: 'DELETE',
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Không thể xóa học phần');
      }

      setSnackbar({ open: true, message: 'Đã xóa học phần thành công', severity: 'success' });
      fetchCourses();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể xóa học phần';
      setSnackbar({ open: true, message, severity: 'error' });
    }
  };

  const isEmpty = useMemo(() => !loading && courses.length === 0, [loading, courses.length]);

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
          <Typography color="text.primary">Học phần</Typography>
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
                Quản lý học phần
              </Typography>
              <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
                Theo dõi, tạo mới và cập nhật thông tin học phần trong hệ thống
              </Typography>
            </Box>
            <Stack direction="row" spacing={2}>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={fetchCourses}
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
                onClick={() => router.push('/tms/courses/create')}
              >
                Tạo học phần mới
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
                  <MenuBookIcon color="primary" sx={{ fontSize: 32 }} />
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
                  <LinkIcon color="secondary" sx={{ fontSize: 32 }} />
                  <Box>
                    {statsLoading ? (
                      <Skeleton variant="text" width={60} height={32} />
                    ) : (
                      <Typography variant="h5" component="div">
                        {stats.withPrerequisites || 0}
                      </Typography>
                    )}
                    <Typography variant="body2" color="text.secondary">
                      Có điều kiện tiên quyết
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
                        {stats.totalCredits?.toFixed(1) || '0.0'}
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

          {stats.byType && Object.keys(stats.byType).length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                Thống kê theo loại học phần
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 2 }}>
                {Object.entries(stats.byType).map(([type, count]) => (
                  <Card key={type}>
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
                            {getCourseTypeLabel(type as CourseType) || type}
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
              placeholder="Tìm kiếm theo tên hoặc mã học phần"
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
                {COURSE_WORKFLOW_STATUS_OPTIONS.map((status) => (
                  <MenuItem key={status.value} value={status.value}>
                    {status.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl sx={{ minWidth: 220 }}>
              <InputLabel>Khoa</InputLabel>
              <Select value={selectedOrgUnit} label="Khoa" onChange={handleOrgUnitChange}>
                <MenuItem value="all">Tất cả khoa</MenuItem>
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
                  <TableCell sx={{ fontWeight: 'bold' }}>Tên học phần</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Khoa</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }} align="center">
                    Tín chỉ
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Danh mục</TableCell>
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
                        <Button color="inherit" size="small" onClick={fetchCourses}>
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
                      <Alert severity="info">Không tìm thấy học phần phù hợp.</Alert>
                    </TableCell>
                  </TableRow>
                )}

                {!loading && !error && courses.map((course) => (
                  <TableRow key={course.id} hover>
                    <TableCell sx={{ fontWeight: 'bold', color: 'primary.main' }}>{course.code}</TableCell>
                    <TableCell>
                      <Typography variant="subtitle2" fontWeight="medium">
                        {course.nameVi}
                      </Typography>
                      {course.nameEn && (
                        <Typography variant="body2" color="text.secondary">
                          {course.nameEn}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {course.orgUnit ? (
                        <>
                          <Typography variant="body2" fontWeight="medium">
                            {course.orgUnit.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {course.orgUnit.code}
                          </Typography>
                        </>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          Chưa cập nhật
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <Stack spacing={0.5} alignItems="center">
                        <Typography variant="body2" fontWeight="medium" color="primary">
                          Tổng: {course.credits} tín chỉ
                        </Typography>
                        <Stack direction="row" spacing={1}>
                          <Chip
                            label={`LT: ${course.theoryCredit}`}
                            size="small"
                            variant="outlined"
                            color="info"
                            sx={{ fontSize: '0.7rem' }}
                          />
                          <Chip
                            label={`TH: ${course.practicalCredit}`}
                            size="small"
                            variant="outlined"
                            color="secondary"
                            sx={{ fontSize: '0.7rem' }}
                          />
                        </Stack>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getCourseTypeLabel(course.type)}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={getStatusLabel(course.status)}
                        color={getStatusColor(course.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={1} justifyContent="center">
                        <Tooltip title="Xem chi tiết">
                          <IconButton size="small" color="primary" onClick={() => router.push(`/tms/courses/${course.id}`)}>
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Chỉnh sửa">
                          <IconButton size="small" color="secondary" onClick={() => router.push(`/tms/courses/${course.id}/edit`)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Xóa">
                          <IconButton size="small" color="error" onClick={() => handleDelete(course.id)}>
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
              Hiển thị {courses.length} / {pagination.totalItems} học phần
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
