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
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
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
} from '@mui/material';
import {
  Add as AddIcon,
  CheckCircle as CheckCircleIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  HelpOutline as HelpOutlineIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import {
  DEFAULT_PROGRAM_PAGE_SIZE,
  PROGRAM_STATUSES,
  ProgramStatus,
  getProgramDegreeLabel,
  getProgramStatusColor,
  getProgramStatusLabel,
} from '@/constants/programs';
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
  const [programs, setPrograms] = useState<ProgramListItem[]>([]);
  const [orgUnits, setOrgUnits] = useState<OrgUnitOption[]>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    totalPages: 1,
    totalItems: 0,
  });
  const [selectedStatus, setSelectedStatus] = useState<ProgramStatus | 'all'>('all');
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
  const [helpDialogOpen, setHelpDialogOpen] = useState(false);

  const fetchOrgUnits = useCallback(async () => {
    try {
      const response = await fetch('/api/tms/faculties?limit=200');
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

      const response = await fetch(`/api/tms/programs?${params.toString()}`);
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
  }, [fetchOrgUnits]);

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

  const handleStatusChange = (event: SelectChangeEvent<ProgramStatus | 'all'>) => {
    setSelectedStatus(event.target.value as ProgramStatus | 'all');
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleOrgUnitChange = (event: SelectChangeEvent<string>) => {
    setSelectedOrgUnit(event.target.value);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleDelete = async (programId: string) => {
    const confirmed = window.confirm('Bạn có chắc chắn muốn xóa chương trình này?');
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/tms/programs/${programId}`, {
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
                startIcon={<HelpOutlineIcon />}
                onClick={() => setHelpDialogOpen(true)}
                color="inherit"
                sx={{ color: '#fff', borderColor: 'rgba(255,255,255,0.7)' }}
              >
                Hướng dẫn
              </Button>
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
                {PROGRAM_STATUSES.map((status) => (
                  <MenuItem key={status} value={status}>
                    {getProgramStatusLabel(status)}
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

        <Dialog open={helpDialogOpen} onClose={() => setHelpDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white', display: 'flex', alignItems: 'center', gap: 1 }}>
            <InfoIcon />
            Hướng dẫn quy trình quản lý Chương trình đào tạo
          </DialogTitle>
          <DialogContent dividers sx={{ pt: 3 }}>
            <Stack spacing={3}>
              <Box>
                <Typography variant="h6" gutterBottom color="primary" sx={{ fontWeight: 'bold' }}>
                  1. Tạo bản Draft CTĐT
                </Typography>
                <Typography variant="body1" paragraph>
                  Khoa (hoặc người được ủy quyền) tạo bản draft CTĐT, tự do thêm/sửa/xóa các khối học phần (từ mẫu, tự do, hoặc sao chép từ CTĐT khác) và gán học phần (thủ công, hàng loạt, kéo thả, v.v.).
                </Typography>
                <Alert severity="info" sx={{ mt: 1 }}>
                  <strong>Lưu ý:</strong> Khi ở trạng thái draft, Khoa có toàn quyền CRUD (Tạo, Đọc, Cập nhật, Xóa).
                </Alert>
              </Box>

              <Box>
                <Typography variant="h6" gutterBottom color="primary" sx={{ fontWeight: 'bold' }}>
                  2. Gửi lên Phòng Đào tạo xem xét
                </Typography>
                <Typography variant="body1" paragraph>
                  Sau khi gửi lên PĐT xem xét, Khoa mất quyền chỉnh sửa. PĐT xem xét duyệt hoặc từ chối, có thể yêu cầu chỉnh sửa.
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircleIcon color="success" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Được duyệt" 
                      secondary="CTĐT có hiệu lực sử dụng ngay tại cấp Khoa/Đơn vị"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <InfoIcon color="warning" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Yêu cầu chỉnh sửa" 
                      secondary="Khoa được quyền chỉnh sửa lại và gửi lại"
                    />
                  </ListItem>
                </List>
              </Box>

              <Box>
                <Typography variant="h6" gutterBottom color="primary" sx={{ fontWeight: 'bold' }}>
                  3. Phê duyệt cấp Hội đồng/BGH
                </Typography>
                <Typography variant="body1" paragraph>
                  Hội đồng đào tạo hoặc BGH có quy trình tương tự PĐT, nhưng cấp độ duyệt công bố toàn hệ thống đại học.
                </Typography>
                <Alert severity="success" sx={{ mt: 1 }}>
                  <strong>Sau khi được duyệt:</strong> CTĐT được công bố chính thức và áp dụng cho toàn hệ thống.
                </Alert>
              </Box>

              <Box sx={{ bgcolor: 'grey.100', p: 2, borderRadius: 1, mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
                  Tóm tắt luồng phê duyệt:
                </Typography>
                <Typography variant="body2" component="div">
                  Draft → PĐT xem xét → (Nếu duyệt) Hiệu lực tại Khoa → Hội đồng/BGH xem xét → (Nếu duyệt) Công bố toàn hệ thống
                </Typography>
              </Box>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={() => setHelpDialogOpen(false)} variant="contained">
              Đã hiểu
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
