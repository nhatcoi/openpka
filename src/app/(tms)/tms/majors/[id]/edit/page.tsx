'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Alert,
  CircularProgress,
  Button,
  Paper,
  Stack,
} from '@mui/material';
import {
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { useRouter, useParams } from 'next/navigation';

interface OrgUnit {
  id: number;
  name: string;
  code: string;
}

interface MajorData {
  id: number;
  code: string;
  name_vi: string;
  name_en: string;
  short_name: string;
  slug: string;
  national_code: string;
  is_moet_standard: boolean;
  degree_level: string;
  field_cluster: string;
  specialization_model: string;
  org_unit_id: number;
  parent_major_id: number | null;
  duration_years: number;
  total_credits_min: number;
  total_credits_max: number;
  semesters_per_year: number;
  start_terms: string;
  default_quota: number;
  status: string;
  established_at: string;
  closed_at: string;
  description: string;
  notes: string;
}

export default function EditMajorPage() {
  const router = useRouter();
  const params = useParams();
  const majorId = params.id as string;

  // State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [majorData, setMajorData] = useState<MajorData | null>(null);
  const [orgUnits, setOrgUnits] = useState<OrgUnit[]>([]);

  // Form data
  const [formData, setFormData] = useState({
    code: '',
    name_vi: '',
    name_en: '',
    short_name: '',
    slug: '',
    national_code: '',
    is_moet_standard: false,
    degree_level: 'bachelor',
    field_cluster: '',
    specialization_model: 'none',
    org_unit_id: 0,
    parent_major_id: null as number | null,
    duration_years: 4.0,
    total_credits_min: 120,
    total_credits_max: 150,
    semesters_per_year: 2,
    start_terms: 'Fall',
    default_quota: 100,
    status: 'draft',
    established_at: '',
    closed_at: '',
    description: '',
    notes: '',
  });

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch major data
        const majorResponse = await fetch(`/api/tms/majors/${majorId}`);
        const majorResult = await majorResponse.json();

        if (!majorResult.success) {
          throw new Error(majorResult.error || 'Failed to fetch major');
        }

        const major = majorResult.data;
        setMajorData(major);

        // Populate form with major data
        setFormData({
          code: major.code || '',
          name_vi: major.name_vi || '',
          name_en: major.name_en || '',
          short_name: major.short_name || '',
          slug: major.slug || '',
          national_code: major.national_code || '',
          is_moet_standard: major.is_moet_standard || false,
          degree_level: major.degree_level || 'bachelor',
          field_cluster: major.field_cluster || '',
          specialization_model: major.specialization_model || 'none',
          org_unit_id: Number(major.org_unit_id) || 0,
          parent_major_id: major.parent_major_id ? Number(major.parent_major_id) : null,
          duration_years: Number(major.duration_years) || 4.0,
          total_credits_min: major.total_credits_min || 120,
          total_credits_max: major.total_credits_max || 150,
          semesters_per_year: major.semesters_per_year || 2,
          start_terms: major.start_terms || 'Fall',
          default_quota: major.default_quota || 100,
          status: major.status || 'draft',
          established_at: major.established_at ? new Date(major.established_at).toISOString().split('T')[0] : '',
          closed_at: major.closed_at ? new Date(major.closed_at).toISOString().split('T')[0] : '',
          description: major.description || '',
          notes: major.notes || '',
        });

        // Fetch org units
        const orgResponse = await fetch('/api/tms/majors/org-units');
        const orgResult = await orgResponse.json();
        
        if (orgResult.success) {
          setOrgUnits(orgResult.data);
        }

      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    if (majorId) {
      fetchData();
    }
  }, [majorId]);

  // Handle form input changes
  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle form submission
  const handleSubmit = async () => {
    try {
      setSaving(true);
      setError(null);

      // Basic validation
      if (!formData.code.trim() || !formData.name_vi.trim() || !formData.org_unit_id) {
        setError('Vui lòng điền đầy đủ thông tin bắt buộc');
        return;
      }

      // Submit edit request
      const response = await fetch(`/api/tms/majors/${majorId}/edit-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          changes: formData,
          reason: 'Chỉnh sửa thông tin ngành đào tạo',
          requested_by: 'current_user', // Should come from auth context
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert('Yêu cầu chỉnh sửa đã được gửi thành công!');
        router.push(`/tms/majors/${majorId}`);
      } else {
        setError(result.error || 'Không thể gửi yêu cầu chỉnh sửa');
      }

    } catch (err) {
      console.error('Error submitting form:', err);
      setError('Lỗi mạng khi gửi yêu cầu');
    } finally {
      setSaving(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', backgroundColor: '#f8fafc', py: 4 }}>
        <Container maxWidth="lg">
          <Stack alignItems="center" justifyContent="center" sx={{ minHeight: 400 }}>
            <CircularProgress size={60} />
            <Typography variant="h6" sx={{ mt: 2 }}>
              Đang tải thông tin ngành đào tạo...
            </Typography>
          </Stack>
        </Container>
      </Box>
    );
  }

  // Error state
  if (error && !majorData) {
    return (
      <Box sx={{ minHeight: '100vh', backgroundColor: '#f8fafc', py: 4 }}>
        <Container maxWidth="lg">
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
          <Button
            variant="contained"
            startIcon={<ArrowBackIcon />}
            onClick={() => router.back()}
          >
            Quay lại
          </Button>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f8fafc', py: 4 }}>
      <Container maxWidth="lg">
        {/* Header */}
        <Paper sx={{ p: 4, mb: 4, borderRadius: 3 }}>
          <Stack direction="row" alignItems="center" spacing={2} mb={3}>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => router.back()}
            >
              Quay lại
            </Button>
          </Stack>
          
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 1 }}>
            Chỉnh sửa ngành đào tạo
          </Typography>
          
          {majorData && (
            <Typography variant="h6" color="text.secondary">
              {majorData.name_vi} ({majorData.code})
            </Typography>
          )}
        </Paper>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Form */}
        <Paper sx={{ p: 4, borderRadius: 3 }}>
          <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>
            Thông tin cơ bản
          </Typography>

          <Stack spacing={3}>
            {/* Basic Information */}
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
              <TextField
                fullWidth
                label="Mã ngành *"
                value={formData.code}
                onChange={(e) => handleInputChange('code', e.target.value)}
                placeholder="VD: CNTT"
              />
              
              <TextField
                fullWidth
                label="Tên ngắn"
                value={formData.short_name}
                onChange={(e) => handleInputChange('short_name', e.target.value)}
                placeholder="VD: CNTT"
              />
            </Stack>

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
              <TextField
                fullWidth
                label="Tên tiếng Việt *"
                value={formData.name_vi}
                onChange={(e) => handleInputChange('name_vi', e.target.value)}
                placeholder="VD: Công nghệ thông tin"
              />
              
              <TextField
                fullWidth
                label="Tên tiếng Anh"
                value={formData.name_en}
                onChange={(e) => handleInputChange('name_en', e.target.value)}
                placeholder="VD: Information Technology"
              />
            </Stack>

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
              <FormControl fullWidth>
                <InputLabel>Đơn vị quản lý *</InputLabel>
                <Select
                  value={formData.org_unit_id}
                  label="Đơn vị quản lý *"
                  onChange={(e) => handleInputChange('org_unit_id', Number(e.target.value))}
                >
                  {orgUnits.map((unit) => (
                    <MenuItem key={unit.id} value={unit.id}>
                      {unit.name} ({unit.code})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <FormControl fullWidth>
                <InputLabel>Bằng cấp *</InputLabel>
                <Select
                  value={formData.degree_level}
                  label="Bằng cấp *"
                  onChange={(e) => handleInputChange('degree_level', e.target.value)}
                >
                  <MenuItem value="associate">Cao đẳng</MenuItem>
                  <MenuItem value="bachelor">Cử nhân</MenuItem>
                  <MenuItem value="master">Thạc sĩ</MenuItem>
                  <MenuItem value="doctor">Tiến sĩ</MenuItem>
                </Select>
              </FormControl>
            </Stack>

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
              <TextField
                fullWidth
                label="Mã quốc gia"
                value={formData.national_code}
                onChange={(e) => handleInputChange('national_code', e.target.value)}
                placeholder="VD: 7480101"
              />
              
              <TextField
                fullWidth
                label="Slug"
                value={formData.slug}
                onChange={(e) => handleInputChange('slug', e.target.value)}
                placeholder="VD: cong-nghe-thong-tin"
              />
            </Stack>

            <FormControlLabel
              control={
                <Switch
                  checked={formData.is_moet_standard}
                  onChange={(e) => handleInputChange('is_moet_standard', e.target.checked)}
                />
              }
              label="Chuẩn MOET"
            />

            {/* Academic Information */}
            <Typography variant="h5" sx={{ mt: 4, mb: 3, fontWeight: 'bold' }}>
              Thông tin đào tạo
            </Typography>

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
              <TextField
                fullWidth
                label="Thời gian đào tạo (năm)"
                type="number"
                value={formData.duration_years}
                onChange={(e) => handleInputChange('duration_years', parseFloat(e.target.value))}
                inputProps={{ min: 0.5, max: 10, step: 0.5 }}
              />
              
              <TextField
                fullWidth
                label="Số học kỳ/năm"
                type="number"
                value={formData.semesters_per_year}
                onChange={(e) => handleInputChange('semesters_per_year', parseInt(e.target.value))}
                inputProps={{ min: 1, max: 4 }}
              />
            </Stack>

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
              <TextField
                fullWidth
                label="Số tín chỉ tối thiểu"
                type="number"
                value={formData.total_credits_min}
                onChange={(e) => handleInputChange('total_credits_min', parseInt(e.target.value))}
                inputProps={{ min: 1, max: 1000 }}
              />
              
              <TextField
                fullWidth
                label="Số tín chỉ tối đa"
                type="number"
                value={formData.total_credits_max}
                onChange={(e) => handleInputChange('total_credits_max', parseInt(e.target.value))}
                inputProps={{ min: 1, max: 1000 }}
              />
            </Stack>

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
              <TextField
                fullWidth
                label="Học kỳ bắt đầu"
                value={formData.start_terms}
                onChange={(e) => handleInputChange('start_terms', e.target.value)}
                placeholder="VD: Fall, Spring"
              />
              
              <TextField
                fullWidth
                label="Chỉ tiêu mặc định"
                type="number"
                value={formData.default_quota}
                onChange={(e) => handleInputChange('default_quota', parseInt(e.target.value))}
                inputProps={{ min: 0 }}
              />
            </Stack>

            {/* Additional Information */}
            <Typography variant="h5" sx={{ mt: 4, mb: 3, fontWeight: 'bold' }}>
              Thông tin bổ sung
            </Typography>

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
              <TextField
                fullWidth
                label="Nhóm ngành"
                value={formData.field_cluster}
                onChange={(e) => handleInputChange('field_cluster', e.target.value)}
              />
              
              <FormControl fullWidth>
                <InputLabel>Mô hình chuyên ngành</InputLabel>
                <Select
                  value={formData.specialization_model}
                  label="Mô hình chuyên ngành"
                  onChange={(e) => handleInputChange('specialization_model', e.target.value)}
                >
                  <MenuItem value="none">Không chuyên ngành</MenuItem>
                  <MenuItem value="major">Có chuyên ngành</MenuItem>
                  <MenuItem value="track">Có hướng chuyên sâu</MenuItem>
                </Select>
              </FormControl>
            </Stack>

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
              <TextField
                fullWidth
                label="Ngày thành lập"
                type="date"
                value={formData.established_at}
                onChange={(e) => handleInputChange('established_at', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
              
              <FormControl fullWidth>
                <InputLabel>Trạng thái</InputLabel>
                <Select
                  value={formData.status}
                  label="Trạng thái"
                  onChange={(e) => handleInputChange('status', e.target.value)}
                >
                  <MenuItem value="draft">Nháp</MenuItem>
                  <MenuItem value="proposed">Đề xuất</MenuItem>
                  <MenuItem value="active">Hoạt động</MenuItem>
                  <MenuItem value="suspended">Tạm dừng</MenuItem>
                  <MenuItem value="closed">Đã đóng</MenuItem>
                </Select>
              </FormControl>
            </Stack>

            <TextField
              fullWidth
              label="Mô tả"
              multiline
              rows={3}
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
            />

            <TextField
              fullWidth
              label="Ghi chú"
              multiline
              rows={2}
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
            />

            {/* Action Buttons */}
            <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 4 }}>
              <Button
                onClick={() => router.back()}
                sx={{ minWidth: 100 }}
              >
                Hủy
              </Button>
              <Button
                variant="contained"
                startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
                onClick={handleSubmit}
                disabled={saving}
                sx={{ minWidth: 150 }}
              >
                {saving ? 'Đang gửi...' : 'Gửi yêu cầu chỉnh sửa'}
              </Button>
            </Stack>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}
