'use client';

import {
  Box,
  Container,
  Typography,
  Paper,
  Stack,
} from '@mui/material';
import {
  AttachMoney as AttachMoneyIcon,
} from '@mui/icons-material';

export default function FinancePage() {
  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default', py: 4 }}>
      <Container maxWidth="lg">
        <Paper elevation={0} sx={{ p: 4, background: 'linear-gradient(135deg, #f57c00 0%, #ff9800 100%)', color: 'white', borderRadius: 2, mb: 4 }}>
          <Stack spacing={2} alignItems="center" textAlign="center">
            <AttachMoneyIcon sx={{ fontSize: 64 }} />
            <Typography variant="h3" component="h1" sx={{ fontWeight: 'bold' }}>
              Quản lý tài chính – học phí
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9 }}>
              Thu học phí, học bổng – miễn giảm, công nợ, báo cáo tài chính
            </Typography>
          </Stack>
        </Paper>

        <Paper sx={{ p: 4 }}>
          <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold' }}>
            Tính năng sắp có:
          </Typography>
          <Stack spacing={2}>
            <Typography>• Quản lý thu học phí</Typography>
            <Typography>• Quản lý học bổng & miễn giảm</Typography>
            <Typography>• Quản lý công nợ</Typography>
            <Typography>• Báo cáo tài chính</Typography>
            <Typography>• Thanh toán trực tuyến</Typography>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}
