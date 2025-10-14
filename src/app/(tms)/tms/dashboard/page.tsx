'use client';

import { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Stack,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Skeleton,
} from '@mui/material';
import {
  School as SchoolIcon,
  MenuBook as MenuBookIcon,
  Category as CategoryIcon,
  Class as ClassIcon,
  CheckCircle as CheckCircleIcon,
  HourglassEmpty as HourglassEmptyIcon,
  Cancel as CancelIcon,
  Refresh as RefreshIcon,
  ArrowForward as ArrowForwardIcon,
  Assignment as AssignmentIcon,
} from '@mui/icons-material';
import Link from 'next/link';

interface DashboardStats {
  overview: {
    programs: {
      total: number;
      draft: number;
      published: number;
      approved: number;
      reviewing: number;
    };
    courses: {
      total: number;
      draft: number;
      published: number;
      approved: number;
      reviewing: number;
    };
    majors: number;
    classSections: number;
    currentTerm: {
      code: string;
      title: string | null;
      classSections: number;
    } | null;
  };
  workflows: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  };
  recent: {
    programs: Array<{
      id: string;
      code: string | null;
      name_vi: string | null;
      status: string;
      created_at: string | null;
      Major: { name_vi: string } | null;
    }>;
    courses: Array<{
      id: string;
      code: string;
      name_vi: string;
      status: string;
      credits: number;
      created_at: string;
    }>;
  };
}

export default function TmsDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/tms/dashboard/stats');
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch stats');
      }

      setStats(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const getStatusColor = (status: string) => {
    const s = status.toUpperCase();
    if (s === 'DRAFT') return 'default';
    if (s === 'PUBLISHED' || s === 'APPROVED') return 'success';
    if (s === 'REVIEWING') return 'warning';
    return 'default';
  };

  const formatDate = (date: string | null | undefined) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <IconButton onClick={fetchStats} color="primary">
          <RefreshIcon />
        </IconButton>
      </Container>
    );
  }

  return (
    <Box sx={{ backgroundColor: '#f5f7fa', minHeight: '100vh', py: 4 }}>
      <Container maxWidth="xl">
        {/* Header */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            mb: 3,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            borderRadius: 2,
          }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
                Dashboard TMS
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9 }}>
                Hệ thống quản lý đào tạo - Tổng quan thời gian thực
              </Typography>
            </Box>
            <IconButton onClick={fetchStats} sx={{ color: 'white' }}>
              <RefreshIcon />
            </IconButton>
          </Stack>
        </Paper>

        {/* Main Stats */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 3, mb: 3 }}>
          {/* Programs */}
          <Card sx={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
              <CardContent>
                <Stack direction="row" alignItems="flex-start" spacing={2}>
                  <Box
                    sx={{
                      backgroundColor: '#e3f2fd',
                      borderRadius: 2,
                      p: 1.5,
                      display: 'flex',
                    }}
                  >
                    <SchoolIcon sx={{ fontSize: 32, color: '#1976d2' }} />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    {loading ? (
                      <Skeleton variant="text" width={60} height={40} />
                    ) : (
                      <Typography variant="h3" sx={{ fontWeight: 700, color: '#1976d2' }}>
                        {stats?.overview.programs.total || 0}
                      </Typography>
                    )}
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Chương trình đào tạo
                    </Typography>
                    {!loading && stats && (
                      <Stack direction="row" spacing={0.5} flexWrap="wrap">
                        <Chip label={`${stats.overview.programs.published} hoạt động`} size="small" color="success" />
                        <Chip label={`${stats.overview.programs.draft} nháp`} size="small" />
                      </Stack>
                    )}
                  </Box>
                </Stack>
              </CardContent>
            </Card>

          {/* Courses */}
          <Card sx={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
              <CardContent>
                <Stack direction="row" alignItems="flex-start" spacing={2}>
                  <Box
                    sx={{
                      backgroundColor: '#e8f5e9',
                      borderRadius: 2,
                      p: 1.5,
                      display: 'flex',
                    }}
                  >
                    <MenuBookIcon sx={{ fontSize: 32, color: '#2e7d32' }} />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    {loading ? (
                      <Skeleton variant="text" width={60} height={40} />
                    ) : (
                      <Typography variant="h3" sx={{ fontWeight: 700, color: '#2e7d32' }}>
                        {stats?.overview.courses.total || 0}
                      </Typography>
                    )}
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Học phần
                    </Typography>
                    {!loading && stats && (
                      <Stack direction="row" spacing={0.5} flexWrap="wrap">
                        <Chip label={`${stats.overview.courses.published} công khai`} size="small" color="success" />
                        <Chip label={`${stats.overview.courses.draft} nháp`} size="small" />
                      </Stack>
                    )}
                  </Box>
                </Stack>
              </CardContent>
            </Card>

          {/* Majors */}
          <Card sx={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
              <CardContent>
                <Stack direction="row" alignItems="flex-start" spacing={2}>
                  <Box
                    sx={{
                      backgroundColor: '#fff3e0',
                      borderRadius: 2,
                      p: 1.5,
                      display: 'flex',
                    }}
                  >
                    <CategoryIcon sx={{ fontSize: 32, color: '#f57c00' }} />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    {loading ? (
                      <Skeleton variant="text" width={60} height={40} />
                    ) : (
                      <Typography variant="h3" sx={{ fontWeight: 700, color: '#f57c00' }}>
                        {stats?.overview.majors || 0}
                      </Typography>
                    )}
                    <Typography variant="body2" color="text.secondary">
                      Ngành đào tạo
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>

          {/* Class Sections */}
          <Card sx={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
              <CardContent>
                <Stack direction="row" alignItems="flex-start" spacing={2}>
                  <Box
                    sx={{
                      backgroundColor: '#f3e5f5',
                      borderRadius: 2,
                      p: 1.5,
                      display: 'flex',
                    }}
                  >
                    <ClassIcon sx={{ fontSize: 32, color: '#7b1fa2' }} />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    {loading ? (
                      <Skeleton variant="text" width={60} height={40} />
                    ) : (
                      <Typography variant="h3" sx={{ fontWeight: 700, color: '#7b1fa2' }}>
                        {stats?.overview.classSections || 0}
                      </Typography>
                    )}
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Lớp học phần
                    </Typography>
                    {!loading && stats?.overview.currentTerm && (
                      <Chip
                        label={stats.overview.currentTerm.code}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    )}
                  </Box>
                </Stack>
              </CardContent>
            </Card>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3, mb: 3 }}>
          {/* Workflow Status */}
          <Card sx={{ height: '100%', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
              <CardContent>
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Trạng thái phê duyệt
                  </Typography>
                  <AssignmentIcon color="action" />
                </Stack>
                <Divider sx={{ mb: 2 }} />
                {loading ? (
                  <>
                    <Skeleton height={60} sx={{ mb: 2 }} />
                    <Skeleton height={60} sx={{ mb: 2 }} />
                    <Skeleton height={60} />
                  </>
                ) : (
                  <Stack spacing={2}>
                    <Box>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <HourglassEmptyIcon sx={{ fontSize: 20, color: '#ed6c02' }} />
                          <Typography variant="body2">Đang chờ</Typography>
                        </Stack>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                          {stats?.workflows.pending || 0}
                        </Typography>
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={
                          stats?.workflows.total
                            ? (stats.workflows.pending / stats.workflows.total) * 100
                            : 0
                        }
                        color="warning"
                      />
                    </Box>
                    <Box>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <CheckCircleIcon sx={{ fontSize: 20, color: '#2e7d32' }} />
                          <Typography variant="body2">Đã phê duyệt</Typography>
                        </Stack>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                          {stats?.workflows.approved || 0}
                        </Typography>
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={
                          stats?.workflows.total
                            ? (stats.workflows.approved / stats.workflows.total) * 100
                            : 0
                        }
                        color="success"
                      />
                    </Box>
                    <Box>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <CancelIcon sx={{ fontSize: 20, color: '#d32f2f' }} />
                          <Typography variant="body2">Từ chối</Typography>
                        </Stack>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                          {stats?.workflows.rejected || 0}
                        </Typography>
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={
                          stats?.workflows.total
                            ? (stats.workflows.rejected / stats.workflows.total) * 100
                            : 0
                        }
                        color="error"
                      />
                    </Box>
                  </Stack>
                )}
              </CardContent>
            </Card>

          {/* Recent Programs */}
          <Card sx={{ height: '100%', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
              <CardContent>
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Chương trình mới nhất
                  </Typography>
                  <Link href="/tms/programs" passHref style={{ textDecoration: 'none' }}>
                    <IconButton size="small">
                      <ArrowForwardIcon />
                    </IconButton>
                  </Link>
                </Stack>
                <Divider sx={{ mb: 2 }} />
                {loading ? (
                  <Stack spacing={1}>
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} height={60} />
                    ))}
                  </Stack>
                ) : (
                  <List dense>
                    {stats?.recent.programs.slice(0, 5).map((program) => (
                      <ListItem
                        key={program.id}
                        sx={{
                          border: '1px solid',
                          borderColor: 'divider',
                          borderRadius: 1,
                          mb: 1,
                          '&:hover': { backgroundColor: 'action.hover' },
                        }}
                      >
                        <ListItemText
                          primary={
                            <Stack direction="row" alignItems="center" spacing={1}>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {program.code || 'N/A'}
                              </Typography>
                              <Chip
                                label={program.status}
                                size="small"
                                color={getStatusColor(program.status)}
                              />
                            </Stack>
                          }
                          secondary={
                            <Stack>
                              <Typography variant="caption" color="text.secondary">
                                {program.name_vi || 'Chưa có tên'}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {formatDate(program.created_at)}
                              </Typography>
                            </Stack>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                )}
              </CardContent>
            </Card>
        </Box>

        {/* Recent Courses */}
        <Card sx={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
              <CardContent>
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Học phần mới nhất
                  </Typography>
                  <Link href="/tms/courses" passHref style={{ textDecoration: 'none' }}>
                    <IconButton size="small">
                      <ArrowForwardIcon />
                    </IconButton>
                  </Link>
                </Stack>
                <Divider sx={{ mb: 2 }} />
                {loading ? (
                  <Stack spacing={1}>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Skeleton key={i} height={60} />
                    ))}
                  </Stack>
                ) : (
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 2 }}>
                    {stats?.recent.courses.map((course) => (
                      <Paper
                        key={course.id}
                          sx={{
                            p: 2,
                            border: '1px solid',
                            borderColor: 'divider',
                            '&:hover': { borderColor: 'primary.main', boxShadow: 2 },
                            transition: 'all 0.2s',
                          }}
                        >
                          <Stack spacing={1}>
                            <Stack direction="row" alignItems="center" justifyContent="space-between">
                              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                {course.code}
                              </Typography>
                              <Chip
                                label={`${course.credits} TC`}
                                size="small"
                                variant="outlined"
                              />
                            </Stack>
                            <Typography variant="body2" color="text.secondary" noWrap>
                              {course.name_vi}
                            </Typography>
                            <Stack direction="row" alignItems="center" justifyContent="space-between">
                              <Chip
                                label={course.status}
                                size="small"
                                color={getStatusColor(course.status)}
                              />
                              <Typography variant="caption" color="text.secondary">
                                {formatDate(course.created_at)}
                              </Typography>
                            </Stack>
                          </Stack>
                        </Paper>
                    ))}
                  </Box>
                )}
              </CardContent>
            </Card>
      </Container>
    </Box>
  );
}
