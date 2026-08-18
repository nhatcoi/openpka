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
import { HR_ROUTES } from '@/constants/routes';
import { useAssignment, useDeleteAssignment } from '@/features/hr';
import { useConfirmDialog } from '@/components/dialogs/confirm-dialog-provider';

const formatDate = (value?: string | null) => {
  if (!value) return 'Không xác định';
  return new Date(value).toLocaleDateString('vi-VN');
};

export default function AssignmentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const { data: session, status } = useSession();
  const confirmDialog = useConfirmDialog();

  const { data: assignment, isLoading: loading, error: queryError } = useAssignment(id);
  const { mutateAsync: deleteAssignment } = useDeleteAssignment();
  const [actionError, setActionError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      signIn();
    }
  }, [session, status]);

  const error = actionError || (queryError ? (queryError as Error).message : null);

  const handleDelete = async () => {
    if (!assignment) return;
    const confirmed = await confirmDialog({
      title: 'Xóa phân công',
      message: 'Bạn có chắc chắn muốn xóa phân công này?',
      confirmText: 'Xóa',
      cancelText: 'Hủy',
      destructive: true,
    });
    if (!confirmed) return;

    try {
      setDeleting(true);
      setActionError(null);
      await deleteAssignment(assignment.id);
      router.push(HR_ROUTES.ASSIGNMENTS);
    } catch (err) {
      console.error(err);
      setActionError(err instanceof Error ? err.message : 'Không thể xóa phân công');
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

  const employeeName = assignment.Employee?.User?.full_name || assignment.employee?.user?.full_name || 'N/A';
  const employeeNo = assignment.Employee?.employee_no || assignment.employee?.employee_no || assignment.employee_id;
  const employeeEmail = assignment.Employee?.User?.email || assignment.employee?.user?.email || 'N/A';
  const employeePhone = assignment.Employee?.User?.phone || assignment.employee?.user?.phone || 'N/A';
  const orgUnitName = assignment.OrgUnit?.name || assignment.org_unit?.name || 'N/A';
  const orgUnitCode = assignment.OrgUnit?.code || assignment.org_unit?.code || assignment.org_unit_id;
  const jobPositionTitle = assignment.JobPosition?.title || assignment.position?.title || assignment.Position?.title || 'Không có';

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
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <PersonIcon color="primary" />
                <Typography variant="h6">Nhân viên</Typography>
              </Box>
              <Typography variant="body1" fontWeight="medium">
                {employeeName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Mã NV: {employeeNo}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Email: {employeeEmail}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                SĐT: {employeePhone}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <ApartmentIcon color="primary" />
                <Typography variant="h6">Đơn vị</Typography>
              </Box>
              <Typography variant="body1" fontWeight="medium">
                {orgUnitName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Mã đơn vị: {orgUnitCode}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Chức vụ: {jobPositionTitle}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Chi tiết phân công
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                    Loại phân công
                  </Typography>
                  <Chip label={assignment.assignment_type} color="primary" variant="outlined" />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                    Tỷ lệ phân bổ
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1}>
                    <PercentIcon fontSize="small" color="action" />
                    <Typography variant="body1">
                      {assignment.allocation
                        ? `${(parseFloat(String(assignment.allocation)) * 100).toFixed(0)}%`
                        : '100%'}
                    </Typography>
                  </Box>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                    Phân công chính
                  </Typography>
                  <Chip
                    label={assignment.is_primary ? 'Có' : 'Không'}
                    color={assignment.is_primary ? 'success' : 'default'}
                    variant="outlined"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                    Ngày bắt đầu
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1}>
                    <CalendarTodayIcon fontSize="small" color="action" />
                    <Typography variant="body1">{formatDate(assignment.start_date)}</Typography>
                  </Box>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
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

