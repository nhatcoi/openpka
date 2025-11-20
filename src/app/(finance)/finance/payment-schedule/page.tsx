'use client';

import { useState, useEffect } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  Chip,
  TextField,
} from '@mui/material';
import {
  CalendarToday as CalendarIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';

const getCurrentAcademicYear = () => {
  const now = new Date();
  const startYear = now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1;
  return `${startYear}-${startYear + 1}`;
};

const buildYearOptions = (range = 5) => {
  const current = getCurrentAcademicYear();
  const [start] = current.split('-').map(Number);
  return Array.from({ length: range }, (_, idx) => {
    const yearStart = start - idx;
    return `${yearStart}-${yearStart + 1}`;
  });
};

export default function PaymentSchedulePage() {
  const [academicYear, setAcademicYear] = useState(getCurrentAcademicYear());
  const [loading, setLoading] = useState(false);
  const yearOptions = buildYearOptions(6);

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
              Lịch thu học phí
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              Quản lý lịch thu học phí theo từng đợt, học kỳ và năm học.
            </Typography>
          </Stack>
          <CalendarIcon sx={{ fontSize: 80, opacity: 0.85 }} />
        </Stack>
      </Paper>

      <Paper sx={{ p: 3, borderRadius: 3 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center" justifyContent="space-between" mb={3}>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Năm học</InputLabel>
            <Select
              label="Năm học"
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
            >
              {yearOptions.map((year) => (
                <MenuItem key={year} value={year}>
                  {year}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={() => {}}
              disabled={loading}
            >
              Làm mới
            </Button>
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
            >
              Xuất Excel
            </Button>
          </Stack>
        </Stack>

        {loading ? (
          <Stack alignItems="center" py={4}>
            <CircularProgress />
            <Typography mt={2} color="text.secondary">
              Đang tải dữ liệu...
            </Typography>
          </Stack>
        ) : (
          <Alert severity="info">
            Tính năng đang được phát triển. Sẽ sớm có sẵn.
          </Alert>
        )}
      </Paper>
    </Box>
  );
}

