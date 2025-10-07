'use client';

import {
  Box,
  Container,
  Typography,
  Paper,
  Stack,
} from '@mui/material';
import {
  Schedule as ScheduleIcon,
} from '@mui/icons-material';

export default function SchedulePage() {
  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default', py: 4 }}>
      <Container maxWidth="lg">
        <Paper elevation={0} sx={{ p: 4, background: 'linear-gradient(135deg, #d32f2f 0%, #f44336 100%)', color: 'white', borderRadius: 2, mb: 4 }}>
          <Stack spacing={2} alignItems="center" textAlign="center">
            <ScheduleIcon sx={{ fontSize: 64 }} />
            <Typography variant="h3" component="h1" sx={{ fontWeight: 'bold' }}>
              Quản lý lịch học – thi
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9 }}>
              Thời khóa biểu, lịch thi, phòng học
            </Typography>
          </Stack>
        </Paper>

        <Paper sx={{ p: 4 }}>
          <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold' }}>
            Tính năng sắp có:
          </Typography>
          <Stack spacing={2}>
            <Typography>• Quản lý thời khóa biểu</Typography>
            <Typography>• Quản lý lịch thi</Typography>
            <Typography>• Quản lý phòng học</Typography>
            <Typography>• Xếp lịch tự động</Typography>
            <Typography>• Báo cáo lịch học</Typography>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}
