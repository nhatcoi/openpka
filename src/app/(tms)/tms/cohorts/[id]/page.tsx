'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Box,
  Typography,
  Button,
  Grid,
  Alert,
  CircularProgress,
  Paper,
  Stack,
  Chip,
  Card,
  CardContent,
  Divider,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Badge,
  Breadcrumbs,
  Link,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  School as SchoolIcon,
  People as PeopleIcon,
  CalendarToday as CalendarIcon,
  Assessment as AssessmentIcon,
  CheckCircle as CheckCircleIcon,
  Group as GroupIcon,
} from '@mui/icons-material';

interface Cohort {
  id: string;
  code: string;
  name_vi: string;
  name_en: string;
  academic_year: string;
  intake_year: number;
  intake_term: string;
  major_id: string;
  program_id: string;
  large_id: string;
  planned_quota: number;
  actual_quota: number;
  start_date: string;
  expected_graduation_date: string;
  status: string;
  is_active: boolean;
  description: string;
  created_at: string;
  updated_at: string;
  students: Array<{
    id: string;
    student_id: string;
    status: string;
    gpa: number;
  }>;
}

interface CohortStats {
  total_students: number;
  active_students: number;
  graduated_students: number;
  average_gpa: number;
  completion_rate: number;
}

const STATUS_COLORS = {
  PLANNING: 'warning',
  ACTIVE: 'success',
  GRADUATED: 'info',
  SUSPENDED: 'error',
  CLOSED: 'default',
} as const;

const STATUS_LABELS = {
  PLANNING: 'Đang lên kế hoạch',
  ACTIVE: 'Đang hoạt động',
  GRADUATED: 'Đã tốt nghiệp',
  SUSPENDED: 'Tạm dừng',
  CLOSED: 'Đã đóng',
} as const;

export default function CohortDetailPage() {
  const router = useRouter();
  const params = useParams();
  const cohortId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cohort, setCohort] = useState<Cohort | null>(null);
  const [stats, setStats] = useState<CohortStats | null>(null);

  useEffect(() => {
    const fetchCohort = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/cohorts/${cohortId}`);
        
        if (!response.ok) {
          throw new Error('Không thể tải thông tin khóa học');
        }
        
        const data = await response.json();
        setCohort(data.cohort);
        setStats(data.stats);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Có lỗi xảy ra');
      } finally {
        setLoading(false);
      }
    };

    if (cohortId) {
      fetchCohort();
    }
  }, [cohortId]);

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', backgroundColor: '#f8fafc', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error || !cohort) {
    return (
      <Box sx={{ minHeight: '100vh', backgroundColor: '#f8fafc', px: 4, py: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error || 'Không tìm thấy thông tin khóa học'}
        </Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={() => router.back()}>
          Quay lại
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      {/* Header */}
      <Box sx={{ backgroundColor: 'white', borderBottom: 1, borderColor: 'divider', px: 8, py: 4 }}>
        <Breadcrumbs sx={{ mb: 2 }}>
          <Link
            color="inherit"
            href="/tms"
            sx={{ textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
          >
            TMS
          </Link>
          <Link
            color="inherit"
            href="/tms/cohorts"
            sx={{ textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
          >
            Khóa học
          </Link>
          <Typography color="text.primary">{cohort.name_vi}</Typography>
        </Breadcrumbs>
        
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" spacing={2}>
            <Button 
              startIcon={<ArrowBackIcon />} 
              onClick={() => router.back()}
              variant="outlined"
            >
              Quay lại
            </Button>
            <Box>
              <Typography variant="h4" component="h1">
                {cohort.name_vi}
              </Typography>
              <Typography variant="h6" color="text.secondary">
                {cohort.code} • {cohort.academic_year}
              </Typography>
            </Box>
          </Stack>
          <Stack direction="row" spacing={2}>
            <Chip 
              label={STATUS_LABELS[cohort.status as keyof typeof STATUS_LABELS] || cohort.status}
              color={STATUS_COLORS[cohort.status as keyof typeof STATUS_COLORS] || 'default'}
              variant="outlined"
            />
            <Button 
              variant="contained" 
              startIcon={<EditIcon />}
              onClick={() => router.push(`/tms/cohorts/${cohortId}/edit`)}
            >
              Chỉnh sửa
            </Button>
          </Stack>
        </Stack>
      </Box>

      {/* Main Content */}
      <Box sx={{ px: 8, py: 6, maxWidth: '1600px', mx: 'auto' }}>
        <Grid container spacing={6}>
          {/* Left Column */}
          <Grid item xs={12} lg={9}>
            <Stack spacing={4}>
              {/* Basic Information */}
              <Card sx={{ boxShadow: 3, borderRadius: 2 }}>
                <CardContent sx={{ p: 4 }}>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SchoolIcon color="primary" />
                    Thông tin cơ bản
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          Mã khóa học
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {cohort.code}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          Năm học
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {cohort.academic_year}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          Năm tuyển sinh
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {cohort.intake_year}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          Học kỳ tuyển sinh
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {cohort.intake_term}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12}>
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          Mô tả
                        </Typography>
                        <Typography variant="body1">
                          {cohort.description || 'Không có mô tả'}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Timeline */}
              <Card sx={{ boxShadow: 3, borderRadius: 2 }}>
                <CardContent sx={{ p: 4 }}>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CalendarIcon color="primary" />
                    Thời gian
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          Ngày bắt đầu
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {cohort.start_date ? new Date(cohort.start_date).toLocaleDateString('vi-VN') : 'Chưa xác định'}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          Dự kiến tốt nghiệp
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {cohort.expected_graduation_date ? new Date(cohort.expected_graduation_date).toLocaleDateString('vi-VN') : 'Chưa xác định'}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Students List */}
              {cohort.students.length > 0 && (
                <Card sx={{ boxShadow: 3, borderRadius: 2 }}>
                  <CardContent sx={{ p: 4 }}>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PeopleIcon color="primary" />
                      Danh sách sinh viên ({cohort.students.length})
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <List>
                      {cohort.students.map((student, index) => (
                        <ListItem key={student.id} divider={index < cohort.students.length - 1}>
                          <ListItemIcon>
                            <Avatar sx={{ width: 32, height: 32, fontSize: '0.875rem' }}>
                              {student.student_id?.slice(-2) || '??'}
                            </Avatar>
                          </ListItemIcon>
                          <ListItemText
                            primary={`Sinh viên ${student.student_id}`}
                            secondary={
                              <Stack direction="row" spacing={2} alignItems="center">
                                <Chip 
                                  label={student.status} 
                                  size="small" 
                                  color={student.status === 'ACTIVE' ? 'success' : 'default'}
                                />
                                <Typography variant="caption" color="text.secondary">
                                  GPA: {student.gpa.toFixed(2)}
                                </Typography>
                              </Stack>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              )}
            </Stack>
          </Grid>

          {/* Right Column */}
          <Grid item xs={12} lg={3}>
            <Stack spacing={4}>
              {/* Statistics */}
              <Card sx={{ boxShadow: 3, borderRadius: 2 }}>
                <CardContent sx={{ p: 4 }}>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AssessmentIcon color="primary" />
                    Thống kê
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Stack spacing={2}>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2" color="text.secondary">
                        Tổng sinh viên
                      </Typography>
                      <Badge badgeContent={stats?.total_students || 0} color="primary">
                        <PeopleIcon />
                      </Badge>
                    </Box>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2" color="text.secondary">
                        Đang học
                      </Typography>
                      <Badge badgeContent={stats?.active_students || 0} color="success">
                        <CheckCircleIcon />
                      </Badge>
                    </Box>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2" color="text.secondary">
                        Đã tốt nghiệp
                      </Typography>
                      <Badge badgeContent={stats?.graduated_students || 0} color="info">
                        <SchoolIcon />
                      </Badge>
                    </Box>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2" color="text.secondary">
                        GPA trung bình
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {stats?.average_gpa?.toFixed(2) || '0.00'}
                      </Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2" color="text.secondary">
                        Tỷ lệ tốt nghiệp
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {stats?.completion_rate?.toFixed(1) || '0.0'}%
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>

              {/* Quota */}
              <Card sx={{ boxShadow: 3, borderRadius: 2 }}>
                <CardContent sx={{ p: 4 }}>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <GroupIcon color="primary" />
                    Chỉ tiêu
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Chỉ tiêu dự kiến
                      </Typography>
                      <Typography variant="h4" color="primary" fontWeight="bold">
                        {cohort.planned_quota || 0}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Chỉ tiêu thực tế
                      </Typography>
                      <Typography variant="h4" color="secondary" fontWeight="bold">
                        {cohort.actual_quota || 0}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Tỷ lệ tuyển sinh
                      </Typography>
                      <Typography variant="h6" color="success.main" fontWeight="bold">
                        {cohort.planned_quota && cohort.actual_quota 
                          ? ((cohort.actual_quota / cohort.planned_quota) * 100).toFixed(1)
                          : '0.0'
                        }%
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Stack>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}
