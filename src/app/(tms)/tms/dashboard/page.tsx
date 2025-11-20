'use client';

import { useEffect, useState } from 'react';
import { API_ROUTES } from '@/constants/routes';
import {
  Box,
  Typography,
  Paper,
  Stack,
  Card,
  CardContent,
  Alert,
  IconButton,
  Skeleton,
  Button,
} from '@mui/material';
import {
  School as SchoolIcon,
  MenuBook as MenuBookIcon,
  Category as CategoryIcon,
  Class as ClassIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
} from '@mui/icons-material';

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
    cohorts: number;
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
      const response = await fetch(API_ROUTES.TMS.DASHBOARD_STATS);
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
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 3, mb: 3 }}>
          {/* Programs */}
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <SchoolIcon color="primary" sx={{ fontSize: 40 }} />
                <Box>
                  {loading ? (
                    <Skeleton variant="text" width={60} height={40} />
                  ) : (
                    <Typography variant="h4" component="div">
                      {stats?.overview.programs.total || 0}
                    </Typography>
                  )}
                  <Typography color="text.secondary">
                    Chương trình đào tạo
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Courses */}
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <MenuBookIcon color="success" sx={{ fontSize: 40 }} />
                <Box>
                  {loading ? (
                    <Skeleton variant="text" width={60} height={40} />
                  ) : (
                    <Typography variant="h4" component="div">
                      {stats?.overview.courses.total || 0}
                    </Typography>
                  )}
                  <Typography color="text.secondary">
                    Học phần
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Majors */}
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <CategoryIcon color="warning" sx={{ fontSize: 40 }} />
                <Box>
                  {loading ? (
                    <Skeleton variant="text" width={60} height={40} />
                  ) : (
                    <Typography variant="h4" component="div">
                      {stats?.overview.majors || 0}
                    </Typography>
                  )}
                  <Typography color="text.secondary">
                    Ngành đào tạo
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Cohorts */}
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <ClassIcon color="secondary" sx={{ fontSize: 40 }} />
                <Box>
                  {loading ? (
                    <Skeleton variant="text" width={60} height={40} />
                  ) : (
                    <Typography variant="h4" component="div">
                      {stats?.overview.cohorts || 0}
                    </Typography>
                  )}
                  <Typography color="text.secondary">
                    Khóa
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>

      </Box>
    </Box>
  );
}
