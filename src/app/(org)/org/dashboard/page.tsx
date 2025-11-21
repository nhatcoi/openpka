'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_ROUTES, ORG_ROUTES } from '@/constants/routes';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import {
  AccountTree as AccountTreeIcon,
  Apartment as ApartmentIcon,
  Assessment as AssessmentIcon,
  People as PeopleIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  Timeline as TimelineIcon,
} from '@mui/icons-material';

interface RecentActivity {
  id: string;
  description: string;
  timestamp: string;
  unitName?: string;
}

interface TopUnit {
  id: string | number;
  name: string;
  code: string;
  employeeCount: number;
}

interface OrgStats {
  totalUnits: number;
  totalEmployees: number;
  activeUnits: number;
  inactiveUnits: number;
  topUnits?: Array<{
    id: number;
    name: string;
    code: string;
    _count?: { OrgAssignment: number };
  }>;
}

const MOCK_ACTIVITIES: RecentActivity[] = [
  {
    id: '1',
    description: 'Tạo mới đơn vị Phòng Marketing',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    unitName: 'Phòng Marketing',
  },
  {
    id: '2',
    description: 'Cập nhật thông tin Phòng IT',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    unitName: 'Phòng IT',
  },
  {
    id: '3',
    description: 'Thêm nhân sự mới vào Phòng Nhân sự',
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    unitName: 'Phòng Nhân sự',
  },
];

const formatDateTime = (timestamp: string): string => new Date(timestamp).toLocaleString('vi-VN');

export default function OrgDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<OrgStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);

  const topUnits: TopUnit[] =
    stats?.topUnits?.map((unit) => ({
      id: unit.id,
      name: unit.name,
      code: unit.code,
      employeeCount: unit._count?.OrgAssignment || 0,
    })) || [];

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(API_ROUTES.ORG.STATS);
      const result = await response.json();

      if (result.success) {
        setStats(result.data);
      } else {
        setError(result.error || 'Không thể tải thống kê');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải thống kê');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    setRecentActivities(MOCK_ACTIVITIES);
  }, []);

  const statCards = [
    {
      title: 'Tổng đơn vị',
      value: stats?.totalUnits || 0,
      icon: <ApartmentIcon color="primary" />, 
    },
    {
      title: 'Tổng nhân viên',
      value: stats?.totalEmployees || 0,
      icon: <PeopleIcon color="success" />, 
    },
    {
      title: 'Đơn vị hoạt động',
      value: stats?.activeUnits || 0,
      icon: <AssessmentIcon color="success" />, 
    },
    {
      title: 'Đơn vị ngưng hoạt động',
      value: stats?.inactiveUnits || 0,
      icon: <AssessmentIcon color="error" />, 
    },
  ];

  const quickActions = [
    {
      title: 'Quản lý đơn vị',
      description: 'Xem và cập nhật danh sách đơn vị',
      icon: <AccountTreeIcon fontSize="small" />, 
      route: ORG_ROUTES.UNIT,
    },
    {
      title: 'Sơ đồ tổ chức',
      description: 'Theo dõi cây tổ chức hiện tại',
      icon: <AccountTreeIcon fontSize="small" />, 
      route: ORG_ROUTES.TREE,
    },
    {
      title: 'Cấu hình tổ chức',
      description: 'Thiết lập thông tin toàn hệ thống',
      icon: <SettingsIcon fontSize="small" />, 
      route: ORG_ROUTES.CONFIG,
    },
    {
      title: 'Lịch sử thay đổi',
      description: 'Theo dõi hoạt động gần đây',
      icon: <TimelineIcon fontSize="small" />, 
      route: ORG_ROUTES.HISTORY,
    },
  ];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress size={48} />
        <Typography sx={{ ml: 2 }}>Đang tải dữ liệu...</Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700}>
          Tổng quan tổ chức
        </Typography>
        <Typography color="text.secondary">
          Theo dõi nhanh tình trạng đơn vị và hoạt động gần đây
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statCards.map((card) => (
          <Grid item xs={12} sm={6} md={3} key={card.title}>
            <Card variant="outlined">
              <CardContent>
                <Stack direction="row" spacing={2} alignItems="center">
                  {card.icon}
                  <Box>
                    <Typography variant="h6" fontWeight={600}>
                      {card.value}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {card.title}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Paper variant="outlined" sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
          Truy cập nhanh
        </Typography>
        <Grid container spacing={2}>
          {quickActions.map((action) => (
            <Grid item xs={12} sm={6} md={3} key={action.title}>
              <Button
                variant="outlined"
                fullWidth
                sx={{ justifyContent: 'flex-start', py: 1.5 }}
                onClick={() => router.push(action.route)}
                startIcon={action.icon}
              >
                <Box sx={{ textAlign: 'left' }}>
                  <Typography variant="body1" fontWeight={600}>
                    {action.title}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {action.description}
                  </Typography>
                </Box>
              </Button>
            </Grid>
          ))}
        </Grid>
      </Paper>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper variant="outlined" sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
              Đơn vị có nhiều nhân viên nhất
            </Typography>
            {topUnits.length === 0 && (
              <Typography color="text.secondary">Hiện chưa có dữ liệu.</Typography>
            )}
            <List dense>
              {topUnits.map((unit) => (
                <Box key={unit.id}>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemText
                      primary={<Typography fontWeight={600}>{unit.name}</Typography>}
                      secondary={
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Chip size="small" label={unit.code} variant="outlined" />
                          <Typography variant="caption" color="text.secondary">
                            {unit.employeeCount} nhân viên
                          </Typography>
                        </Stack>
                      }
                    />
                  </ListItem>
                  <Divider />
                </Box>
              ))}
            </List>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper variant="outlined" sx={{ p: 3 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
              <Typography variant="h6" fontWeight={600}>
                Hoạt động gần đây
              </Typography>
              <IconButton size="small" onClick={fetchStats}>
                <RefreshIcon fontSize="small" />
              </IconButton>
            </Stack>
            <List dense>
              {recentActivities.map((activity) => (
                <Box key={activity.id}>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemText
                      primary={activity.description}
                      secondary={
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Typography variant="caption" color="text.secondary">
                            {formatDateTime(activity.timestamp)}
                          </Typography>
                          {activity.unitName && <Chip size="small" label={activity.unitName} />}
                        </Stack>
                      }
                    />
                  </ListItem>
                  <Divider />
                </Box>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}
