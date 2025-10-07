'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Stack,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Alert,
  CircularProgress,
  Fade,
} from '@mui/material';
import {
  Edit as EditIcon,
  Info as InfoIcon,
  School as SchoolIcon,
  Description as DescriptionIcon,
} from '@mui/icons-material';
import { useRouter, useParams } from 'next/navigation';
import PageHeader from '@/components/ui/PageHeader';
import ProgressIndicator from '@/components/ui/ProgressIndicator';
import FormContainer from '@/components/ui/FormContainer';
import FormSection from '@/components/ui/FormSection';
import StatusChip from '@/components/ui/StatusChip';

interface OrgUnit {
  id: number;
  name: string;
  code: string;
}

interface MajorFormData {
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
  languages: Array<{ lang: string; level: string }>;
  modalities: Array<{ modality: string; note: string }>;
  accreditations: Array<{
    scheme: string;
    level: string;
    valid_from: string;
    valid_to: string;
    cert_no: string;
    agency: string;
    note: string;
  }>;
}

export default function EditMajorPage() {
  const router = useRouter();
  const params = useParams();
  const majorId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orgUnits, setOrgUnits] = useState<OrgUnit[]>([]);
  
  const [formData, setFormData] = useState<MajorFormData>({
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
    parent_major_id: null,
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
    languages: [{ lang: 'vi', level: 'main' }],
    modalities: [{ modality: 'fulltime', note: '' }],
    accreditations: [],
  });

  // Fetch major data and org units
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch major data
        const majorResponse = await fetch(`/api/tms/majors/${majorId}`);
        const majorData = await majorResponse.json();
        
        if (majorData.success) {
          const major = majorData.data;
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
            org_unit_id: major.org_unit_id || 0,
            parent_major_id: major.parent_major_id || null,
            duration_years: major.duration_years || 4.0,
            total_credits_min: major.total_credits_min || 120,
            total_credits_max: major.total_credits_max || 150,
            semesters_per_year: major.semesters_per_year || 2,
            start_terms: major.start_terms || 'Fall',
            default_quota: major.default_quota || 100,
            status: major.status || 'draft',
            established_at: major.established_at || '',
            closed_at: major.closed_at || '',
            description: major.description || '',
            notes: major.notes || '',
            languages: major.languages || [{ lang: 'vi', level: 'main' }],
            modalities: major.modalities || [{ modality: 'fulltime', note: '' }],
            accreditations: major.accreditations || [],
          });
        } else {
          setError(majorData.error || 'Failed to fetch major');
        }

        // Fetch org units
        const orgResponse = await fetch('/api/tms/majors/org-units');
        const orgData = await orgResponse.json();
        if (orgData.success && Array.isArray(orgData.data)) {
          setOrgUnits(orgData.data);
        } else {
          console.error('Invalid org units data:', orgData);
          setOrgUnits([]);
        }
      } catch (err) {
        setError('Network error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (majorId) {
      fetchData();
    }
  }, [majorId]);

  const getStatusConfig = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return {
          color: 'success',
          label: 'Hoạt động',
          icon: <StatusChip status="active" />,
          bgColor: 'rgba(76, 175, 80, 0.1)',
          textColor: '#2e7d32'
        };
      case 'draft':
        return {
          color: 'default',
          label: 'Nháp',
          icon: <StatusChip status="draft" />,
          bgColor: 'rgba(158, 158, 158, 0.1)',
          textColor: '#616161'
        };
      case 'proposed':
        return {
          color: 'info',
          label: 'Đề xuất',
          icon: <StatusChip status="proposed" />,
          bgColor: 'rgba(33, 150, 243, 0.1)',
          textColor: '#1976d2'
        };
      case 'suspended':
        return {
          color: 'warning',
          label: 'Tạm dừng',
          icon: <StatusChip status="suspended" />,
          bgColor: 'rgba(255, 152, 0, 0.1)',
          textColor: '#f57c00'
        };
      case 'closed':
        return {
          color: 'error',
          label: 'Đã đóng',
          icon: <StatusChip status="closed" />,
          bgColor: 'rgba(244, 67, 54, 0.1)',
          textColor: '#d32f2f'
        };
      default:
        return {
          color: 'default',
          label: status,
          icon: <StatusChip status="draft" />,
          bgColor: 'rgba(158, 158, 158, 0.1)',
          textColor: '#616161'
        };
    }
  };

  const handleInputChange = (field: keyof MajorFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    try {
      setSaving(true);
      setError(null);

      // Validation
      if (!formData.code || !formData.name_vi || !formData.org_unit_id) {
        setError('Vui lòng điền đầy đủ thông tin bắt buộc');
        return;
      }

      const response = await fetch(`/api/tms/majors/${majorId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        router.push(`/tms/majors/${majorId}`);
      } else {
        setError(data.error || 'Failed to update major');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setSaving(false);
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

  const statusConfig = getStatusConfig(formData.status);

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f8fafc', py: 4 }}>
      <Container maxWidth='lg'>
        {/* Header */}
        <PageHeader
          title="Chỉnh sửa ngành đào tạo"
          subtitle={`${formData.name_vi} • ${formData.code}`}
          statusConfig={statusConfig}
          onBack={() => router.back()}
        />

        {/* Progress Indicator */}
        <ProgressIndicator
          title="Chỉnh sửa thông tin ngành đào tạo"
          description="Cập nhật thông tin chi tiết về ngành học"
          icon={<EditIcon />}
          status="Đang chỉnh sửa"
          statusColor="primary"
        />

        {/* Error Alert */}
        {error && (
          <Fade in={true} timeout={300}>
            <Alert 
              severity="error" 
              sx={{ 
                mb: 3, 
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'error.light'
              }} 
              onClose={() => setError(null)}
            >
              {error}
            </Alert>
          </Fade>
        )}

        {/* Form Content */}
        <FormContainer
          onSubmit={handleSubmit}
          onCancel={() => router.back()}
          submitText="Lưu thay đổi"
          cancelText="Hủy"
          loading={saving}
        >
          {/* Basic Information Section */}
          <FormSection
            title="Thông tin cơ bản"
            icon={<InfoIcon />}
            bgColor="primary.light"
            iconColor="primary"
          >
            <TextField
              fullWidth
              label="Mã ngành *"
              value={formData.code}
              onChange={(e) => handleInputChange('code', e.target.value)}
              placeholder="VD: CNTT"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2
                }
              }}
            />
            <TextField
              fullWidth
              label="Tên ngắn"
              value={formData.short_name}
              onChange={(e) => handleInputChange('short_name', e.target.value)}
              placeholder="VD: CNTT"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2
                }
              }}
            />
            <TextField
              fullWidth
              label="Tên tiếng Việt *"
              value={formData.name_vi}
              onChange={(e) => handleInputChange('name_vi', e.target.value)}
              placeholder="VD: Công nghệ thông tin"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2
                }
              }}
            />
            <TextField
              fullWidth
              label="Tên tiếng Anh"
              value={formData.name_en}
              onChange={(e) => handleInputChange('name_en', e.target.value)}
              placeholder="VD: Information Technology"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2
                }
              }}
            />
            <FormControl 
              fullWidth
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2
                }
              }}
            >
              <InputLabel>Đơn vị quản lý *</InputLabel>
              <Select
                value={formData.org_unit_id}
                label="Đơn vị quản lý *"
                onChange={(e) => handleInputChange('org_unit_id', e.target.value)}
              >
                {Array.isArray(orgUnits) && orgUnits.length > 0 ? (
                  orgUnits.map((unit) => (
                    <MenuItem key={unit.id} value={unit.id}>
                      {unit.name} ({unit.code})
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem disabled>
                    {orgUnits.length === 0 ? 'Đang tải đơn vị...' : 'Không có đơn vị nào'}
                  </MenuItem>
                )}
              </Select>
            </FormControl>
            <FormControl 
              fullWidth
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2
                }
              }}
            >
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
            <Box sx={{ gridColumn: '1 / -1' }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_moet_standard}
                    onChange={(e) => handleInputChange('is_moet_standard', e.target.checked)}
                  />
                }
                label="Chuẩn MOET"
              />
            </Box>
          </FormSection>

          {/* Academic Details Section */}
          <FormSection
            title="Thông tin đào tạo"
            icon={<SchoolIcon />}
            bgColor="info.light"
            iconColor="info"
          >
            <TextField
              fullWidth
              label="Thời gian đào tạo (năm)"
              type="number"
              value={formData.duration_years}
              onChange={(e) => handleInputChange('duration_years', parseFloat(e.target.value))}
              inputProps={{ min: 0.5, max: 10, step: 0.5 }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2
                }
              }}
            />
            <TextField
              fullWidth
              label="Số tín chỉ tối thiểu"
              type="number"
              value={formData.total_credits_min}
              onChange={(e) => handleInputChange('total_credits_min', parseInt(e.target.value))}
              inputProps={{ min: 1, max: 1000 }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2
                }
              }}
            />
            <TextField
              fullWidth
              label="Số tín chỉ tối đa"
              type="number"
              value={formData.total_credits_max}
              onChange={(e) => handleInputChange('total_credits_max', parseInt(e.target.value))}
              inputProps={{ min: 1, max: 1000 }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2
                }
              }}
            />
            <TextField
              fullWidth
              label="Chỉ tiêu mặc định"
              type="number"
              value={formData.default_quota}
              onChange={(e) => handleInputChange('default_quota', parseInt(e.target.value))}
              inputProps={{ min: 0 }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2
                }
              }}
            />
            <TextField
              fullWidth
              label="Số học kỳ/năm"
              type="number"
              value={formData.semesters_per_year}
              onChange={(e) => handleInputChange('semesters_per_year', parseInt(e.target.value))}
              inputProps={{ min: 1, max: 4 }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2
                }
              }}
            />
            <TextField
              fullWidth
              label="Học kỳ bắt đầu"
              value={formData.start_terms}
              onChange={(e) => handleInputChange('start_terms', e.target.value)}
              placeholder="VD: Fall, Spring"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2
                }
              }}
            />
          </FormSection>

          {/* Additional Information Section */}
          <FormSection
            title="Thông tin bổ sung"
            icon={<DescriptionIcon />}
            bgColor="secondary.light"
            iconColor="secondary"
            showDivider={false}
          >
            <TextField
              fullWidth
              label="Mã quốc gia"
              value={formData.national_code}
              onChange={(e) => handleInputChange('national_code', e.target.value)}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2
                }
              }}
            />
            <TextField
              fullWidth
              label="Slug"
              value={formData.slug}
              onChange={(e) => handleInputChange('slug', e.target.value)}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2
                }
              }}
            />
            <TextField
              fullWidth
              label="Nhóm ngành"
              value={formData.field_cluster}
              onChange={(e) => handleInputChange('field_cluster', e.target.value)}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2
                }
              }}
            />
            <FormControl 
              fullWidth
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2
                }
              }}
            >
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
            <TextField
              fullWidth
              label="Ngày thành lập"
              type="date"
              value={formData.established_at}
              onChange={(e) => handleInputChange('established_at', e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2
                }
              }}
            />
            <FormControl 
              fullWidth
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2
                }
              }}
            >
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
            <TextField
              fullWidth
              label="Mô tả"
              multiline
              rows={3}
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              sx={{
                gridColumn: '1 / -1',
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2
                }
              }}
            />
            <TextField
              fullWidth
              label="Ghi chú"
              multiline
              rows={2}
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              sx={{
                gridColumn: '1 / -1',
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2
                }
              }}
            />
          </FormSection>
        </FormContainer>
      </Container>
    </Box>
  );
}
