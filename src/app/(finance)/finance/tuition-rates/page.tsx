'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
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
  TextField,
  Typography,
  Alert,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  AccountBalanceWallet as AccountBalanceWalletIcon,
} from '@mui/icons-material';

type TuitionRate = {
  id: string;
  academicYear: string;
  perCreditFee: number;
  currency: string;
  totalCredits: number;
  minTuition: number;
  updatedAt: string;
  major: { id: string; name: string };
  program: { id: string | null; name: string | null } | null;
};

type MajorOption = {
  id: string;
  name: string;
  code: string | null;
  totalCreditsMin: number | null;
  programs: { id: string | null; name: string | null; totalCredits: number | null }[];
};

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

export default function TuitionRatesPage() {
  const router = useRouter();
  const [academicYear, setAcademicYear] = useState(getCurrentAcademicYear());
  const [majors, setMajors] = useState<MajorOption[]>([]);
  const [tuitionRates, setTuitionRates] = useState<TuitionRate[]>([]);
  const [loading, setLoading] = useState(false);

  const yearOptions = useMemo(() => buildYearOptions(6), []);

  const fetchMajors = async () => {
    try {
      const response = await fetch('/api/finance/majors');
      if (response.ok) {
        const data = await response.json();
        setMajors(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch majors', error);
    }
  };

  const fetchTuitionRates = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/finance/tuition-rates?year=${academicYear}`);
      if (response.ok) {
        const data = await response.json();
        setTuitionRates(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch tuition rates', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMajors();
  }, []);

  useEffect(() => {
    fetchTuitionRates();
  }, [academicYear]);

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
              Quản lý mức học phí
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              Quản lý và cập nhật đơn giá học phí theo tín chỉ cho từng ngành/chương trình đào tạo.
            </Typography>
          </Stack>
          <AccountBalanceWalletIcon sx={{ fontSize: 80, opacity: 0.85 }} />
        </Stack>
      </Paper>

      <Paper sx={{ p: 3, borderRadius: 3 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center" justifyContent="space-between" mb={2}>
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
              onClick={fetchTuitionRates}
              disabled={loading}
            >
              Làm mới
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => router.push('/finance')}
            >
              Thêm mới
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
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Ngành / CTĐT</TableCell>
                <TableCell>Năm học</TableCell>
                <TableCell align="right">Đơn giá (₫)</TableCell>
                <TableCell align="right">Tổng tín chỉ</TableCell>
                <TableCell align="right">Học phí tối thiểu (₫)</TableCell>
                <TableCell>Ngày cập nhật</TableCell>
                <TableCell align="right">Thao tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tuitionRates.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Alert severity="info" sx={{ my: 2 }}>
                      Chưa có dữ liệu học phí cho năm học này.
                    </Alert>
                  </TableCell>
                </TableRow>
              )}
              {tuitionRates.map((rate) => (
                <TableRow key={rate.id} hover>
                  <TableCell>
                    <Typography fontWeight={600}>{rate.program?.name || rate.major.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Ngành {rate.major.name}
                    </Typography>
                  </TableCell>
                  <TableCell>{rate.academicYear}</TableCell>
                  <TableCell align="right">{rate.perCreditFee.toLocaleString('vi-VN')}</TableCell>
                  <TableCell align="right">{rate.totalCredits}</TableCell>
                  <TableCell align="right">{rate.minTuition.toLocaleString('vi-VN')}</TableCell>
                  <TableCell>{new Date(rate.updatedAt).toLocaleDateString('vi-VN')}</TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <Tooltip title="Chỉnh sửa">
                        <IconButton size="small" color="primary">
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Xóa">
                        <IconButton size="small" color="error">
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Paper>
    </Box>
  );
}

