'use client';

import {
  Box,
  Card,
  CardContent,
  Typography,
  Container,
  AppBar,
  Toolbar,
  Stack,
  Avatar,
  Paper,
} from '@mui/material';
import {
  AccountTree as AccountTreeIcon,
  People as PeopleIcon,
  School as SchoolIcon,
  Assignment as AssignmentIcon,
  Schedule as ScheduleIcon,
  AttachMoney as AttachMoneyIcon,
  Security as SecurityIcon,
  Analytics as AnalyticsIcon,
} from '@mui/icons-material';
import { ThemeToggle } from '@/components/theme-toggle';
import { useRouter } from 'next/navigation';

const moduleCards = [
  {
    id: 'org-management',
    title: 'Quản lý cơ cấu tổ chức',
    description: 'Tạo/sửa đơn vị (khoa, viện, bộ môn), thiết lập cây tổ chức, bổ nhiệm vai trò, báo cáo sơ đồ.',
    icon: AccountTreeIcon,
    color: '#1976d2',
    path: '/org/tree',
  },
  {
    id: 'hr-management',
    title: 'Quản lý nhân sự',
    description: 'Hồ sơ giảng viên/nhân viên, bổ nhiệm – luân chuyển, học vị, hợp đồng, báo cáo chuẩn giảng viên.',
    icon: PeopleIcon,
    color: '#ed6c02',
    path: '/hr/employees',
  },
  {
    id: 'education-management',
    title: 'Quản lý đào tạo',
    description: 'Ngành, chương trình đào tạo, học phần, kế hoạch giảng dạy.',
    icon: SchoolIcon,
    color: '#2e7d32',
    path: '/tms',
  },
  {
    id: 'student-management',
    title: 'Quản lý học vụ & sinh viên',
    description: 'Hồ sơ sinh viên, lớp học phần, đăng ký tín chỉ, điểm số, xét tốt nghiệp.',
    icon: AssignmentIcon,
    color: '#9c27b0',
    path: '/students',
  },
  {
    id: 'schedule-management',
    title: 'Quản lý lịch học – thi',
    description: 'Thời khóa biểu, lịch thi, phòng học.',
    icon: ScheduleIcon,
    color: '#d32f2f',
    path: '/schedule',
  },
  {
    id: 'financial-management',
    title: 'Quản lý tài chính – học phí',
    description: 'Thu học phí, học bổng – miễn giảm, công nợ, báo cáo tài chính.',
    icon: AttachMoneyIcon,
    color: '#f57c00',
    path: '/finance',
  },
  {
    id: 'user-management',
    title: 'Quản lý người dùng & phân quyền',
    description: 'Tài khoản, role/permission, phân quyền theo đơn vị, bảo mật & audit log.',
    icon: SecurityIcon,
    color: '#5d4037',
    path: '/users',
  },
  {
    id: 'reports-analytics',
    title: 'Báo cáo & phân tích',
    description: 'Báo cáo đào tạo, nhân sự, xu hướng ngành/học phần, dashboard KPI.',
    icon: AnalyticsIcon,
    color: '#00695c',
    path: '/reports',
  },
];

export default function Home() {
  const router = useRouter();

  const handleCardClick = (path: string) => {
    router.push(path);
  };

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default' }}>
      {/* Header */}
      <AppBar position="static" sx={{ backgroundColor: '#2e4c92' }}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, color: 'white' }}>
            Trasy - Hệ thống quản lý đào tạo
          </Typography>
          <ThemeToggle />
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Welcome Section */}
        <Paper elevation={0} sx={{ p: 4, mb: 4, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', borderRadius: 2 }}>
          <Stack spacing={2} alignItems="center" textAlign="center">
            <Typography variant="h3" component="h1" sx={{ fontWeight: 'bold' }}>
              Hệ thống quản lý Đại Học Phenikaa
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9 }}>
              Hệ thống quản lý toàn diện cho các cơ sở đào tạo
            </Typography>
          </Stack>
        </Paper>

        {/* Module Cards */}
        <Typography variant="h4" component="h2" sx={{ mb: 3, fontWeight: 'bold', textAlign: 'center' }}>
          Các module chính
        </Typography>
        
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(3, 1fr)',
              lg: 'repeat(4, 1fr)',
            },
            gap: 3,
          }}
        >
          {moduleCards.map((module) => (
            <Card
              key={module.id}
              sx={{
                height: '100%',
                cursor: 'pointer',
                transition: 'all 0.3s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: 6,
                },
                border: '1px solid',
                borderColor: 'divider',
              }}
              onClick={() => handleCardClick(module.path)}
            >
              <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Stack spacing={2} sx={{ height: '100%' }}>
                  {/* Icon */}
                  <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                    <Avatar
                      sx={{
                        width: 64,
                        height: 64,
                        backgroundColor: module.color,
                        boxShadow: 2,
                      }}
                    >
                      <module.icon sx={{ fontSize: 32, color: 'white' }} />
                    </Avatar>
                  </Box>

                  {/* Title */}
                  <Typography
                    variant="h6"
                    component="h3"
                    sx={{
                      fontWeight: 'bold',
                      textAlign: 'center',
                      color: 'text.primary',
                      lineHeight: 1.3,
                    }}
                  >
                    {module.title}
                  </Typography>

                  {/* Description */}
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      textAlign: 'center',
                      lineHeight: 1.5,
                      flexGrow: 1,
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    {module.description}
                  </Typography>

                  {/* Hover indicator */}
                  <Box
                    sx={{
                      width: '100%',
                      height: 3,
                      backgroundColor: module.color,
                      borderRadius: 1,
                      opacity: 0,
                      transition: 'opacity 0.3s ease-in-out',
                      '.MuiCard-root:hover &': {
                        opacity: 1,
                      },
                    }}
                  />
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Box>
      </Container>
    </Box>
  );
}