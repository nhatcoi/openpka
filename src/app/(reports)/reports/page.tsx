'use client';

import {
  Box,
  Container,
  Typography,
  Paper,
  Stack,
} from '@mui/material';
import {
  Analytics as AnalyticsIcon,
} from '@mui/icons-material';

export default function ReportsPage() {
  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default', py: 4 }}>
      <Container maxWidth="lg">
        <Paper elevation={0} sx={{ p: 4, background: 'linear-gradient(135deg, #00695c 0%, #009688 100%)', color: 'white', borderRadius: 2, mb: 4 }}>
          <Stack spacing={2} alignItems="center" textAlign="center">
            <AnalyticsIcon sx={{ fontSize: 64 }} />
            <Typography variant="h3" component="h1" sx={{ fontWeight: 'bold' }}>
              Báo cáo & phân tích
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9 }}>
              Báo cáo đào tạo, nhân sự, xu hướng ngành/học phần, dashboard KPI
            </Typography>
          </Stack>
        </Paper>

        <Paper sx={{ p: 4 }}>
          <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold' }}>
            Tính năng sắp có:
          </Typography>
          <Stack spacing={2}>
            <Typography>• Báo cáo đào tạo</Typography>
            <Typography>• Báo cáo nhân sự</Typography>
            <Typography>• Phân tích xu hướng ngành/học phần</Typography>
            <Typography>• Dashboard KPI</Typography>
            <Typography>• Xuất báo cáo Excel/PDF</Typography>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}
