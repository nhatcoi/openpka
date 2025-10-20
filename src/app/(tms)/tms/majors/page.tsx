'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
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
  HelpOutline as HelpOutlineIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  RateReview as RateReviewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import {
  MajorStatus,
  getMajorStatusColor,
  getMajorStatusLabel,
  getMajorDegreeLevelLabel,
} from '@/constants/majors';

interface Major {
  id: number;
  code: string;
  name_vi: string;
  name_en?: string;
  short_name?: string;
  degree_level: string;
  duration_years?: number;
  status: string;
  org_unit_id: number;
  OrgUnit?: {
    id: number;
    name: string;
    code: string;
    type?: string;
    parent_id?: number;
  };
  Major?: {
    id: number;
    code: string;
    name_vi: string;
    name_en?: string;
    degree_level: string;
  };
  other_majors?: Array<{
    id: number;
    code: string;
    name_vi: string;
    name_en?: string;
    degree_level: string;
  }>;
  Program?: Array<{
    id: number;
    code?: string;
    name_vi?: string;
    name_en?: string;
    version: string;
    status: string;
    total_credits: number;
    effective_from?: string;
    effective_to?: string;
  }>;
  MajorOutcome?: Array<{
    id: number;
    code: string;
    content: string;
    version?: string;
    is_active?: boolean;
  }>;
  MajorQuotaYear?: Array<{
    id: number;
    year: number;
    quota: number;
    note?: string;
  }>;
  MajorTuition?: Array<{
    id: number;
    year: number;
    tuition_group: string;
    amount_vnd: number;
    note?: string;
  }>;
  _count?: {
    Program: number;
    MajorOutcome: number;
    MajorQuotaYear: number;
    MajorTuition: number;
    other_majors: number;
  };
  created_at?: string;
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
  const [selectedStatus, setSelectedStatus] = useState<MajorStatus | 'all'>('all');
  const [selectedOrgUnit, setSelectedOrgUnit] = useState<string>('all');
  const [orgUnits, setOrgUnits] = useState<Array<{id: number; name: string; code: string}>>([]);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; major: Major | null }>({
    open: false,
    major: null
  });
  const [helpDialogOpen, setHelpDialogOpen] = useState(false);
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
    setSelectedStatus(event.target.value);
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
            <Button
              variant="outlined"
              startIcon={<HelpOutlineIcon />}
              onClick={() => setHelpDialogOpen(true)}
              color="inherit"
              size="small"
              sx={{ color: '#fff', borderColor: 'rgba(255,255,255,0.7)' }}
            >
              Hướng dẫn
            </Button>
          </Stack>
        </Paper>

        {/* Action Buttons */}
        <Paper sx={{ p: 2 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Button
              variant="outlined"
              startIcon={<RateReviewIcon />}
              onClick={() => router.push('/tms/majors/review')}
              color="primary"
              size="small"
            >
              Phê duyệt ngành đào tạo
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
                  <MenuItem value="draft">Nháp</MenuItem>
                  <MenuItem value="proposed">Đề xuất</MenuItem>
                  <MenuItem value="reviewing">Đang xem xét</MenuItem>
                  <MenuItem value="approved">Đã phê duyệt</MenuItem>
                  <MenuItem value="rejected">Bị từ chối</MenuItem>
                  <MenuItem value="published">Đã công bố</MenuItem>
                  <MenuItem value="active">Hoạt động</MenuItem>
                  <MenuItem value="suspended">Tạm dừng</MenuItem>
                  <MenuItem value="closed">Đã đóng</MenuItem>
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
                          {major.OrgUnit?.name || 'N/A'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {major.OrgUnit?.code || ''}
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

        {/* Help Dialog */}
        <Dialog open={helpDialogOpen} onClose={() => setHelpDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white', display: 'flex', alignItems: 'center', gap: 1 }}>
            <InfoIcon />
            Hướng dẫn quản lý Ngành học
          </DialogTitle>
          <DialogContent dividers sx={{ pt: 3 }}>
            <Stack spacing={3}>
              <Box>
                <Typography variant="h6" gutterBottom color="primary" sx={{ fontWeight: 'bold' }}>
                  1. Tạo Ngành học mới
                </Typography>
                <Typography variant="body1" paragraph>
                  Khoa hoặc phòng ban được ủy quyền có thể tạo ngành học mới bằng cách nhập các thông tin cơ bản như mã ngành, tên tiếng Việt, tên tiếng Anh, bậc đào tạo, và các thông tin liên quan khác.
                </Typography>
                <Alert severity="info" sx={{ mt: 1 }}>
                  <strong>Lưu ý:</strong> Mã ngành phải là duy nhất trong đơn vị tổ chức. Khuyến khích sử dụng mã ngành theo tiêu chuẩn của Bộ Giáo dục.
                </Alert>
              </Box>

              <Box>
                <Typography variant="h6" gutterBottom color="primary" sx={{ fontWeight: 'bold' }}>
                  2. Quản lý thông tin Ngành học
                </Typography>
                <Typography variant="body1" paragraph>
                  Mỗi ngành học có thể bao gồm nhiều thông tin quan trọng:
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircleIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Chương trình đào tạo (CTĐT)" 
                      secondary="Các chương trình đào tạo thuộc ngành, bao gồm các phiên bản khác nhau"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircleIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Chuẩn đầu ra (CĐR)" 
                      secondary="Các chuẩn đầu ra của ngành học theo từng phiên bản"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircleIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Chỉ tiêu tuyển sinh" 
                      secondary="Chỉ tiêu tuyển sinh theo từng năm học"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircleIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Học phí" 
                      secondary="Mức học phí theo năm và nhóm học phí"
                    />
                  </ListItem>
                </List>
              </Box>

              <Box>
                <Typography variant="h6" gutterBottom color="primary" sx={{ fontWeight: 'bold' }}>
                  3. Trạng thái Ngành học
                </Typography>
                <Typography variant="body1" paragraph>
                  Ngành học có các trạng thái khác nhau trong vòng đời:
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemIcon>
                      <InfoIcon sx={{ color: 'grey.500' }} />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Draft (Bản nháp)" 
                      secondary="Ngành học đang được soạn thảo, chưa đưa vào sử dụng"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <InfoIcon sx={{ color: 'warning.main' }} />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Proposed (Đề xuất)" 
                      secondary="Ngành học đã được đề xuất, đang chờ phê duyệt"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircleIcon color="success" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Active (Đang hoạt động)" 
                      secondary="Ngành học đang được sử dụng để đào tạo"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <InfoIcon sx={{ color: 'error.main' }} />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Suspended/Closed (Tạm ngưng/Đóng)" 
                      secondary="Ngành học tạm ngưng hoặc không còn đào tạo"
                    />
                  </ListItem>
                </List>
              </Box>

              <Box>
                <Typography variant="h6" gutterBottom color="primary" sx={{ fontWeight: 'bold' }}>
                  4. Liên kết với Chương trình đào tạo
                </Typography>
                <Typography variant="body1" paragraph>
                  Sau khi tạo ngành học, bạn có thể tạo các chương trình đào tạo cho ngành. Mỗi ngành có thể có nhiều phiên bản CTĐT khác nhau phục vụ cho các khóa học khác nhau.
                </Typography>
                <Alert severity="success" sx={{ mt: 1 }}>
                  <strong>Mẹo:</strong> Nên hoàn thiện đầy đủ thông tin ngành học trước khi tạo chương trình đào tạo.
                </Alert>
              </Box>

              <Box sx={{ bgcolor: 'grey.100', p: 2, borderRadius: 1, mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
                  Quy trình tổng quan:
                </Typography>
                <Typography variant="body2" component="div">
                  Tạo Ngành học → Cập nhật thông tin cơ bản → Tạo CTĐT → Quản lý CĐR, chỉ tiêu, học phí → Theo dõi & cập nhật
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