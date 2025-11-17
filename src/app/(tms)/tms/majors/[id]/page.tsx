'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Stack,
  Button,
  Chip,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Breadcrumbs,
  Link,
} from '@mui/material';
import {
  Edit as EditIcon,
  ArrowBack as ArrowBackIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useRouter, useParams } from 'next/navigation';

type IdLike = number | string;

interface Major {
  id: IdLike;
  code: string;
  name_vi: string;
  name_en?: string;
  short_name?: string;
  slug?: string;
  degree_level: string;
  org_unit_id: IdLike;
  duration_years?: number | string;
  total_credits_min?: number | string;
  total_credits_max?: number | string;
  semesters_per_year?: number | string;
  default_quota?: number | string | null;
  status: string;
  closed_at?: string;
  metadata?: Record<string, any> | null;
  created_by?: IdLike | null;
  updated_by?: IdLike | null;
  created_at?: string;
  updated_at?: string;
}

export default function MajorDetailPage() {
  const router = useRouter();
  const params = useParams();
  const majorId = params.id as string;
  
  const [major, setMajor] = useState<Major | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [deleteDialog, setDeleteDialog] = useState(false);

  // Fetch major data
  useEffect(() => {
    const fetchMajor = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/tms/majors/${majorId}`);
        const data = await response.json();

        if (data.success) {
          const payload = data.data?.data ?? data.data;
          setMajor(payload || null);
        } else {
          setError(data.error || 'Failed to fetch major');
        }
      } catch (err) {
        setError('Network error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (majorId) {
      fetchMajor();
    }
  }, [majorId]);

  const getStatusConfig = (status: string) => {
    const normalized = status.toUpperCase();

    switch (normalized) {
      case 'ACTIVE':
        return { color: 'success' as const, label: 'Hoạt động' };
      case 'SUSPENDED':
        return { color: 'warning' as const, label: 'Tạm dừng' };
      case 'CLOSED':
        return { color: 'error' as const, label: 'Đã đóng' };
      case 'PROPOSED':
        return { color: 'info' as const, label: 'Đề xuất' };
      case 'REVIEWING':
        return { color: 'info' as const, label: 'Đang xem xét' };
      case 'APPROVED':
        return { color: 'success' as const, label: 'Đã phê duyệt' };
      case 'DRAFT':
      default:
        return { color: 'default' as const, label: 'Nháp' };
    }
  };

  const getDegreeLevelText = (level?: string) => {
    if (!level) return '—';

    switch (level.toLowerCase()) {
      case 'bachelor':
        return 'Cử nhân';
      case 'master':
        return 'Thạc sĩ';
      case 'doctor':
        return 'Tiến sĩ';
      case 'associate':
        return 'Cao đẳng';
      default:
        return level;
    }
  };

  const parseNumeric = (value: number | string | null | undefined): number | null => {
    if (value === null || value === undefined) return null;
    if (typeof value === 'number') {
      return Number.isNaN(value) ? null : value;
    }

    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  };

  const formatNumber = (value: number | string | null | undefined, fallback: string = '—') => {
    const parsed = parseNumeric(value);
    if (parsed === null) return fallback;

    return parsed.toLocaleString('vi-VN');
  };

  const formatCreditRange = (
    min?: number | string,
    max?: number | string
  ) => {
    const minVal = parseNumeric(min ?? null);
    const maxVal = parseNumeric(max ?? null);

    if (minVal !== null && maxVal !== null) {
      if (minVal === maxVal) return `${minVal} tín chỉ`;
      return `${minVal} - ${maxVal} tín chỉ`;
    }

    if (minVal !== null) return `${minVal} tín chỉ`;
    if (maxVal !== null) return `${maxVal} tín chỉ`;
    return '—';
  };

  const formatDate = (value?: string | null) => {
    if (!value) return '—';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleDateString('vi-VN');
  };

  const formatBoolean = (value: boolean | null | undefined) => {
    if (value === undefined || value === null) return '—';
    return value ? 'Có' : 'Không';
  };

  const handleDelete = async () => {
    if (!major) return;

    try {
      const response = await fetch(`/api/tms/majors/${major.id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        router.push('/tms/majors');
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to delete major');
      }
    } catch (err) {
      setError('Network error occurred');
    }
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', backgroundColor: '#f8fafc', py: 4 }}>
        <Container maxWidth="lg">
          <Stack alignItems="center" justifyContent="center" sx={{ minHeight: 400 }}>
            <CircularProgress size={60} sx={{ color: 'primary.main' }} />
            <Typography variant="h6" sx={{ mt: 2, color: 'text.secondary' }}>
              Đang tải thông tin ngành đào tạo...
            </Typography>
          </Stack>
        </Container>
      </Box>
    );
  }

  if (error || !major) {
    return (
      <Box sx={{ minHeight: '100vh', backgroundColor: '#f8fafc', py: 4 }}>
        <Container maxWidth="lg">
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
            {error || 'Ngành đào tạo không tồn tại'}
          </Alert>
        </Container>
      </Box>
    );
  }

  const durationYears = parseNumeric(major.duration_years);
  const semestersPerYear = parseNumeric(major.semesters_per_year);
  const creditRangeText = formatCreditRange(major.total_credits_min, major.total_credits_max);
  
  // Get values from metadata
  const metadata = major.metadata || {};
  const fieldCluster = metadata.field_cluster || '—';
  const isMoetStandard = metadata.is_moet_standard || false;
  const establishedAt = metadata.established_at || null;
  const description = metadata.description || null;
  const startTerms = metadata.start_terms || '—';
  const customMetadataEntries = Object.entries(metadata).filter(
    ([key]) =>
      !['field_cluster', 'is_moet_standard', 'established_at', 'description', 'notes', 'start_terms'].includes(
        key
      )
  );
  const basicInfo = [
    { label: 'Đơn vị quản lý (ID)', value: String(major.org_unit_id) },
    { label: 'Slug', value: major.slug || '—' },
    { label: 'Tên viết tắt', value: major.short_name || '—' },
    { label: 'Nhóm ngành', value: fieldCluster },
    { label: 'Chuẩn MOET', value: formatBoolean(isMoetStandard) },
  ];

  const trainingInfo = [
    { label: 'Số học kỳ / năm', value: semestersPerYear ?? '—' },
    { label: 'Tổng tín chỉ', value: creditRangeText },
    { label: 'Chỉ tiêu mặc định', value: formatNumber(major.default_quota) },
  ];

  const timelineInfo = [
    { label: 'Ngày thành lập', value: formatDate(establishedAt) },
    { label: 'Ngày đóng', value: formatDate(major.closed_at) },
    { label: 'Ngày tạo', value: formatDate(major.created_at) },
    { label: 'Ngày cập nhật', value: formatDate(major.updated_at) },
  ];

  const renderInfoItems = (
    items: { label: string; value: React.ReactNode }[],
    columns: number = 2
  ) => (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr',
          md: `repeat(${columns}, 1fr)`,
        },
        gap: 2,
      }}
    >
      {items.map((item) => (
        <Box key={item.label}>
          <Typography variant="body2" color="text.secondary">
            {item.label}
          </Typography>
          <Typography variant="subtitle1" fontWeight={600}>
            {item.value}
          </Typography>
        </Box>
      ))}
    </Box>
  );

  const formatMetadataValue = (value: any) => {
    if (value === null || value === undefined || value === '') return '—';
    if (typeof value === 'object') {
      try {
        return JSON.stringify(value);
      } catch {
        return String(value);
      }
    }
    return String(value);
  };

  const statusConfig = getStatusConfig(major.status);

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default', py: 4 }}>
      <Container maxWidth="lg">
        <Stack spacing={3}>
          <Breadcrumbs>
            <Link
              color="inherit"
              href="/tms"
              sx={{ textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
            >
              TMS
            </Link>
            <Link
              color="inherit"
              href="/tms/majors"
              sx={{ textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
            >
              Ngành đào tạo
            </Link>
            <Typography color="text.primary">{major.name_vi}</Typography>
          </Breadcrumbs>

          <Paper variant="outlined" sx={{ p: 3 }}>
            <Stack spacing={2}>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} justifyContent="space-between">
                <Box>
                  <Typography variant="h4" fontWeight={600}>
                    {major.name_vi}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {[major.code, getDegreeLevelText(major.degree_level), major.name_en].filter(Boolean).join(' • ')}
                  </Typography>
                </Box>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  <Button
                    variant="outlined"
                    startIcon={<ArrowBackIcon />}
                    onClick={() => router.back()}
                  >
                    Quay lại
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<EditIcon />}
                    onClick={() => router.push(`/tms/majors/${major.id}/edit`)}
                  >
                    Chỉnh sửa
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={() => setDeleteDialog(true)}
                  >
                    Xóa
                  </Button>
                  <Chip
                    label={statusConfig.label}
                    color={statusConfig.color}
                    sx={{ alignSelf: 'center' }}
                  />
                </Stack>
              </Stack>
              <Divider />
              {renderInfoItems(
                [
                  { label: 'Thời gian đào tạo', value: durationYears !== null ? `${durationYears} năm` : '—' },
                  { label: 'Tổng tín chỉ', value: creditRangeText },
              
                ],
                3
              )}
            </Stack>
          </Paper>

          <Paper variant="outlined" sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600} mb={2}>
              Thông tin cơ bản
            </Typography>
            {renderInfoItems(basicInfo)}
          </Paper>

          <Paper variant="outlined" sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600} mb={2}>
              Thông tin đào tạo
            </Typography>
            {renderInfoItems(trainingInfo)}
          </Paper>

          <Paper variant="outlined" sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600} mb={2}>
              Mốc thời gian
            </Typography>
            {renderInfoItems(timelineInfo)}
          </Paper>

          {description && (
            <Paper variant="outlined" sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={600} mb={1}>
                Mô tả
              </Typography>
              <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
                {description}
              </Typography>
            </Paper>
          )}

          {customMetadataEntries.length > 0 && (
            <Paper variant="outlined" sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={600} mb={2}>
                Thông tin bổ sung
              </Typography>
              {renderInfoItems(
                customMetadataEntries.map(([key, value]) => ({
                  label: key,
                  value: formatMetadataValue(value),
                }))
              )}
            </Paper>
          )}
        </Stack>

        <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)} maxWidth="xs" fullWidth>
          <DialogTitle>Xác nhận xóa</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary">
              Bạn có chắc chắn muốn xóa ngành đào tạo “{major?.name_vi}”? Hành động này không thể hoàn tác.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialog(false)}>Hủy</Button>
            <Button color="error" variant="contained" onClick={handleDelete}>
              Xóa
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
}
