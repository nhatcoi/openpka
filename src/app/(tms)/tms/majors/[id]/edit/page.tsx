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
  IconButton,
  Alert,
  CircularProgress,
  Button,
  Paper,
  Stack,
  Chip,
  Snackbar,
  Skeleton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useRouter, useParams } from 'next/navigation';
import {
  MajorDegreeLevel,
  MajorFieldCluster,
  MAJOR_DEGREE_LEVELS,
  MAJOR_FIELD_CLUSTERS,
  getMajorDegreeLevelLabel,
  getMajorFieldClusterLabel,
  getMajorStatusLabel,
  getMajorStatusColor
} from '@/constants/majors';
import { WORKFLOW_STATUS_OPTIONS } from '@/constants/workflow-statuses';

interface OrgUnit {
  id: number;
  name: string;
  code: string;
  type: string;
  parent_id?: number | null;
}

interface MajorData {
  id: number;
  code: string;
  name_vi: string;
  name_en: string;
  short_name: string;
  slug: string;
  degree_level: string;
  org_unit_id: number;
  duration_years: number;
  total_credits_min: number;
  total_credits_max: number;
  semesters_per_year: number;
  default_quota: number;
  status: string;
  closed_at: string;
  metadata?: Record<string, any> | null;
}

interface MajorFormData {
  code: string;
  name_vi: string;
  name_en: string;
  short_name: string;
  slug: string;
  degree_level: MajorDegreeLevel;
  org_unit_id: number;
  duration_years: number;
  total_credits_min: number;
  total_credits_max: number;
  semesters_per_year: number;
  default_quota: number;
  status: string;
  closed_at: string;
  metadata: Record<string, any>; // JSONB field for additional information
}

export default function EditMajorPage(): JSX.Element {
  const router = useRouter();
  const params = useParams();
  const majorId = params.id as string;

  // State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [majorData, setMajorData] = useState<MajorData | null>(null);
  const [orgUnits, setOrgUnits] = useState<OrgUnit[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [redirecting, setRedirecting] = useState(false);
  const [customFieldDialogOpen, setCustomFieldDialogOpen] = useState(false);
  const [customFieldKey, setCustomFieldKey] = useState('');
  const [customFieldValue, setCustomFieldValue] = useState('');

  // Form data
  const [formData, setFormData] = useState<MajorFormData>({
    code: '',
    name_vi: '',
    name_en: '',
    short_name: '',
    slug: '',
    degree_level: MajorDegreeLevel.BACHELOR,
    org_unit_id: 0,
    duration_years: 4,
    total_credits_min: 120,
    total_credits_max: 150,
    semesters_per_year: 2,
    default_quota: 100,
    status: 'DRAFT',
    closed_at: '',
    metadata: {
      field_cluster: '',
      established_at: '',
      description: '',
      notes: '',
    },
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

        const major = majorResult.data.data;
        setMajorData(major);

        // Populate form with major data
        const metadata = major.metadata || {};
        setFormData({
          code: major.code || '',
          name_vi: major.name_vi || '',
          name_en: major.name_en || '',
          short_name: major.short_name || '',
          slug: major.slug || '',
          degree_level: major.degree_level || MajorDegreeLevel.BACHELOR,
          org_unit_id: Number(major.org_unit_id) || 0,
          duration_years: Number(major.duration_years) || 4,
          total_credits_min: major.total_credits_min || 120,
          total_credits_max: major.total_credits_max || 150,
          semesters_per_year: major.semesters_per_year || 2,
          default_quota: major.default_quota || 100,
          status: major.status || 'DRAFT',
          closed_at: major.closed_at ? new Date(major.closed_at).toISOString().split('T')[0] : '',
          metadata: {
            field_cluster: metadata.field_cluster || '',
            established_at: metadata.established_at || '',
            description: metadata.description || '',
            notes: metadata.notes || '',
            ...Object.keys(metadata)
              .filter(key => !['field_cluster', 'established_at', 'description', 'notes'].includes(key))
              .reduce((acc, key) => ({ ...acc, [key]: metadata[key] }), {}),
          },
        });

        // Fetch org units
        const orgResponse = await fetch('/api/tms/majors/org-units');
        const orgResult = await orgResponse.json();

        if (orgResult.success) {
          setOrgUnits(Array.isArray(orgResult.data) ? orgResult.data : []);
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
  const handleInputChange = (field: keyof MajorFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleMetadataChange = (key: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      metadata: {
        ...prev.metadata,
        [key]: value
      }
    }));
  };

  const handleAddCustomField = () => {
    setCustomFieldKey('');
    setCustomFieldValue('');
    setCustomFieldDialogOpen(true);
  };

  const handleConfirmCustomField = () => {
    if (!customFieldKey.trim()) {
      setError('Vui lòng nhập tên thông tin');
      return;
    }
    handleMetadataChange(customFieldKey.trim(), customFieldValue);
    setCustomFieldDialogOpen(false);
  };

  const handleRemoveCustomField = (key: string) => {
    setFormData(prev => {
      const newMetadata = { ...prev.metadata };
      delete newMetadata[key];
      return {
        ...prev,
        metadata: newMetadata
      };
    });
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

      // Clean metadata - remove empty values
      const cleanedMetadata: Record<string, any> = {};
      Object.keys(formData.metadata).forEach(key => {
        const value = formData.metadata[key];
        if (value !== null && value !== undefined && value !== '') {
          cleanedMetadata[key] = value;
        }
      });

      const payload = {
        ...formData,
        metadata: Object.keys(cleanedMetadata).length > 0 ? cleanedMetadata : undefined,
      };

      // Submit update request
      const response = await fetch(`/api/tms/majors/${majorId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.success) {
        setSuccessMessage('Cập nhật ngành đào tạo thành công!');
        setTimeout(() => {
          setRedirecting(true);
          router.push(`/tms/majors/${majorId}`);
        }, 2000);
      } else {
        setError(result.details || result.error || 'Không thể cập nhật ngành đào tạo');
      }

    } catch (err) {
      console.error('Error submitting form:', err);
      setError('Lỗi mạng khi cập nhật');
    } finally {
      setSaving(false);
    }
  };

  // Loading state
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

  // Error state
  if (error && !majorData) {
    return (
        <Box sx={{ minHeight: '100vh', backgroundColor: '#f8fafc', py: 2, px: 2 }}>
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
        </Box>
    );
  }

  return (
      <Box sx={{ minHeight: '100vh', backgroundColor: '#f8fafc', py: 2, px: 2 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Button startIcon={<ArrowBackIcon />} onClick={() => router.back()}>
              Quay lại
            </Button>
            <Typography variant="h4" component="h1">
              Chỉnh sửa ngành đào tạo
            </Typography>
          </Stack>
        </Stack>

        {majorData && (
            <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
              {majorData.name_vi} ({majorData.code})
            </Typography>
        )}

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

                <TextField
                    fullWidth
                    label="Slug"
                    value={formData.slug}
                    onChange={(e) => handleInputChange('slug', e.target.value)}
                    placeholder="VD: cong-nghe-thong-tin"
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

                <TextField
                    fullWidth
                    label="Chỉ tiêu"
                    type="number"
                    value={formData.default_quota}
                    onChange={(e) => handleInputChange('default_quota', parseInt(e.target.value))}
                    inputProps={{ min: 0 }}
                />
              </Stack>
            </Paper>

            {/* Status */}
            <Paper sx={{ p: 3, mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                Trạng thái
              </Typography>
              <FormControl fullWidth>
                <InputLabel>Trạng thái</InputLabel>
                <Select
                    value={formData.status}
                    label="Trạng thái"
                    onChange={(e) => handleInputChange('status', e.target.value)}
                >
                  {WORKFLOW_STATUS_OPTIONS.map((status) => (
                    <MenuItem key={status.value} value={status.value}>
                      {status.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Paper>

            {/* Metadata - Additional Information */}
            <Paper sx={{ p: 3, mt: 3 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Typography variant="h6">
                  Thông tin bổ sung
                </Typography>
                <Button
                    startIcon={<AddIcon />}
                    size="small"
                    variant="outlined"
                    onClick={handleAddCustomField}
                >
                  Thêm field
                </Button>
              </Stack>
              <Stack spacing={2}>
                {/* Default fields */}
                <FormControl fullWidth>
                  <InputLabel>Nhóm ngành</InputLabel>
                  <Select
                      value={formData.metadata.field_cluster || ''}
                      label="Nhóm ngành"
                      onChange={(e) => handleMetadataChange('field_cluster', e.target.value)}
                  >
                    <MenuItem value="">Chọn nhóm ngành</MenuItem>
                    {MAJOR_FIELD_CLUSTERS.map((cluster) => (
                        <MenuItem key={cluster} value={cluster}>
                          {getMajorFieldClusterLabel(cluster)}
                        </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <TextField
                    fullWidth
                    label="Ngày thành lập"
                    type="date"
                    value={formData.metadata.established_at || ''}
                    onChange={(e) => handleMetadataChange('established_at', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                />

                <TextField
                    fullWidth
                    label="Mô tả"
                    multiline
                    rows={3}
                    value={formData.metadata.description || ''}
                    onChange={(e) => handleMetadataChange('description', e.target.value)}
                />

                <TextField
                    fullWidth
                    label="Ghi chú"
                    multiline
                    rows={2}
                    value={formData.metadata.notes || ''}
                    onChange={(e) => handleMetadataChange('notes', e.target.value)}
                />

                {/* Custom fields */}
                {Object.keys(formData.metadata)
                    .filter(key => !['field_cluster', 'established_at', 'description', 'notes'].includes(key))
                    .map((key) => (
                        <Box key={key} sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                          <TextField
                              fullWidth
                              label={`Field: ${key}`}
                              value={formData.metadata[key] || ''}
                              onChange={(e) => handleMetadataChange(key, e.target.value)}
                              placeholder="Nhập giá trị"
                          />
                          <IconButton
                              color="error"
                              onClick={() => handleRemoveCustomField(key)}
                              sx={{ mt: 1 }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                    ))}
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
                  {saving ? 'Đang cập nhật...' : 'Cập nhật ngành đào tạo'}
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

        {/* Custom Field Dialog */}
        <Dialog open={customFieldDialogOpen} onClose={() => setCustomFieldDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Thêm thông tin bổ sung</DialogTitle>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              autoFocus
              label="Tên thông tin"
              value={customFieldKey}
              onChange={(e) => setCustomFieldKey(e.target.value)}
              placeholder="Ví dụ: chuẩn kiểm định"
            />
            <TextField
              label="Giá trị"
              value={customFieldValue}
              onChange={(e) => setCustomFieldValue(e.target.value)}
              placeholder="Ví dụ: AUN-QA"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCustomFieldDialogOpen(false)}>Hủy</Button>
            <Button variant="contained" onClick={handleConfirmCustomField}>
              Thêm
            </Button>
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