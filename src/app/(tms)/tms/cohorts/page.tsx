'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Grid,
  Alert,
  CircularProgress,
  Pagination,
  InputAdornment,
  Breadcrumbs,
  Link,
  Container,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import { 
  CohortIntakeTerm,
  getCohortStatusLabel, 
  getCohortStatusColor,
  getCohortIntakeTermLabel,
  COHORT_WORKFLOW_STATUS_OPTIONS,
  COHORT_INTAKE_TERMS,
  getRawCohortStatuses,
  normalizeCohortWorkflowStatus, 
} from '@/constants/cohorts';
import { WorkflowStatus } from '@/constants/workflow-statuses';

interface Cohort {
  id: string;
  code: string;
  name_vi: string;
  name_en?: string;
  academic_year: string;
  intake_year: number;
  intake_term: string;
  major_id?: string;
  program_id?: string;
  org_unit_id?: string;
  planned_quota?: number;
  actual_quota?: number;
  start_date?: string;
  expected_graduation_date?: string;
  status: string;
  is_active: boolean;
  description?: string;
  created_at: string;
  updated_at: string;
}

export default function CohortsPage() {
  const router = useRouter();
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<WorkflowStatus | 'all'>('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCohort, setSelectedCohort] = useState<Cohort | null>(null);

  // Fetch cohorts data
  const fetchCohorts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(searchTerm && { search: searchTerm }),
      });

      if (statusFilter !== 'all') {
        const rawStatuses = getRawCohortStatuses(statusFilter);
        if (rawStatuses.length > 0) {
          params.append('status', rawStatuses[0]);
        }
      }

      const response = await fetch(`/api/cohorts?${params}`);
      if (!response.ok) {
        throw new Error('Không thể tải danh sách khóa học');
      }

      const data = await response.json();
      setCohorts(data.cohorts || []);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCohorts();
  }, [page, searchTerm, statusFilter]);

  const handleDelete = async (cohort: Cohort) => {
    try {
      const response = await fetch(`/api/cohorts/${cohort.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Không thể xóa khóa học');
      }

      setDeleteDialogOpen(false);
      setSelectedCohort(null);
      fetchCohorts(); // Refresh list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra khi xóa');
    }
  };

  const handlePageChange = (_: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  const filteredCohorts = cohorts.filter(cohort => {
    const matchesSearch = !searchTerm || 
      cohort.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cohort.name_vi.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus =
      statusFilter === 'all' || normalizeCohortWorkflowStatus(cohort.status) === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

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
        <Typography color="text.primary">Khóa học</Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Quản lý khóa học
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => router.push('/tms/cohorts/create')}
        >
          Tạo khóa học mới
        </Button>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Tìm kiếm theo mã hoặc tên khóa học..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                select
                label="Trạng thái"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as WorkflowStatus | 'all')}
              >
                <MenuItem value="all">Tất cả</MenuItem>
                {COHORT_WORKFLOW_STATUS_OPTIONS.map((status) => (
                  <MenuItem key={status.value} value={status.value}>
                    {status.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Cohorts Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Mã khóa</TableCell>
                <TableCell>Tên khóa học</TableCell>
                <TableCell>Năm học</TableCell>
                <TableCell>Năm tuyển sinh</TableCell>
                <TableCell>Học kỳ</TableCell>
                <TableCell>Chỉ tiêu</TableCell>
                <TableCell>Trạng thái</TableCell>
                <TableCell>Ngày tạo</TableCell>
                <TableCell align="center">Thao tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredCohorts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    <Typography variant="body2" color="text.secondary">
                      Không có dữ liệu khóa học
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredCohorts.map((cohort) => (
                  <TableRow key={cohort.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {cohort.code}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {cohort.name_vi}
                        </Typography>
                        {cohort.name_en && (
                          <Typography variant="caption" color="text.secondary">
                            {cohort.name_en}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>{cohort.academic_year}</TableCell>
                    <TableCell>{cohort.intake_year}</TableCell>
                    <TableCell>
                      {getCohortIntakeTermLabel(cohort.intake_term)}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {cohort.actual_quota || 0}/{cohort.planned_quota || 0}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getCohortStatusLabel(cohort.status)}
                        color={getCohortStatusColor(cohort.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(cohort.created_at).toLocaleDateString('vi-VN')}
                    </TableCell>
                    <TableCell align="center">
                      <Box display="flex" gap={1} justifyContent="center">
                        <Tooltip title="Xem chi tiết">
                          <IconButton
                            size="small"
                            onClick={() => router.push(`/tms/cohorts/${cohort.id}`)}
                          >
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Chỉnh sửa">
                          <IconButton
                            size="small"
                            onClick={() => router.push(`/tms/cohorts/${cohort.id}/edit`)}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Xóa">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => {
                              setSelectedCohort(cohort);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        {totalPages > 1 && (
          <Box display="flex" justifyContent="center" p={2}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={handlePageChange}
              color="primary"
            />
          </Box>
        )}
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Xác nhận xóa khóa học</DialogTitle>
        <DialogContent>
          <Typography>
            Bạn có chắc chắn muốn xóa khóa học "{selectedCohort?.name_vi}" không?
            Hành động này không thể hoàn tác.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Hủy</Button>
          <Button
            onClick={() => selectedCohort && handleDelete(selectedCohort)}
            color="error"
            variant="contained"
          >
            Xóa
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
