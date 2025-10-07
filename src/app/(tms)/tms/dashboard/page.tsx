'use client';

import {
  Box,
  Container,
  Typography,
  Paper,
  Stack,
  Card,
  CardContent,
  CardActions,
  Button,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  School as SchoolIcon,
  BookOnline as BookOnlineIcon,
  Schedule as ScheduleIcon,
  TrendingUp as TrendingUpIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';

export default function TmsDashboard() {
  const statsCards = [
    {
      title: 'Tổng số chương trình đào tạo',
      value: '12',
      icon: <SchoolIcon sx={{ fontSize: 40 }} />,
      color: '#1976d2',
      description: 'Các chương trình đang hoạt động',
    },
    {
      title: 'Tổng số học phần',
      value: '245',
      icon: <BookOnlineIcon sx={{ fontSize: 40 }} />,
      color: '#2e7d32',
      description: 'Học phần được quản lý',
    },
    {
      title: 'Ngành đào tạo',
      value: '8',
      icon: <DashboardIcon sx={{ fontSize: 40 }} />,
      color: '#ed6c02',
      description: 'Các ngành đang đào tạo',
    },
    {
      title: 'Lớp học đang hoạt động',
      value: '156',
      icon: <ScheduleIcon sx={{ fontSize: 40 }} />,
      color: '#9c27b0',
      description: 'Lớp học trong học kỳ hiện tại',
    },
  ];

  const quickActions = [
    {
      title: 'Tạo chương trình đào tạo mới',
      description: 'Thêm chương trình đào tạo mới vào hệ thống',
      icon: <SchoolIcon />,
      color: '#1976d2',
      path: '/tms/programs/create',
    },
    {
      title: 'Quản lý học phần',
      description: 'Xem và quản lý tất cả học phần',
      icon: <BookOnlineIcon />,
      color: '#2e7d32',
      path: '/tms/courses',
    },
    {
      title: 'Lập kế hoạch đào tạo',
      description: 'Tạo kế hoạch đào tạo cho học kỳ mới',
      icon: <ScheduleIcon />,
      color: '#ed6c02',
      path: '/tms/curriculum/planning',
    },
    {
      title: 'Báo cáo đào tạo',
      description: 'Xem các báo cáo và thống kê đào tạo',
      icon: <AssessmentIcon />,
      color: '#9c27b0',
      path: '/tms/reports',
    },
  ];

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default', py: 4 }}>
      <Container maxWidth="lg">
        <Paper elevation={0} sx={{ p: 4, background: 'linear-gradient(135deg, #2e7d32 0%, #4caf50 100%)', color: 'white', borderRadius: 2, mb: 4 }}>
          <Stack spacing={2} alignItems="center" textAlign="center">
            <DashboardIcon sx={{ fontSize: 64 }} />
            <Typography variant="h3" component="h1" sx={{ fontWeight: 'bold' }}>
              Dashboard TMS
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9 }}>
              Tổng quan hệ thống quản lý đào tạo
            </Typography>
          </Stack>
        </Paper>

        {/* Stats Cards */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 3, mb: 4 }}>
          {statsCards.map((stat, index) => (
            <Card key={index} sx={{ height: '100%', border: `2px solid ${stat.color}20` }}>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Box sx={{ color: stat.color }}>
                    {stat.icon}
                  </Box>
                  <Box>
                    <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', color: stat.color }}>
                      {stat.value}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {stat.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {stat.description}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Box>

        {/* Quick Actions */}
        <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>
          Thao tác nhanh
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 3 }}>
          {quickActions.map((action, index) => (
            <Card key={index} sx={{ height: '100%', '&:hover': { transform: 'translateY(-4px)', transition: 'transform 0.2s ease-in-out' } }}>
              <CardContent>
                <Stack spacing={2}>
                  <Box sx={{ color: action.color }}>
                    {action.icon}
                  </Box>
                  <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
                    {action.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {action.description}
                  </Typography>
                </Stack>
              </CardContent>
              <CardActions>
                <Button 
                  size="small" 
                  sx={{ color: action.color, fontWeight: 'bold' }}
                  href={action.path}
                >
                  Truy cập
                </Button>
              </CardActions>
            </Card>
          ))}
        </Box>
      </Container>
    </Box>
  );
}
