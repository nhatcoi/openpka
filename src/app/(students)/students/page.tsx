'use client';

import {
  Box,
  Container,
  Typography,
  Paper,
  Stack,
} from '@mui/material';
import {
  Assignment as AssignmentIcon,
} from '@mui/icons-material';

export default function StudentsPage() {
  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default', py: 4 }}>
      <Container maxWidth="lg">
        <Paper elevation={0} sx={{ p: 4, background: 'linear-gradient(135deg, #9c27b0 0%, #e91e63 100%)', color: 'white', borderRadius: 2, mb: 4 }}>
          <Stack spacing={2} alignItems="center" textAlign="center">
            <AssignmentIcon sx={{ fontSize: 64 }} />
            <Typography variant="h3" component="h1" sx={{ fontWeight: 'bold' }}>
              Quản lý học vụ & sinh viên
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9 }}>
              Hồ sơ sinh viên, lớp học phần, đăng ký tín chỉ, điểm số, xét tốt nghiệp
            </Typography>
          </Stack>
        </Paper>

        <Paper sx={{ p: 4 }}>
          <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold' }}>
            Tính năng sắp có:
          </Typography>
          <Stack spacing={2}>
            <Typography>• Quản lý hồ sơ sinh viên</Typography>
            <Typography>• Quản lý lớp học phần</Typography>
            <Typography>• Đăng ký tín chỉ</Typography>
            <Typography>• Quản lý điểm số</Typography>
            <Typography>• Xét tốt nghiệp</Typography>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}
