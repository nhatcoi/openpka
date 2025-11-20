'use client';

import {
  Box,
  Paper,
  Stack,
  Typography,
  Chip,
  Alert,
} from '@mui/material';
import {
  Savings as SavingsIcon,
} from '@mui/icons-material';

export default function DiscountsPage() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Paper
        elevation={0}
        sx={{
          p: 4,
          borderRadius: 3,
          background: 'linear-gradient(135deg, #0f172a 0%, #0c4a6e 100%)',
          color: '#fff',
        }}
      >
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems="center" justifyContent="space-between">
          <Stack spacing={1}>
            <Typography variant="h4" fontWeight={700}>
              Miễn giảm & học bổng
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              Quản lý các chính sách miễn giảm học phí và học bổng cho sinh viên.
            </Typography>
          </Stack>
          <SavingsIcon sx={{ fontSize: 80, opacity: 0.85 }} />
        </Stack>
      </Paper>

      <Paper sx={{ p: 3, borderRadius: 3 }}>
        <Alert severity="info">
          Tính năng đang được phát triển. Sẽ sớm có sẵn.
        </Alert>
      </Paper>
    </Box>
  );
}

