'use client';

import { useEffect, useState } from 'react';
import {
  Box,
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
  Avatar,
  Button,
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
  Schedule as ScheduleIcon,
  Visibility as VisibilityIcon,
  Add as AddIcon,
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
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <IconButton onClick={fetchStats} color="primary">
          <RefreshIcon />
        </IconButton>
      </Box>
    );
  }

  return (
    <Box sx={{ backgroundColor: 'background.default', minHeight: '100vh' }}>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Paper elevation={0} sx={{ p: 3, mb: 3 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 600, mb: 0.5 }}>
                Trang chủ hệ thống quản lý đào tạo
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Hệ thống quản lý đào tạo - Tổng quan
              </Typography>
            </Box>
            <Stack direction="row" spacing={1} alignItems="center">
              <IconButton onClick={fetchStats} color="primary">
                <RefreshIcon />
              </IconButton>
              <Button variant="contained" startIcon={<AddIcon />} sx={{ textTransform: 'none' }}>
                Tạo mới
              </Button>
            </Stack>
          </Stack>
        </Paper>

        {/* Main Stats */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 2, mb: 3 }}>
          {/* Programs */}
          <Box>
            <Card>
              <CardContent>
                  <Stack direction="row" alignItems="flex-start" spacing={3}>
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      <SchoolIcon />
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      {loading ? (
                      <Skeleton variant="text" width={60} height={32} />
                      ) : (
                      <Typography variant="h4" sx={{ fontWeight: 700 }}>
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
          </Box>

          {/* Courses */}
          <Box>
            <Card>
              <CardContent>
                  <Stack direction="row" alignItems="flex-start" spacing={3}>
                    <Avatar sx={{ bgcolor: 'success.main' }}>
                      <MenuBookIcon />
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      {loading ? (
                      <Skeleton variant="text" width={60} height={32} />
                      ) : (
                      <Typography variant="h4" sx={{ fontWeight: 700 }}>
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
          </Box>

          {/* Majors */}
          <Box>
            <Card>
              <CardContent>
                  <Stack direction="row" alignItems="flex-start" spacing={3}>
                    <Avatar sx={{ bgcolor: 'warning.main' }}>
                      <CategoryIcon />
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      {loading ? (
                      <Skeleton variant="text" width={60} height={32} />
                      ) : (
                      <Typography variant="h4" sx={{ fontWeight: 700 }}>
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
          </Box>

          {/* Class Sections */}
          <Box>
            <Card>
              <CardContent>
                  <Stack direction="row" alignItems="flex-start" spacing={3}>
                    <Avatar sx={{ bgcolor: 'secondary.main' }}>
                      <ClassIcon />
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      {loading ? (
                      <Skeleton variant="text" width={60} height={32} />
                      ) : (
                      <Typography variant="h4" sx={{ fontWeight: 700 }}>
                          {stats?.overview.classSections || 0}
                        </Typography>
                      )}
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Lớp học phần
                      </Typography>
                      {!loading && stats?.overview.currentTerm && (
                      <Chip label={stats.overview.currentTerm.code} size="small" color="primary" variant="outlined" />
                      )}
                    </Box>
                  </Stack>
              </CardContent>
            </Card>
          </Box>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2, mb: 3 }}>
          {/* Workflow Status */}
          <Box>
            <Card>
              <CardContent>
                  <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
                    <Typography variant="h5" sx={{ 
                      fontWeight: 700,
                      color: '#2c3e50',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}>
                      <AssignmentIcon sx={{ color: '#667eea' }} />
                      Trạng thái phê duyệt
                    </Typography>
                    <Avatar sx={{ bgcolor: 'action.hover' }}>
                      <AssignmentIcon color="action" />
                    </Avatar>
                  </Stack>
                  <Divider sx={{ mb: 3, borderColor: 'rgba(0,0,0,0.1)' }} />
                  {loading ? (
                    <Stack spacing={3}>
                      {[1, 2, 3].map((i) => (
                        <Box key={i}>
                          <Skeleton height={20} sx={{ mb: 1 }} />
                          <Skeleton height={8} />
                        </Box>
                      ))}
                    </Stack>
                  ) : (
                    <Stack spacing={3}>
                      <Box>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                          <Stack direction="row" spacing={2} alignItems="center">
                            <Avatar sx={{ 
                              width: 40, 
                              height: 40, 
                              bgcolor: 'rgba(237, 108, 2, 0.1)' 
                            }}>
                              <HourglassEmptyIcon sx={{ color: '#ed6c02' }} />
                            </Avatar>
                            <Typography variant="h6" sx={{ fontWeight: 600, color: '#2c3e50' }}>
                              Đang chờ
                            </Typography>
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
                          sx={{ 
                            height: 8, 
                            borderRadius: 4,
                            backgroundColor: 'rgba(237, 108, 2, 0.1)',
                            '& .MuiLinearProgress-bar': {
                              borderRadius: 4,
                            }
                          }}
                        />
                      </Box>
                      <Box>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                          <Stack direction="row" spacing={2} alignItems="center">
                            <Avatar sx={{ 
                              width: 40, 
                              height: 40, 
                              bgcolor: 'rgba(46, 125, 50, 0.1)' 
                            }}>
                              <CheckCircleIcon sx={{ color: '#2e7d32' }} />
                            </Avatar>
                            <Typography variant="h6" sx={{ fontWeight: 600, color: '#2c3e50' }}>
                              Đã phê duyệt
                            </Typography>
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
                          sx={{ 
                            height: 8, 
                            borderRadius: 4,
                            backgroundColor: 'rgba(46, 125, 50, 0.1)',
                            '& .MuiLinearProgress-bar': {
                              borderRadius: 4,
                            }
                          }}
                        />
                      </Box>
                      <Box>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                          <Stack direction="row" spacing={2} alignItems="center">
                            <Avatar sx={{ 
                              width: 40, 
                              height: 40, 
                              bgcolor: 'rgba(211, 47, 47, 0.1)' 
                            }}>
                              <CancelIcon sx={{ color: '#d32f2f' }} />
                            </Avatar>
                            <Typography variant="h6" sx={{ fontWeight: 600, color: '#2c3e50' }}>
                              Từ chối
                            </Typography>
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
                          sx={{ 
                            height: 8, 
                            borderRadius: 4,
                            backgroundColor: 'rgba(211, 47, 47, 0.1)',
                            '& .MuiLinearProgress-bar': {
                              borderRadius: 4,
                            }
                          }}
                        />
                      </Box>
                    </Stack>
                  )}
              </CardContent>
            </Card>
          </Box>

          {/* Recent Programs */}
          <Box>
            <Card>
              <CardContent>
                  <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
                    <Typography variant="h5" sx={{ 
                      fontWeight: 700,
                      color: '#2c3e50',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}>
                      <SchoolIcon sx={{ color: '#667eea' }} />
                      Chương trình mới nhất
                    </Typography>
                    <Link href="/tms/programs" passHref style={{ textDecoration: 'none' }}>
                      <IconButton size="small">
                        <ArrowForwardIcon />
                      </IconButton>
                    </Link>
                  </Stack>
                  <Divider sx={{ mb: 3, borderColor: 'rgba(0,0,0,0.1)' }} />
                  {loading ? (
                    <Stack spacing={2}>
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Skeleton key={i} height={80} sx={{ borderRadius: 2 }} />
                      ))}
                    </Stack>
                  ) : (
                    <Stack spacing={2}>
                      {stats?.recent.programs.slice(0, 5).map((program, index) => (
                        <Paper
                          key={program.id}
                          elevation={0}
                          sx={{
                            p: 2,
                            border: '1px solid rgba(0,0,0,0.08)',
                            borderRadius: 2,
                            background: 'rgba(255, 255, 255, 0.5)',
                            transition: 'all 0.3s ease',
                            '&:hover': { 
                              borderColor: '#667eea',
                              boxShadow: '0 4px 20px rgba(102, 126, 234, 0.15)',
                              transform: 'translateX(4px)',
                            },
                          }}
                        >
                          <Stack direction="row" alignItems="center" spacing={2}>
                            <Avatar sx={{ 
                              bgcolor: 'rgba(102, 126, 234, 0.1)',
                              color: '#667eea',
                              fontWeight: 700,
                              width: 40,
                              height: 40
                            }}>
                              {index + 1}
                            </Avatar>
                            <Box sx={{ flex: 1 }}>
                              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                                <Typography variant="subtitle1" sx={{ 
                                  fontWeight: 700,
                                  color: '#2c3e50'
                                }}>
                                  {program.code || 'N/A'}
                                </Typography>
                                <Chip
                                  label={program.status}
                                  size="small"
                                  color={getStatusColor(program.status)}
                                  sx={{ 
                                    fontWeight: 600,
                                    '& .MuiChip-label': { px: 1.5 }
                                  }}
                                />
                              </Stack>
                              <Typography variant="body2" sx={{ 
                                color: '#5a6c7d',
                                mb: 0.5,
                                fontWeight: 500
                              }}>
                                {program.name_vi || 'Chưa có tên'}
                              </Typography>
                              <Typography variant="caption" sx={{ 
                                color: '#8e9aaf',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.5
                              }}>
                                <ScheduleIcon sx={{ fontSize: 14 }} />
                                {formatDate(program.created_at)}
                              </Typography>
                            </Box>
                            <IconButton size="small" sx={{ color: '#667eea' }}>
                              <VisibilityIcon />
                            </IconButton>
                          </Stack>
                        </Paper>
                      ))}
                    </Stack>
                  )}
              </CardContent>
            </Card>
          </Box>
        </Box>

        {/* Recent Courses */}
        <Card>
          <CardContent>
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
                <Typography variant="h5" sx={{ 
                  fontWeight: 700,
                  color: '#2c3e50',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}>
                  <MenuBookIcon sx={{ color: '#667eea' }} />
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
                <Stack spacing={1.5}>
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Skeleton key={i} height={56} />
                  ))}
                </Stack>
              ) : (
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 2 }}>
                  {stats?.recent.courses.map((course) => (
                    <Paper key={course.id} sx={{ p: 2, border: '1px solid', borderColor: 'divider' }}>
                      <Stack spacing={1}>
                        <Stack direction="row" alignItems="center" justifyContent="space-between">
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            {course.code}
                          </Typography>
                          <Chip label={`${course.credits} TC`} size="small" variant="outlined" />
                        </Stack>
                        <Typography variant="body2" color="text.secondary" noWrap>
                          {course.name_vi}
                        </Typography>
                        <Stack direction="row" alignItems="center" justifyContent="space-between">
                          <Chip label={course.status} size="small" color={getStatusColor(course.status)} />
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
      </Box>
    </Box>
  );
}
