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
  Chip,
  Snackbar,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Skeleton,
  Breadcrumbs,
  Link,
} from '@mui/material';
import {
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  HelpOutline as HelpOutlineIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { 
  MajorDegreeLevel, 
  MajorSpecializationModel, 
  MajorFieldCluster, 
  MajorStartTerm,
  MAJOR_DEGREE_LEVELS,
  MAJOR_SPECIALIZATION_MODELS,
  MAJOR_FIELD_CLUSTERS,
  MAJOR_START_TERMS,
  getMajorDegreeLevelLabel,
  getMajorSpecializationModelLabel,
  getMajorFieldClusterLabel,
  getMajorStartTermLabel,
  getMajorStatusLabel,
  getMajorStatusColor
} from '@/constants/majors';

interface OrgUnit {
  id: number;
  name: string;
  code: string;
  type: string;
  parent_id?: number | null;
}

interface MajorFormData {
  code: string;
  name_vi: string;
  name_en: string;
  short_name: string;
  slug: string;
  national_code: string;
  is_moet_standard: boolean;
  degree_level: MajorDegreeLevel;
  field_cluster: MajorFieldCluster;
  specialization_model: MajorSpecializationModel;
  org_unit_id: number;
  parent_major_id: number | null;
  duration_years: number;
  total_credits_min: number;
  total_credits_max: number;
  semesters_per_year: number;
  start_terms: MajorStartTerm;
  default_quota: number;
  status: string;
  established_at: string;
  closed_at: string;
  description: string;
  notes: string;
}

export default function CreateMajorPage(): JSX.Element {
  const router = useRouter();

  // State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orgUnits, setOrgUnits] = useState<OrgUnit[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [redirecting, setRedirecting] = useState(false);
  const [helpDialogOpen, setHelpDialogOpen] = useState(false);

  // Form data
  const [formData, setFormData] = useState<MajorFormData>({
    code: '',
    name_vi: '',
    name_en: '',
    short_name: '',
    slug: '',
    national_code: '',
    is_moet_standard: false,
    degree_level: MajorDegreeLevel.BACHELOR,
    field_cluster: MajorFieldCluster.CNTT,
    specialization_model: MajorSpecializationModel.NONE,
    org_unit_id: 0,
    parent_major_id: null,
    duration_years: 4,
    total_credits_min: 120,
    total_credits_max: 150,
    semesters_per_year: 2,
    start_terms: MajorStartTerm.FALL,
    default_quota: 100,
    status: 'DRAFT',
    established_at: '',
    closed_at: '',
    description: '',
    notes: '',
  });

  // Fetch org units
  const fetchOrgUnits = async () => {
    try {
      const response = await fetch('/api/tms/majors/org-units');
      const result = await response.json();
      
      if (result.success) {
        setOrgUnits(Array.isArray(result.data) ? result.data : []);
      } else {
        setOrgUnits([]);
        setError('Không thể tải danh sách đơn vị');
      }
    } catch (err) {
      setOrgUnits([]);
      setError('Lỗi khi tải danh sách đơn vị');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrgUnits();
  }, []);

  const handleInputChange = (field: keyof MajorFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async () => {
    setSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/tms/majors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        setSuccessMessage('Tạo ngành đào tạo thành công!');
        setTimeout(() => {
          setRedirecting(true);
          router.push('/tms/majors');
        }, 2000);
      } else {
        setError(result.details || result.error || 'Có lỗi xảy ra khi tạo ngành đào tạo');
      }
    } catch (err) {
      setError('Có lỗi xảy ra khi tạo ngành đào tạo');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', backgroundColor: '#f8fafc', py: 2, px: 2 }}>
        <Stack spacing={2}>
          <Skeleton variant="rectangular" height={120} />
          <Skeleton variant="rectangular" height={80} />
          <Skeleton variant="rectangular" height={400} />
        </Stack>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f8fafc', py: 2, px: 2 }}>
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
          href="/tms/majors"
          sx={{ textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
        >
          Ngành đào tạo
        </Link>
        <Typography color="text.primary">Tạo mới</Typography>
      </Breadcrumbs>

      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Button startIcon={<ArrowBackIcon />} onClick={() => router.back()}>
            Quay lại
          </Button>
          <Typography variant="h4" component="h1">
            Tạo ngành đào tạo mới
          </Typography>
        </Stack>
        <Button
          variant="outlined"
          startIcon={<HelpOutlineIcon />}
          onClick={() => setHelpDialogOpen(true)}
        >
          Hướng dẫn
        </Button>
      </Stack>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Stack direction={{ xs: 'column', lg: 'row' }} spacing={3}>
        <Box sx={{ flex: 2 }}>
          {/* Basic Information */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Thông tin cơ bản
            </Typography>
            <Stack spacing={2}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  fullWidth
                  label="Mã ngành *"
                  value={formData.code}
                  onChange={(e) => handleInputChange('code', e.target.value)}
                  placeholder="VD: CNTT"
                  required
                />
                
                <TextField
                  fullWidth
                  label="Tên ngắn"
                  value={formData.short_name}
                  onChange={(e) => handleInputChange('short_name', e.target.value)}
                  placeholder="VD: CNTT"
                />
              </Stack>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  fullWidth
                  label="Tên tiếng Việt *"
                  value={formData.name_vi}
                  onChange={(e) => handleInputChange('name_vi', e.target.value)}
                  placeholder="VD: Công nghệ thông tin"
                  required
                />
                
                <TextField
                  fullWidth
                  label="Tên tiếng Anh"
                  value={formData.name_en}
                  onChange={(e) => handleInputChange('name_en', e.target.value)}
                  placeholder="VD: Information Technology"
                />
              </Stack>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <FormControl fullWidth>
                  <InputLabel>Đơn vị quản lý *</InputLabel>
                  <Select
                    value={formData.org_unit_id}
                    label="Đơn vị quản lý *"
                    onChange={(e) => handleInputChange('org_unit_id', Number(e.target.value))}
                    required
                  >
                    {Array.isArray(orgUnits) && orgUnits.length > 0 ? (
                      orgUnits.map((unit) => (
                        <MenuItem key={unit.id} value={unit.id}>
                          <Stack direction="row" spacing={1} alignItems="center" sx={{ width: '100%' }}>
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {unit.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {unit.code}
                              </Typography>
                            </Box>
                            <Chip 
                              label={unit.type} 
                              size="small" 
                              color="primary" 
                              variant="outlined"
                              sx={{ fontSize: '0.7rem', height: 20 }}
                            />
                          </Stack>
                        </MenuItem>
                      ))
                    ) : (
                      <MenuItem disabled>
                        {loading ? 'Đang tải...' : 'Không có đơn vị nào'}
                      </MenuItem>
                    )}
                  </Select>
                </FormControl>
                
                <FormControl fullWidth>
                  <InputLabel>Bằng cấp *</InputLabel>
                  <Select
                    value={formData.degree_level}
                    label="Bằng cấp *"
                    onChange={(e) => handleInputChange('degree_level', e.target.value)}
                    required
                  >
                    {MAJOR_DEGREE_LEVELS.map((level) => (
                      <MenuItem key={level} value={level}>
                        {getMajorDegreeLevelLabel(level)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
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
            </Stack>
          </Paper>

          {/* Academic Information */}
          <Paper sx={{ p: 3, mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Thông tin đào tạo
            </Typography>
            <Stack spacing={2}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
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

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
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

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <FormControl fullWidth>
                  <InputLabel>Học kỳ bắt đầu</InputLabel>
                  <Select
                    value={formData.start_terms}
                    label="Học kỳ bắt đầu"
                    onChange={(e) => handleInputChange('start_terms', e.target.value)}
                  >
                    {MAJOR_START_TERMS.map((term) => (
                      <MenuItem key={term} value={term}>
                        {getMajorStartTermLabel(term)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                <TextField
                  fullWidth
                  label="Chỉ tiêu mặc định"
                  type="number"
                  value={formData.default_quota}
                  onChange={(e) => handleInputChange('default_quota', parseInt(e.target.value))}
                  inputProps={{ min: 0 }}
                />
              </Stack>
            </Stack>
          </Paper>

          {/* Additional Information */}
          <Paper sx={{ p: 3, mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Thông tin bổ sung
            </Typography>
            <Stack spacing={2}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <FormControl fullWidth>
                  <InputLabel>Nhóm ngành</InputLabel>
                  <Select
                    value={formData.field_cluster}
                    label="Nhóm ngành"
                    onChange={(e) => handleInputChange('field_cluster', e.target.value)}
                  >
                    <MenuItem value="">Chọn nhóm ngành</MenuItem>
                    {MAJOR_FIELD_CLUSTERS.map((cluster) => (
                      <MenuItem key={cluster} value={cluster}>
                        {getMajorFieldClusterLabel(cluster)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                <FormControl fullWidth>
                  <InputLabel>Mô hình chuyên ngành</InputLabel>
                  <Select
                    value={formData.specialization_model}
                    label="Mô hình chuyên ngành"
                    onChange={(e) => handleInputChange('specialization_model', e.target.value)}
                  >
                    {MAJOR_SPECIALIZATION_MODELS.map((model) => (
                      <MenuItem key={model} value={model}>
                        {getMajorSpecializationModelLabel(model)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
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
                    <MenuItem value="DRAFT">Nháp</MenuItem>
                    <MenuItem value="PROPOSED">Đề xuất</MenuItem>
                    <MenuItem value="REVIEWING">Đang xem xét</MenuItem>
                    <MenuItem value="APPROVED">Đã phê duyệt</MenuItem>
                    <MenuItem value="REJECTED">Bị từ chối</MenuItem>
                    <MenuItem value="PUBLISHED">Đã công bố</MenuItem>
                    <MenuItem value="ACTIVE">Hoạt động</MenuItem>
                    <MenuItem value="SUSPENDED">Tạm dừng</MenuItem>
                    <MenuItem value="CLOSED">Đã đóng</MenuItem>
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
            </Stack>
          </Paper>
        </Box>

        {/* Sidebar */}
        <Box sx={{ flex: 1 }}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Tóm tắt
            </Typography>
            <Stack spacing={1.5}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Mã ngành
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {formData.code || 'Chưa nhập'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Tên ngành
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {formData.name_vi || 'Chưa nhập'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Bằng cấp
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {getMajorDegreeLevelLabel(formData.degree_level)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Thời gian đào tạo
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {formData.duration_years ? `${formData.duration_years} năm` : 'Chưa nhập'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Trạng thái
                </Typography>
                <Chip
                  label={getMajorStatusLabel(formData.status)}
                  color={getMajorStatusColor(formData.status)}
                  size="small"
                />
              </Box>
            </Stack>
          </Paper>

          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Thao tác
            </Typography>
            <Stack spacing={2}>
              <Button
                variant="contained"
                startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
                onClick={handleSubmit}
                disabled={saving}
                fullWidth
              >
                {saving ? 'Đang tạo...' : 'Tạo ngành đào tạo'}
              </Button>
              <Button
                onClick={() => router.back()}
                fullWidth
              >
                Hủy
              </Button>
            </Stack>
          </Paper>
        </Box>
      </Stack>

      {/* Help Dialog */}
      <Dialog 
        open={helpDialogOpen} 
        onClose={() => setHelpDialogOpen(false)} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={1}>
            <InfoIcon color="primary" />
            <Typography variant="h6">Hướng dẫn tạo ngành đào tạo</Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2}>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                Thông tin cơ bản
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • Mã ngành: Mã định danh duy nhất cho ngành đào tạo (VD: CNTT, KT, NN)
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • Tên ngành: Tên đầy đủ của ngành đào tạo bằng tiếng Việt và tiếng Anh
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • Đơn vị quản lý: Khoa/Viện/Bộ môn chịu trách nhiệm quản lý ngành
              </Typography>
            </Box>
            
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                Thông tin đào tạo
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • Thời gian đào tạo: Số năm học (có thể là số thập phân như 4.5 năm)
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • Số tín chỉ: Tối thiểu và tối đa số tín chỉ sinh viên cần tích lũy
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • Học kỳ bắt đầu: Học kỳ mà ngành bắt đầu tuyển sinh
              </Typography>
            </Box>
            
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                Thông tin bổ sung
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • Nhóm ngành: Phân loại ngành theo lĩnh vực (CNTT, Kinh tế, Xã hội...)
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • Mô hình chuyên ngành: Cách tổ chức chuyên ngành (không, track, concentration...)
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • Trạng thái: Trạng thái hiện tại của ngành trong quy trình phê duyệt
              </Typography>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHelpDialogOpen(false)}>Đóng</Button>
        </DialogActions>
      </Dialog>

      {/* Success Snackbar */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={6000}
        onClose={() => setSuccessMessage(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSuccessMessage(null)} 
          severity="success" 
          sx={{ width: '100%' }}
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography>{successMessage}</Typography>
            {redirecting && (
              <>
                <CircularProgress size={16} />
                <Typography variant="caption">Đang chuyển hướng...</Typography>
              </>
            )}
          </Stack>
        </Alert>
      </Snackbar>
    </Box>
  );
}