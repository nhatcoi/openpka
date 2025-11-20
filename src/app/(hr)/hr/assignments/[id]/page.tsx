'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession, signIn } from 'next-auth/react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  IconButton,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonIcon from '@mui/icons-material/Person';
import ApartmentIcon from '@mui/icons-material/Apartment';
import PercentIcon from '@mui/icons-material/Percent';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import { API_ROUTES, HR_ROUTES } from '@/constants/routes';

interface AssignmentDetail {
  id: string;
  employee_id: string;
  org_unit_id: string;
  position_id?: string | null;
  is_primary: boolean;
  assignment_type: string;
  allocation: string | null;
  start_date: string;
  end_date?: string | null;
  Employee?: {
    User?: {
      full_name: string;
      email?: string | null;
      phone?: string | null;
    } | null;
    employee_no?: string | null;
  } | null;
  OrgUnit?: {
    name?: string | null;
    code?: string | null;
  } | null;
  JobPosition?: {
    title?: string | null;
  } | null;
}

const formatDate = (value?: string | null) => {
  if (!value) return 'Không xác định';
  return new Date(value).toLocaleDateString('vi-VN');
};

export default function AssignmentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session, status } = useSession();

  const [assignment, setAssignment] = useState<AssignmentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      signIn();
      return;
    }

    if (params.id) {
      void fetchAssignment(params.id as string);
    }
  }, [session, status, params.id]);

  const fetchAssignment = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(API_ROUTES.HR.ASSIGNMENTS_BY_ID(id), {
        credentials: 'include',
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Không thể tải phân công');
      }
      setAssignment(result.data);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Không thể tải phân công');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!assignment) return;
    if (!confirm('Bạn có chắc muốn xóa phân công này?')) return;

    try {
      setDeleting(true);
      const response = await fetch(API_ROUTES.HR.ASSIGNMENTS_BY_ID(assignment.id), {
        method: 'DELETE',
        credentials: 'include',
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Không thể xóa phân công');
      }
      router.push(HR_ROUTES.ASSIGNMENTS);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Không thể xóa phân công');
    } finally {
      setDeleting(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <Box display="flex" alignItems="center" justifyContent="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (!session) {
    return null;
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!assignment) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">Không tìm thấy phân công</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => router.push(HR_ROUTES.ASSIGNMENTS)}>
          Quay lại
        </Button>
        <Box display="flex" gap={1}>
          <Button
            variant="contained"
            startIcon={<EditIcon />}
            onClick={() => router.push(HR_ROUTES.ASSIGNMENTS_EDIT(assignment.id))}
          >
            Chỉnh sửa
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            disabled={deleting}
            onClick={handleDelete}
          >
            {deleting ? 'Đang xóa...' : 'Xóa'}
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <PersonIcon color="primary" />
                <Typography variant="h6">Nhân viên</Typography>
              </Box>
              <Typography variant="body1" fontWeight="medium">
                {assignment.Employee?.User?.full_name || 'N/A'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Mã NV: {assignment.Employee?.employee_no || assignment.employee_id}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Email: {assignment.Employee?.User?.email || 'N/A'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                SĐT: {assignment.Employee?.User?.phone || 'N/A'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <ApartmentIcon color="primary" />
                <Typography variant="h6">Đơn vị</Typography>
              </Box>
              <Typography variant="body1" fontWeight="medium">
                {assignment.OrgUnit?.name || 'N/A'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Mã đơn vị: {assignment.OrgUnit?.code || assignment.org_unit_id}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Chức vụ: {assignment.JobPosition?.title || 'Không có'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Chi tiết phân công
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2" color="text.secondary">
                    Loại phân công
                  </Typography>
                  <Chip label={assignment.assignment_type} color="primary" variant="outlined" />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2" color="text.secondary">
                    Tỷ lệ phân bổ
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1}>
                    <PercentIcon fontSize="small" color="action" />
                    <Typography variant="body1">
                      {assignment.allocation
                        ? `${(parseFloat(assignment.allocation) * 100).toFixed(0)}%`
                        : '100%'}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2" color="text.secondary">
                    Phân công chính
                  </Typography>
                  <Chip
                    label={assignment.is_primary ? 'Có' : 'Không'}
                    color={assignment.is_primary ? 'success' : 'default'}
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2" color="text.secondary">
                    Ngày bắt đầu
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1}>
                    <CalendarTodayIcon fontSize="small" color="action" />
                    <Typography variant="body1">{formatDate(assignment.start_date)}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2" color="text.secondary">
                    Ngày kết thúc
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1}>
                    <CalendarTodayIcon fontSize="small" color="action" />
                    <Typography variant="body1">{formatDate(assignment.end_date)}</Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

