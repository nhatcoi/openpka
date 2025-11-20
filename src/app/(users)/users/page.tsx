'use client';

import {
  Box,
  Container,
  Typography,
  Paper,
  Stack,
} from '@mui/material';
import {
  Security as SecurityIcon,
} from '@mui/icons-material';

export default function UsersPage() {
  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default', py: 4 }}>
      <Container maxWidth="lg">
        <Paper elevation={0} sx={{ p: 4, background: 'linear-gradient(135deg, #5d4037 0%, #8d6e63 100%)', color: 'white', borderRadius: 2, mb: 4 }}>
          <Stack spacing={2} alignItems="center" textAlign="center">
            <SecurityIcon sx={{ fontSize: 64 }} />
            <Typography variant="h3" component="h1" sx={{ fontWeight: 'bold' }}>
              Quản lý người dùng & phân quyền
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9 }}>
              Tài khoản, role/permission, phân quyền theo đơn vị, bảo mật & audit log
            </Typography>
          </Stack>
        </Paper>

        <Paper sx={{ p: 4 }}>
          <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold' }}>
            Tính năng sắp có:
          </Typography>
          <Stack spacing={2}>
            <Typography>• Quản lý tài khoản người dùng</Typography>
            <Typography>• Quản lý vai trò & quyền hạn</Typography>
            <Typography>• Phân quyền theo đơn vị</Typography>
            <Typography>• Bảo mật & audit log</Typography>
            <Typography>• Xác thực đa yếu tố</Typography>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}
