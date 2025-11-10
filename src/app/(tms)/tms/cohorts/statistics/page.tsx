'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  Breadcrumbs,
  Link,
  Container,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  School as SchoolIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';
import { 
  getCohortStatusLabel, 
  getCohortStatusColor 
} from '@/constants/cohorts';

interface CohortStats {
  total_cohorts: number;
  active_cohorts: number;
  graduated_cohorts: number;
  total_students: number;
  average_students_per_cohort: number;
  completion_rate: number;
}

interface CohortSummary {
  id: string;
  code: string;
  name_vi: string;
  academic_year: string;
  intake_year: number;
  status: string;
  planned_quota: number;
  actual_quota: number;
  student_count: number;
  completion_rate: number;
}

export default function CohortStatisticsPage() {
  const router = useRouter();
  const [stats, setStats] = useState<CohortStats | null>(null);
  const [cohorts, setCohorts] = useState<CohortSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/cohorts/statistics');
        
        if (!response.ok) {
          throw new Error('Không thể tải thống kê khóa học');
        }

        const data = await response.json();
        setStats(data.stats);
        setCohorts(data.cohorts || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Có lỗi xảy ra');
      } finally {
        setLoading(false);
      }
    };

    fetchStatistics();
  }, []);

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
        <Link
          color="inherit"
          href="/tms/cohorts"
          sx={{ textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
        >
          Khóa học
        </Link>
        <Typography color="text.primary">Thống kê</Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => router.back()}
        >
          Quay lại
        </Button>
        <Typography variant="h4" component="h1">
          Thống kê khóa học
        </Typography>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Overall Statistics */}
      {stats && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
                  <SchoolIcon color="primary" sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography variant="h4" fontWeight="bold">
                      {stats.total_cohorts}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Tổng số khóa học
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
                  <TrendingUpIcon color="success" sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography variant="h4" fontWeight="bold">
                      {stats.active_cohorts}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Khóa đang hoạt động
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
                  <PeopleIcon color="info" sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography variant="h4" fontWeight="bold">
                      {stats.total_students}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Tổng số sinh viên
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
                  <AssessmentIcon color="warning" sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography variant="h4" fontWeight="bold">
                      {stats.completion_rate.toFixed(1)}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Tỷ lệ hoàn thành
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Detailed Statistics */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Thống kê chi tiết
              </Typography>
              {stats && (
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">
                        Khóa đã tốt nghiệp:
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {stats.graduated_cohorts}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12}>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">
                        Số sinh viên trung bình/khóa:
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {stats.average_students_per_cohort.toFixed(1)}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Tỷ lệ hoàn thành theo khóa
              </Typography>
              {stats && (
                <Box>
                  <Typography variant="h3" color="primary" fontWeight="bold">
                    {stats.completion_rate.toFixed(1)}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Tỷ lệ sinh viên hoàn thành chương trình
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Cohorts Summary Table */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Tóm tắt các khóa học
          </Typography>
          
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Mã khóa</TableCell>
                  <TableCell>Tên khóa học</TableCell>
                  <TableCell>Năm học</TableCell>
                  <TableCell>Trạng thái</TableCell>
                  <TableCell align="right">Chỉ tiêu</TableCell>
                  <TableCell align="right">Sinh viên</TableCell>
                  <TableCell align="right">Tỷ lệ hoàn thành</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {cohorts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography variant="body2" color="text.secondary">
                        Không có dữ liệu
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  cohorts.map((cohort) => (
                    <TableRow key={cohort.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {cohort.code}
                        </Typography>
                      </TableCell>
                      <TableCell>{cohort.name_vi}</TableCell>
                      <TableCell>{cohort.academic_year}</TableCell>
                      <TableCell>
                        <Chip
                          label={getCohortStatusLabel(cohort.status)}
                          color={getCohortStatusColor(cohort.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        {cohort.actual_quota}/{cohort.planned_quota}
                      </TableCell>
                      <TableCell align="right">
                        {cohort.student_count}
                      </TableCell>
                      <TableCell align="right">
                        <Typography 
                          variant="body2" 
                          color={cohort.completion_rate >= 80 ? 'success.main' : 'warning.main'}
                          fontWeight="medium"
                        >
                          {cohort.completion_rate.toFixed(1)}%
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Container>
  );
}
