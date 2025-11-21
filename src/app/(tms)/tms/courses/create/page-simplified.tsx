'use client';

import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Chip,
  Autocomplete,
  Alert,
  Breadcrumbs,
  Link,
  Grid
} from '@mui/material';
import {
  School as SchoolIcon,
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import {
  COURSE_TYPES,
  CourseType,
  getCourseTypeLabel,
} from '@/constants/courses';
import { API_ROUTES } from '@/constants/routes';

interface FormData {
  code: string;
  nameVi: string;
  nameEn: string;
  credits: number;
  theory_credit?: number;
  practical_credit?: number;
  orgUnitId: string;
  type: CourseType;
  description: string;
  prerequisites: (string | {id: string, code: string, name_vi: string, name_en: string, credits: number, status: string, label: string, value: string})[];
}

const courseTypeOptions = COURSE_TYPES.map((type) => ({
  value: type,
  label: getCourseTypeLabel(type),
}));

export default function CreateCoursePage() {
  const router = useRouter();
  const [orgUnits, setOrgUnits] = useState<Array<{id: string, name: string, code: string}>>([]);
  const [courseOptions, setCourseOptions] = useState<Array<{id: string, code: string, name_vi: string, name_en: string, credits: number, status: string, label: string, value: string}>>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<FormData>({
    code: '',
    nameVi: '',
    nameEn: '',
    credits: 0,
    theory_credit: undefined,
    practical_credit: undefined,
    orgUnitId: '',
    type: CourseType.THEORY,
    description: '',
    prerequisites: []
  });

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.code.trim()) {
      newErrors.code = 'Vui lòng nhập mã môn học';
    }
    if (!formData.nameVi.trim()) {
      newErrors.nameVi = 'Vui lòng nhập tên môn học';
    }
    if (!formData.orgUnitId) {
      newErrors.orgUnitId = 'Vui lòng chọn đơn vị tổ chức';
    }
    if (!formData.type) {
      newErrors.type = 'Vui lòng chọn loại môn học';
    }
    if (!formData.credits || formData.credits <= 0) {
      newErrors.credits = 'Số tín chỉ phải lớn hơn 0';
    }
    
    const theoryNum = formData.theory_credit || 0;
    const practicalNum = formData.practical_credit || 0;
    if (theoryNum + practicalNum > formData.credits) {
      newErrors.creditDistribution = `Tổng tín chỉ lý thuyết (${theoryNum}) + thực hành (${practicalNum}) = ${theoryNum + practicalNum} vượt quá tổng tín chỉ (${formData.credits})`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (saveAsDraft: boolean = false) => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      
      const courseData = {
        code: formData.code,
        name_vi: formData.nameVi,
        name_en: formData.nameEn || undefined,
        credits: formData.credits,
        theory_credit: formData.theory_credit,
        practical_credit: formData.practical_credit,
        org_unit_id: parseInt(formData.orgUnitId),
        type: formData.type,
        description: formData.description || undefined,
        prerequisites: formData.prerequisites || [],
      };

      const response = await fetch(API_ROUTES.TMS.COURSES, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(courseData)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save course');
      }

      // Redirect to course detail page
      router.push(`/tms/courses/${result.data.id}`);
    } catch (error: any) {
      console.error('Error saving course:', error);
      alert('Lỗi khi lưu khóa học: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrgUnits = async () => {
    try {
      setLoading(true);
      const response = await fetch(API_ROUTES.TMS.FACULTIES);
      const result = await response.json();
      
      if (result.success && result.data?.items) {
        setOrgUnits(result.data.items);
      }
    } catch (error) {
      console.error('Error fetching orgUnits:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourseOptions = async (searchTerm = '') => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      params.append('limit', '50');
      
      const response = await fetch(`${API_ROUTES.TMS.COURSES_LIST}?${params}`);
      const result = await response.json();
      
      if (result.success && result.data?.items) {
        setCourseOptions(result.data.items);
      }
    } catch (error) {
      console.error('Error fetching course options:', error);
    }
  };

  React.useEffect(() => {
    fetchOrgUnits();
    fetchCourseOptions();
  }, []);

  const updateFormData = (field: keyof FormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[field];
        if (field === 'theory_credit' || field === 'practical_credit') {
          delete next.creditDistribution;
        }
        return next;
      });
    }
  };

  return (
    <Container maxWidth={false} sx={{ py: 4, px: 1 }}>
      <Box sx={{ mb: 4 }}>
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
            href="/tms/courses"
            sx={{ textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
          >
            Học phần
          </Link>
          <Typography color="text.primary">Tạo mới</Typography>
        </Breadcrumbs>
        
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => router.back()}
          sx={{ mb: 2 }}
        >
          Quay lại
        </Button>
        
        <Typography variant="h4" component="h1" gutterBottom>
          <SchoolIcon sx={{ mr: 2, verticalAlign: 'middle' }} />
          Tạo môn học mới
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Điền thông tin cơ bản để tạo môn học mới. Các thông tin chi tiết như đề cương, mục tiêu học tập sẽ được quản lý sau khi tạo môn học.
        </Typography>
      </Box>

      <Paper sx={{ p: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Mã môn học *"
              value={formData.code}
              onChange={(e) => updateFormData('code', e.target.value)}
              placeholder="VD: CS101"
              error={!!errors.code}
              helperText={errors.code}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormControl fullWidth error={!!errors.orgUnitId}>
              <InputLabel>Đơn vị tổ chức *</InputLabel>
              <Select
                value={formData.orgUnitId}
                onChange={(e) => updateFormData('orgUnitId', e.target.value)}
                label="Đơn vị tổ chức *"
              >
                {orgUnits.map((unit) => (
                  <MenuItem key={unit.id} value={unit.id}>
                    {unit.name}
                  </MenuItem>
                ))}
              </Select>
              {errors.orgUnitId && (
                <FormHelperText>{errors.orgUnitId}</FormHelperText>
              )}
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Tên môn học (Tiếng Việt) *"
              value={formData.nameVi}
              onChange={(e) => updateFormData('nameVi', e.target.value)}
              error={!!errors.nameVi}
              helperText={errors.nameVi}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Tên môn học (Tiếng Anh)"
              value={formData.nameEn}
              onChange={(e) => updateFormData('nameEn', e.target.value)}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Số tín chỉ *"
              type="number"
              value={formData.credits}
              onChange={(e) => updateFormData('credits', parseFloat(e.target.value) || 0)}
              inputProps={{ min: 0, max: 10, step: 0.5 }}
              error={!!errors.credits}
              helperText={errors.credits}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Tín chỉ lý thuyết"
              type="number"
              value={formData.theory_credit || ''}
              onChange={(e) => updateFormData('theory_credit', parseFloat(e.target.value) || undefined)}
              inputProps={{ min: 0, max: formData.credits, step: 0.5 }}
              helperText={errors.creditDistribution || `Tối đa ${formData.credits} tín chỉ`}
              error={!!errors.creditDistribution}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Tín chỉ thực hành"
              type="number"
              value={formData.practical_credit || ''}
              onChange={(e) => updateFormData('practical_credit', parseFloat(e.target.value) || undefined)}
              inputProps={{ min: 0, max: formData.credits, step: 0.5 }}
              helperText={errors.creditDistribution || `Tối đa ${formData.credits} tín chỉ`}
              error={!!errors.creditDistribution}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth error={!!errors.type}>
              <InputLabel>Loại môn học *</InputLabel>
              <Select
                value={formData.type}
                onChange={(e) => updateFormData('type', e.target.value as CourseType)}
                label="Loại môn học *"
              >
                {courseTypeOptions.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
              {errors.type && (
                <FormHelperText>{errors.type}</FormHelperText>
              )}
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Mô tả môn học"
              multiline
              rows={4}
              value={formData.description}
              onChange={(e) => updateFormData('description', e.target.value)}
              placeholder="Mô tả tổng quan về môn học, nội dung chính, mục tiêu..."
            />
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>
              Điều kiện tiên quyết
            </Typography>
            <Autocomplete
              multiple
              freeSolo
              options={courseOptions}
              value={formData.prerequisites}
              onChange={(_, newValue) => updateFormData('prerequisites', newValue)}
              onInputChange={(_, newInputValue) => {
                if (newInputValue.length >= 2) {
                  fetchCourseOptions(newInputValue);
                }
              }}
              getOptionLabel={(option) => {
                if (typeof option === 'string') return option;
                return option.label || `${option.code} - ${option.name_vi}`;
              }}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip 
                    variant="outlined" 
                    label={typeof option === 'string' ? option : option.label} 
                    {...getTagProps({ index })} 
                  />
                ))
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Môn học tiên quyết"
                  placeholder="Nhập mã môn học hoặc chọn từ danh sách"
                />
              )}
            />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Nhập mã môn học hoặc chọn từ danh sách gợi ý. Sinh viên phải hoàn thành các môn này trước khi đăng ký môn học này.
            </Typography>
          </Grid>
        </Grid>

        <Alert severity="info" sx={{ mt: 3, mb: 2 }}>
          Sau khi tạo môn học, bạn có thể quản lý đề cương chi tiết, mục tiêu học tập và phương pháp đánh giá trong trang chi tiết môn học.
        </Alert>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
          <Button
            variant="outlined"
            onClick={() => router.back()}
          >
            Hủy
          </Button>
          <Button
            variant="outlined"
            onClick={() => handleSubmit(true)}
            startIcon={<SaveIcon />}
            disabled={loading}
          >
            Lưu nháp
          </Button>
          <Button
            variant="contained"
            onClick={() => handleSubmit(false)}
            startIcon={<CheckCircleIcon />}
            disabled={loading}
          >
            Tạo môn học
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}

