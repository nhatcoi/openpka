'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Box,
  Container,
  Typography,
  Button,
  TextField,
  Grid,
  Alert,
  CircularProgress,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Paper,
  Stack,
  Chip,
  Snackbar,
  Skeleton,
  Breadcrumbs,
  Link,
} from '@mui/material';
import {
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { 
  CohortIntakeTerm,
  generateCohortCode,
  generateCohortName,
  getAcademicYear,
  COHORT_INTAKE_TERMS,
  COHORT_DEFAULTS,
  COHORT_WORKFLOW_STATUS_OPTIONS
} from '@/constants/cohorts';

interface Major {
  id: string;
  code: string;
  name_vi: string;
  name_en?: string;
  OrgUnit?: {
    id: string;
    name: string;
    code: string;
  };
}

interface Program {
  id: string;
  code: string;
  name_vi: string;
  name_en?: string;
  org_unit_id?: string;
}

interface OrgUnit {
  id: string;
  code: string;
  name: string;
  type?: string;
}

interface CohortFormData {
  code: string;
  name_vi: string;
  name_en: string;
  academic_year: string;
  intake_year: number;
  intake_term: string;
  major_id: string;
  program_id: string;
  org_unit_id: string;
  planned_quota: string;
  actual_quota: string;
  start_date: string;
  expected_graduation_date: string;
  status: string;
  is_active: boolean;
  description: string;
}

export default function EditCohortPage() {
  const router = useRouter();
  const params = useParams();
  const cohortId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [majors, setMajors] = useState<Major[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [orgUnits, setOrgUnits] = useState<OrgUnit[]>([]);

  const [formData, setFormData] = useState<CohortFormData>({
    code: '',
    name_vi: '',
    name_en: '',
    academic_year: '',
    intake_year: new Date().getFullYear(),
    intake_term: COHORT_DEFAULTS.INTAKE_TERM,
    major_id: '',
    program_id: '',
    org_unit_id: '',
    planned_quota: '',
    actual_quota: '',
    start_date: '',
    expected_graduation_date: '',
    status: COHORT_DEFAULTS.STATUS,
    is_active: COHORT_DEFAULTS.IS_ACTIVE,
    description: '',
  });

  // Fetch cohort data and dropdown data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch cohort data
        const cohortRes = await fetch(`/api/cohorts/${cohortId}`);
        if (!cohortRes.ok) {
          throw new Error('Không thể tải thông tin khóa học');
        }
        const cohortData = await cohortRes.json();
        
        // Set form data from cohort
        const cohort = cohortData.cohort;
        setFormData({
          code: cohort.code || '',
          name_vi: cohort.name_vi || '',
          name_en: cohort.name_en || '',
          academic_year: cohort.academic_year || '',
          intake_year: cohort.intake_year || new Date().getFullYear(),
          intake_term: cohort.intake_term || COHORT_DEFAULTS.INTAKE_TERM,
          major_id: cohort.major_id || '',
          program_id: cohort.program_id || '',
          org_unit_id: cohort.org_unit_id || '',
          planned_quota: cohort.planned_quota?.toString() || '',
          actual_quota: cohort.actual_quota?.toString() || '',
          start_date: cohort.start_date || '',
          expected_graduation_date: cohort.expected_graduation_date || '',
          status: cohort.status || COHORT_DEFAULTS.STATUS,
          is_active: cohort.is_active ?? COHORT_DEFAULTS.IS_ACTIVE,
          description: cohort.description || '',
        });

        // Fetch dropdown data
        const [majorsRes, orgUnitsRes] = await Promise.all([
          fetch('/api/tms/majors'),
          fetch('/api/org/units?status=ACTIVE'),
        ]);

        // Process majors data
        if (majorsRes.ok) {
          const majorsData = await majorsRes.json();
          if (majorsData.success && majorsData.data?.items) {
            setMajors(majorsData.data.items);
          }
        }

        // Process org units data
        if (orgUnitsRes.ok) {
          const orgUnitsData = await orgUnitsRes.json();
          if (orgUnitsData.success && orgUnitsData.data?.items) {
            setOrgUnits(orgUnitsData.data.items);
          } else if (orgUnitsData.success && Array.isArray(orgUnitsData.data)) {
            setOrgUnits(orgUnitsData.data);
          }
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Không thể tải dữ liệu');
      } finally {
        setLoading(false);
      }
    };

    if (cohortId) {
      fetchData();
    }
  }, [cohortId]);

  // Fetch all programs initially
  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        const response = await fetch('/api/tms/programs/list?limit=100');
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data?.items) {
            setPrograms(data.data.items);
          }
        }
      } catch (err) {
        console.error('Error fetching programs:', err);
      }
    };

    fetchPrograms();
  }, []);

  // Auto-generate code and name when intake year or term changes
  useEffect(() => {
    if (formData.intake_year && formData.intake_term) {
      const generatedCode = generateCohortCode(formData.intake_year, formData.intake_term);
      const generatedName = generateCohortName(formData.intake_year, formData.intake_term);
      const academicYear = getAcademicYear(formData.intake_year);

      setFormData(prev => ({
        ...prev,
        code: generatedCode,
        name_vi: generatedName,
        academic_year: academicYear,
      }));
    }
  }, [formData.intake_year, formData.intake_term]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      // No need to reset program when other fields change
      
      return newData;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const submitData = {
        ...formData,
        planned_quota: formData.planned_quota ? parseInt(formData.planned_quota) : null,
        actual_quota: formData.actual_quota ? parseInt(formData.actual_quota) : null,
        major_id: formData.major_id || null,
        program_id: formData.program_id || null,
        org_unit_id: formData.org_unit_id || null,
      };

      const response = await fetch(`/api/cohorts/${cohortId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Không thể cập nhật khóa học');
      }

      setSuccessMessage('Cập nhật khóa học thành công!');
      
      setTimeout(() => {
        router.push(`/tms/cohorts/${cohortId}`);
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth={false} sx={{ py: 4, px: 2 }}>
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
          <Skeleton variant="rectangular" width={120} height={36} />
          <Skeleton variant="text" width={300} height={40} />
        </Stack>
        <Paper sx={{ p: 3 }}>
          <Skeleton variant="text" width={200} height={32} sx={{ mb: 2 }} />
          <Stack spacing={2}>
            <Skeleton variant="rectangular" height={56} />
            <Skeleton variant="rectangular" height={56} />
            <Skeleton variant="rectangular" height={56} />
          </Stack>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth={false} sx={{ py: 4, px: 1 }}>
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link
          color="inherit"
          href="/tms"
          sx={{ textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
        >
          TMS
        </Link>
        <Link
          color="inherit"
          href="/tms/cohorts"
          sx={{ textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
        >
          Khóa học
        </Link>
        <Link
          color="inherit"
          href={`/tms/cohorts/${cohortId}`}
          sx={{ textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
        >
          Chi tiết
        </Link>
        <Typography color="text.primary">Chỉnh sửa</Typography>
      </Breadcrumbs>

      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => router.back()}>
          Quay lại
        </Button>
        <Typography variant="h4" component="h1">
          Chỉnh sửa khóa học
        </Typography>
      </Stack>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Box>
        <form onSubmit={handleSubmit}>
            {/* Basic Information */}
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Thông tin cơ bản
              </Typography>
              <Stack spacing={2}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <TextField
                    fullWidth
                    label="Mã khóa học *"
                    value={formData.code}
                    onChange={(e) => handleInputChange('code', e.target.value)}
                    required
                    helperText="Mã khóa học sẽ được tự động tạo dựa trên năm và học kỳ"
                  />
                  
                  <TextField
                    fullWidth
                    label="Năm học *"
                    value={formData.academic_year}
                    onChange={(e) => handleInputChange('academic_year', e.target.value)}
                    required
                    helperText="VD: 2024-2025"
                  />
                </Stack>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <TextField
                    fullWidth
                    label="Tên khóa học (Tiếng Việt) *"
                    value={formData.name_vi}
                    onChange={(e) => handleInputChange('name_vi', e.target.value)}
                    required
                  />
                  
                  <TextField
                    fullWidth
                    label="Tên khóa học (Tiếng Anh)"
                    value={formData.name_en}
                    onChange={(e) => handleInputChange('name_en', e.target.value)}
                  />
                </Stack>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <TextField
                    fullWidth
                    label="Năm tuyển sinh *"
                    type="number"
                    value={formData.intake_year}
                    onChange={(e) => handleInputChange('intake_year', parseInt(e.target.value))}
                    required
                    inputProps={{ min: 2020, max: 2030 }}
                  />
                  
                  <FormControl fullWidth required>
                    <InputLabel>Học kỳ tuyển sinh *</InputLabel>
                    <Select
                      value={formData.intake_term}
                      onChange={(e) => handleInputChange('intake_term', e.target.value)}
                      label="Học kỳ tuyển sinh *"
                    >
                      {COHORT_INTAKE_TERMS.map((term) => (
                        <MenuItem key={term} value={term}>
                          {term}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Stack>
              </Stack>
            </Paper>

            {/* Academic Information */}
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Thông tin học thuật
              </Typography>
              <Stack spacing={2}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <FormControl fullWidth>
                    <InputLabel>Ngành đào tạo</InputLabel>
                    <Select
                      value={formData.major_id}
                      onChange={(e) => handleInputChange('major_id', e.target.value)}
                      label="Ngành đào tạo"
                    >
                      {majors.map((major) => (
                        <MenuItem key={major.id} value={major.id}>
                          <Box sx={{ width: '100%' }}>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {major.name_vi}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {major.code}
                            </Typography>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl fullWidth>
                    <InputLabel>Chương trình đào tạo</InputLabel>
                    <Select
                      value={formData.program_id}
                      onChange={(e) => handleInputChange('program_id', e.target.value)}
                      label="Chương trình đào tạo"
                      disabled={false}
                    >
                      {programs.map((program) => (
                        <MenuItem key={program.id} value={program.id}>
                          <Box sx={{ width: '100%' }}>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {program.name_vi}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {program.code}
                            </Typography>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Stack>

                <FormControl fullWidth>
                  <InputLabel>Đơn vị quản lý</InputLabel>
                  <Select
                    value={formData.org_unit_id}
                    onChange={(e) => handleInputChange('org_unit_id', e.target.value)}
                    label="Đơn vị quản lý"
                  >
                    {orgUnits.map((unit) => (
                      <MenuItem key={unit.id} value={unit.id}>
                        <Box sx={{ width: '100%' }}>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {unit.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {unit.code} {unit.type && `(${unit.type})`}
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>
            </Paper>

            {/* Quota Information */}
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Thông tin chỉ tiêu
              </Typography>
              <Stack spacing={2}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <TextField
                    fullWidth
                    label="Chỉ tiêu dự kiến"
                    type="number"
                    value={formData.planned_quota}
                    onChange={(e) => handleInputChange('planned_quota', e.target.value)}
                    inputProps={{ min: 0 }}
                  />
                  
                  <TextField
                    fullWidth
                    label="Chỉ tiêu thực tế"
                    type="number"
                    value={formData.actual_quota}
                    onChange={(e) => handleInputChange('actual_quota', e.target.value)}
                    inputProps={{ min: 0 }}
                  />
                </Stack>
              </Stack>
            </Paper>

            {/* Timeline Information */}
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Thông tin thời gian
              </Typography>
              <Stack spacing={2}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <TextField
                    fullWidth
                    label="Ngày bắt đầu học"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => handleInputChange('start_date', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                  
                  <TextField
                    fullWidth
                    label="Ngày dự kiến tốt nghiệp"
                    type="date"
                    value={formData.expected_graduation_date}
                    onChange={(e) => handleInputChange('expected_graduation_date', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Stack>
              </Stack>
            </Paper>

            {/* Status and Description */}
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Trạng thái và mô tả
              </Typography>
              <Stack spacing={2}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <FormControl fullWidth>
                    <InputLabel>Trạng thái</InputLabel>
                    <Select
                      value={formData.status}
                      onChange={(e) => handleInputChange('status', e.target.value)}
                      label="Trạng thái"
                    >
                      {COHORT_WORKFLOW_STATUS_OPTIONS.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Stack>

                <TextField
                  fullWidth
                  label="Mô tả"
                  multiline
                  rows={4}
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Nhập mô tả về khóa học..."
                />
              </Stack>
            </Paper>

            {/* Actions */}
            <Paper sx={{ p: 3 }}>
              <Stack direction="row" spacing={2} justifyContent="flex-end">
                <Button
                  variant="outlined"
                  onClick={() => router.back()}
                  disabled={saving}
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
                  disabled={saving}
                >
                  {saving ? 'Đang cập nhật...' : 'Cập nhật khóa học'}
                </Button>
              </Stack>
            </Paper>
        </form>
      </Box>

      {/* Success Snackbar */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={3000}
        onClose={() => setSuccessMessage(null)}
        message={successMessage}
      />
    </Container>
  );
}