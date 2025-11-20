'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Alert,
  CircularProgress,
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
  TrendingUp as TrendingUpIcon,
  Description as DescriptionIcon,
} from '@mui/icons-material';
import { 
  getCohortStatusLabel,
  getCohortStatusColor,
} from '@/constants/cohorts';
import { API_ROUTES } from '@/constants/routes';

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
  students: Array<{
    id: string;
    student_id: string;
    status: string;
    gpa: number;
  }>;
  Major?: {
    id: string;
    code: string;
    name_vi: string;
  };
  Program?: {
    id: string;
    code: string;
    name_vi: string;
  };
  OrgUnit?: {
    id: string;
    code: string;
    name: string;
  };
}

interface CohortStats {
  total_students: number;
  active_students: number;
  graduated_students: number;
  average_gpa: number;
  completion_rate: number;
}

export default function CohortDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const cohortId = params?.id as string;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cohort, setCohort] = useState<Cohort | null>(null);
  const [stats, setStats] = useState<CohortStats | null>(null);

  useEffect(() => {
    const fetchCohort = async () => {
      if (!cohortId) return;

      try {
        setLoading(true);
        const response = await fetch(API_ROUTES.TMS.COHORTS_BY_ID(cohortId));
        
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

    fetchCohort();
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
        <Container maxWidth="lg">
          <Alert severity="error" sx={{ mb: 3 }}>
            {error || 'Không tìm thấy thông tin khóa học'}
          </Alert>
          <Button startIcon={<ArrowBackIcon />} onClick={() => router.back()}>
            Quay lại
          </Button>
        </Container>
      </Box>
    );
  }

  const enrollmentRate = cohort.planned_quota && cohort.actual_quota 
    ? ((cohort.actual_quota / cohort.planned_quota) * 100).toFixed(1)
    : '0.0';

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      <Container maxWidth={false} sx={{ py: 4, px: 3, width: '100%' }}>
        {/* Breadcrumbs */}
        <Breadcrumbs sx={{ mb: 3 }}>
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

        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Button 
                startIcon={<ArrowBackIcon />} 
                onClick={() => router.back()}
                variant="outlined"
              >
                Quay lại
              </Button>
              <Box>
                <Typography variant="h4" component="h1" fontWeight="bold">
                  {cohort.name_vi}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {cohort.code} • {cohort.academic_year}
                </Typography>
              </Box>
            </Stack>
            <Stack direction="row" spacing={2} alignItems="center">
              <Chip 
                label={getCohortStatusLabel(cohort.status)}
                color={getCohortStatusColor(cohort.status) as any}
                variant="filled"
                sx={{ fontWeight: 'medium' }}
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
        <Stack direction={{ xs: 'column', lg: 'row' }} spacing={3}>
          {/* Left Column - Main Information */}
          <Box sx={{ flex: { xs: '1', lg: '2' } }}>
            <Stack spacing={3}>
              {/* Basic Information */}
              <Card elevation={2}>
                <CardContent sx={{ p: 3 }}>
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                    <SchoolIcon color="primary" />
                    <Typography variant="h6" fontWeight="medium">
                      Thông tin cơ bản
                    </Typography>
                  </Stack>
                  <Divider sx={{ mb: 3 }} />
                  <Stack spacing={3}>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                          Mã khóa học
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {cohort.code}
                        </Typography>
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                          Năm học
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {cohort.academic_year}
                        </Typography>
                      </Box>
                    </Stack>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                          Năm tuyển sinh
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {cohort.intake_year}
                        </Typography>
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                          Học kỳ tuyển sinh
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {cohort.intake_term}
                        </Typography>
                      </Box>
                    </Stack>
                    {(cohort.Major || cohort.Program || cohort.OrgUnit) && (
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3}>
                        {cohort.Major && (
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                              Ngành đào tạo
                            </Typography>
                            <Typography variant="body1" fontWeight="medium">
                              {cohort.Major.name_vi} ({cohort.Major.code})
                            </Typography>
                          </Box>
                        )}
                        {cohort.Program && (
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                              Chương trình đào tạo
                            </Typography>
                            <Typography variant="body1" fontWeight="medium">
                              {cohort.Program.name_vi} ({cohort.Program.code})
                            </Typography>
                          </Box>
                        )}
                        {cohort.OrgUnit && (
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                              Đơn vị quản lý
                            </Typography>
                            <Typography variant="body1" fontWeight="medium">
                              {cohort.OrgUnit.name} ({cohort.OrgUnit.code})
                            </Typography>
                          </Box>
                        )}
                      </Stack>
                    )}
                    {cohort.description && (
                      <Box>
                        <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                          Mô tả
                        </Typography>
                        <Typography variant="body1">
                          {cohort.description}
                        </Typography>
                      </Box>
                    )}
                  </Stack>
                </CardContent>
              </Card>

              {/* Timeline */}
              <Card elevation={2}>
                <CardContent sx={{ p: 3 }}>
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                    <CalendarIcon color="primary" />
                    <Typography variant="h6" fontWeight="medium">
                      Thời gian
                    </Typography>
                  </Stack>
                  <Divider sx={{ mb: 3 }} />
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                        Ngày bắt đầu
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {cohort.start_date 
                          ? new Date(cohort.start_date).toLocaleDateString('vi-VN', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })
                          : 'Chưa xác định'}
                      </Typography>
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                        Dự kiến tốt nghiệp
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {cohort.expected_graduation_date 
                          ? new Date(cohort.expected_graduation_date).toLocaleDateString('vi-VN', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })
                          : 'Chưa xác định'}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>

              {/* Students List */}
              {cohort.students && cohort.students.length > 0 && (
                <Card elevation={2}>
                  <CardContent sx={{ p: 3 }}>
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                      <PeopleIcon color="primary" />
                      <Typography variant="h6" fontWeight="medium">
                        Danh sách sinh viên
                      </Typography>
                      <Chip 
                        label={cohort.students.length} 
                        size="small" 
                        color="primary"
                      />
                    </Stack>
                    <Divider sx={{ mb: 2 }} />
                    <List>
                      {cohort.students.map((student, index) => (
                        <ListItem 
                          key={student.id} 
                          divider={index < cohort.students.length - 1}
                          sx={{ py: 1.5 }}
                        >
                          <ListItemIcon>
                            <Avatar sx={{ width: 40, height: 40, bgcolor: 'primary.main' }}>
                              {student.student_id?.slice(-2) || '??'}
                            </Avatar>
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Typography variant="body1" fontWeight="medium">
                                Sinh viên {student.student_id}
                              </Typography>
                            }
                            secondary={
                              <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 0.5 }}>
                                <Chip 
                                  label={student.status} 
                                  size="small" 
                                  color={student.status === 'ACTIVE' ? 'success' : 'default'}
                                  variant="outlined"
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
          </Box>

          {/* Right Column - Statistics & Quota */}
          <Box sx={{ flex: { xs: '1', lg: '1' } }}>
            <Stack spacing={3}>
              {/* Statistics */}
              <Card elevation={2}>
                <CardContent sx={{ p: 3 }}>
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                    <AssessmentIcon color="primary" />
                    <Typography variant="h6" fontWeight="medium">
                      Thống kê
                    </Typography>
                  </Stack>
                  <Divider sx={{ mb: 2 }} />
                  <Stack spacing={2.5}>
                    <Box>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                        <Typography variant="body2" color="text.secondary">
                          Tổng sinh viên
                        </Typography>
                        <Typography variant="h6" fontWeight="bold" color="primary">
                          {stats?.total_students || 0}
                        </Typography>
                      </Stack>
                    </Box>
                    <Divider />
                    <Box>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                        <Typography variant="body2" color="text.secondary">
                          Đang học
                        </Typography>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <CheckCircleIcon color="success" fontSize="small" />
                          <Typography variant="h6" fontWeight="bold" color="success.main">
                            {stats?.active_students || 0}
                          </Typography>
                        </Stack>
                      </Stack>
                    </Box>
                    <Box>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                        <Typography variant="body2" color="text.secondary">
                          Đã tốt nghiệp
                        </Typography>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <SchoolIcon color="info" fontSize="small" />
                          <Typography variant="h6" fontWeight="bold" color="info.main">
                            {stats?.graduated_students || 0}
                          </Typography>
                        </Stack>
                      </Stack>
                    </Box>
                    <Divider />
                    <Box>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                        <Typography variant="body2" color="text.secondary">
                          GPA trung bình
                        </Typography>
                        <Typography variant="h6" fontWeight="bold">
                          {stats?.average_gpa?.toFixed(2) || '0.00'}
                        </Typography>
                      </Stack>
                    </Box>
                    <Box>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                        <Typography variant="body2" color="text.secondary">
                          Tỷ lệ tốt nghiệp
                        </Typography>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <TrendingUpIcon color="success" fontSize="small" />
                          <Typography variant="h6" fontWeight="bold" color="success.main">
                            {stats?.completion_rate?.toFixed(1) || '0.0'}%
                          </Typography>
                        </Stack>
                      </Stack>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>

              {/* Quota */}
              <Card elevation={2}>
                <CardContent sx={{ p: 3 }}>
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                    <GroupIcon color="primary" />
                    <Typography variant="h6" fontWeight="medium">
                      Chỉ tiêu
                    </Typography>
                  </Stack>
                  <Divider sx={{ mb: 2 }} />
                  <Stack spacing={2.5}>
                    <Box>
                      <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                        Chỉ tiêu dự kiến
                      </Typography>
                      <Typography variant="h4" color="primary" fontWeight="bold">
                        {cohort.planned_quota || 0}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                        Chỉ tiêu thực tế
                      </Typography>
                      <Typography variant="h4" color="secondary" fontWeight="bold">
                        {cohort.actual_quota || 0}
                      </Typography>
                    </Box>
                    <Divider />
                    <Box>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                        <Typography variant="body2" color="text.secondary">
                          Tỷ lệ tuyển sinh
                        </Typography>
                        <Typography variant="h6" fontWeight="bold" color="success.main">
                          {enrollmentRate}%
                        </Typography>
                      </Stack>
                      <Box 
                        sx={{ 
                          width: '100%', 
                          height: 8, 
                          bgcolor: 'grey.200', 
                          borderRadius: 1,
                          mt: 1,
                          overflow: 'hidden'
                        }}
                      >
                        <Box
                          sx={{
                            width: `${enrollmentRate}%`,
                            height: '100%',
                            bgcolor: 'success.main',
                            transition: 'width 0.3s ease'
                          }}
                        />
                      </Box>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Stack>
          </Box>
        </Stack>
      </Container>
    </Box>
  );
}