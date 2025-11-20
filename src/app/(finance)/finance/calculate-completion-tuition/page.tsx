'use client';

import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  Paper,
  Stack,
  TextField,
  Typography,
  Chip,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  Calculate as CalculateIcon,
  School as SchoolIcon,
  Person as PersonIcon,
  AttachMoney as AttachMoneyIcon,
} from '@mui/icons-material';

interface CalculationResult {
  studentId: string;
  program: {
    id: string;
    name: string;
    code: string | null;
    totalCredits: number | null;
  };
  major: {
    id: string;
    name: string;
    code: string | null;
    totalCreditsMin: number | null;
  } | null;
  cohort: {
    id: string;
    name: string;
    academicYear: string | null;
  } | null;
  creditsEarned: number;
  creditsRequired: number;
  creditsRemaining: number;
  academicYear: string;
  perCreditFee: number | null;
  remainingTuition: number | null;
  currency: string | null;
  gpa: number | null;
  status: string | null;
  enrollmentDate: string;
  expectedGraduationDate: string | null;
}

export default function CalculateCompletionTuitionPage() {
  const [studentId, setStudentId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCalculate = async () => {
    if (!studentId.trim()) {
      setError('Vui lòng nhập mã sinh viên');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(
        `/api/finance/calculate-completion-tuition?studentId=${encodeURIComponent(studentId)}`
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Không thể tính học phí');
      }

      const data = await response.json();
      setResult(data.data);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi');
    } finally {
      setLoading(false);
    }
  };

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
              Tính học phí hoàn thành CTĐT
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              Tính toán học phí còn lại cần đóng để hoàn thành chương trình đào tạo dựa trên số tín chỉ đã tích lũy.
            </Typography>
            <Stack direction="row" spacing={1}>
              <Chip label="Học phí" color="secondary" variant="outlined" sx={{ borderColor: 'rgba(255,255,255,0.6)', color: '#fff' }} />
              <Chip label="CTĐT" variant="outlined" sx={{ borderColor: 'rgba(255,255,255,0.6)', color: '#fff' }} />
            </Stack>
          </Stack>
          <CalculateIcon sx={{ fontSize: 80, opacity: 0.85 }} />
        </Stack>
      </Paper>

      <Paper sx={{ p: 3, borderRadius: 3 }}>
        <Stack spacing={3}>
          <Typography variant="h6" fontWeight={700}>
            Thông tin sinh viên
          </Typography>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="Mã sinh viên"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              placeholder="Nhập mã sinh viên"
              fullWidth
              InputProps={{
                startAdornment: <PersonIcon sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
            <Button
              variant="contained"
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <CalculateIcon />}
              onClick={handleCalculate}
              disabled={loading || !studentId.trim()}
              sx={{ minWidth: 180 }}
            >
              {loading ? 'Đang tính...' : 'Tính học phí'}
            </Button>
          </Stack>

          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
        </Stack>
      </Paper>

      {result && (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
              <CardContent>
                <Stack spacing={2}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <SchoolIcon color="primary" />
                    <Typography variant="h6" fontWeight={700}>
                      Thông tin chương trình
                    </Typography>
                  </Stack>

                  <Divider />

                  <Table size="small">
                    <TableBody>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>Mã CTĐT</TableCell>
                        <TableCell>{result.program.code || '—'}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>Tên CTĐT</TableCell>
                        <TableCell>{result.program.name}</TableCell>
                      </TableRow>
                      {result.major && (
                        <>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 600 }}>Ngành</TableCell>
                            <TableCell>{result.major.name}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 600 }}>Mã ngành</TableCell>
                            <TableCell>{result.major.code || '—'}</TableCell>
                          </TableRow>
                        </>
                      )}
                      {result.cohort && (
                        <TableRow>
                          <TableCell sx={{ fontWeight: 600 }}>Khóa học</TableCell>
                          <TableCell>
                            {result.cohort.name}
                            {result.cohort.academicYear && ` (${result.cohort.academicYear})`}
                          </TableCell>
                        </TableRow>
                      )}
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>Tổng số tín chỉ</TableCell>
                        <TableCell>{result.program.totalCredits || result.major?.totalCreditsMin || '—'}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>GPA</TableCell>
                        <TableCell>{result.gpa?.toFixed(2) || '—'}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>Trạng thái</TableCell>
                        <TableCell>
                          <Chip
                            label={result.status || '—'}
                            size="small"
                            color={result.status === 'ACTIVE' ? 'success' : 'default'}
                          />
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
              <CardContent>
                <Stack spacing={2}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <AttachMoneyIcon color="primary" />
                    <Typography variant="h6" fontWeight={700}>
                      Tính toán học phí
                    </Typography>
                  </Stack>

                  <Divider />

                  {result.perCreditFee === null ? (
                    <Alert severity="warning">
                      Chưa có đơn giá học phí cho năm học {result.academicYear}. Vui lòng thiết lập đơn giá trước.
                    </Alert>
                  ) : (
                    <Table size="small">
                      <TableBody>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 600 }}>Năm học</TableCell>
                          <TableCell>{result.academicYear}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 600 }}>Tín chỉ đã tích lũy</TableCell>
                          <TableCell>{result.creditsEarned}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 600 }}>Tín chỉ yêu cầu</TableCell>
                          <TableCell>{result.creditsRequired}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 600 }}>Tín chỉ còn lại</TableCell>
                          <TableCell>
                            <Typography variant="h6" color="primary" fontWeight={700}>
                              {result.creditsRemaining}
                            </Typography>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 600 }}>Đơn giá / tín chỉ</TableCell>
                          <TableCell>
                            {result.perCreditFee.toLocaleString('vi-VN')} {result.currency}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 600 }}>Học phí còn lại</TableCell>
                          <TableCell>
                            <Typography variant="h5" color="primary" fontWeight={700}>
                              {result.remainingTuition?.toLocaleString('vi-VN')} {result.currency}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  )}

                  <Divider />

                  <Box sx={{ p: 2, bgcolor: 'primary.50', borderRadius: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Ngày nhập học
                    </Typography>
                    <Typography variant="body1" fontWeight={600}>
                      {new Date(result.enrollmentDate).toLocaleDateString('vi-VN')}
                    </Typography>
                    {result.expectedGraduationDate && (
                      <>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }} gutterBottom>
                          Dự kiến tốt nghiệp
                        </Typography>
                        <Typography variant="body1" fontWeight={600}>
                          {new Date(result.expectedGraduationDate).toLocaleDateString('vi-VN')}
                        </Typography>
                      </>
                    )}
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
}

