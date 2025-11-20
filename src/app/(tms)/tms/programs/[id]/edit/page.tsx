'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Divider,
  IconButton,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
  Breadcrumbs,
  Link,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { useParams, useRouter } from 'next/navigation';
import {
  PROGRAM_WORKFLOW_STATUS_OPTIONS,
  getProgramStatusColor,
  getProgramStatusLabel,
} from '@/constants/programs';
import {
  OrgUnitApiItem,
  OrgUnitOption,
  ProgramApiResponseItem,
  ProgramFormState,
  ProgramOutcomeFormItem,
  buildProgramPayloadFromForm,
  createDefaultProgramForm,
  createEmptyOutcome,
  mapOrgUnitOptions,
  mapProgramDetail,
  mapProgramDetailToForm,
} from '../../program-utils';

interface ProgramDetailFetchResponse {
  success: boolean;
  data?: ProgramApiResponseItem;
  error?: string;
}

interface ProgramOption {
  id: string;
  code: string;
  nameVi: string;
  totalCredits: number;
}

// PLO templates (same as create page)
const ploTemplates = [
  "Có khả năng áp dụng kiến thức toán học, khoa học tự nhiên và kỹ thuật vào các vấn đề kỹ thuật phức tạp",
  "Có khả năng thiết kế và tiến hành thí nghiệm, phân tích và giải thích dữ liệu",
  "Có khả năng thiết kế hệ thống, thành phần hoặc quy trình đáp ứng các yêu cầu kỹ thuật cụ thể",
  "Có khả năng làm việc hiệu quả trong nhóm đa ngành để giải quyết vấn đề kỹ thuật",
  "Có khả năng xác định, xây dựng và giải quyết các vấn đề kỹ thuật phức tạp",
  "Có khả năng giao tiếp hiệu quả với các đối tượng khác nhau về các vấn đề kỹ thuật",
  "Có khả năng nhận biết và đánh giá tác động của các giải pháp kỹ thuật trong bối cảnh xã hội và môi trường",
  "Có khả năng học tập suốt đời và phát triển nghề nghiệp",
  "Có khả năng sử dụng các kỹ thuật, kỹ năng và công cụ kỹ thuật hiện đại cần thiết cho thực hành kỹ thuật",
  "Có khả năng áp dụng kiến thức về quản lý dự án, tài chính và kinh tế trong các dự án kỹ thuật",
  "Có khả năng phân tích và đánh giá rủi ro trong các dự án kỹ thuật",
  "Có khả năng thiết kế và triển khai các giải pháp bảo mật thông tin",
  "Có khả năng phát triển và triển khai các ứng dụng phần mềm",
  "Có khả năng quản lý và phân tích dữ liệu lớn",
  "Có khả năng thiết kế và triển khai các hệ thống mạng và bảo mật",
  "Có khả năng phát triển các ứng dụng di động và web",
  "Có khả năng làm việc với các công nghệ trí tuệ nhân tạo và machine learning",
  "Có khả năng thiết kế và triển khai các hệ thống IoT",
  "Có khả năng quản lý và tối ưu hóa cơ sở dữ liệu",
  "Có khả năng phát triển và triển khai các giải pháp cloud computing"
];

export default function EditProgramPage(): JSX.Element {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const programId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const [form, setForm] = useState<ProgramFormState>(createDefaultProgramForm());
  const [orgUnits, setOrgUnits] = useState<OrgUnitOption[]>([]);
  const [majors, setMajors] = useState<any[]>([]);
  const [programOptions, setProgramOptions] = useState<ProgramOption[]>([]);
  const [enableCopyStructure, setEnableCopyStructure] = useState(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchOrgUnits = useCallback(async () => {
    try {
      const response = await fetch('/api/tms/faculties?limit=200');
      const result = (await response.json()) as {
        data?: { items?: OrgUnitApiItem[] };
      };

      if (response.ok && result?.data?.items) {
        setOrgUnits(mapOrgUnitOptions(result.data.items));
      }
    } catch (err) {
      console.error('Failed to fetch faculties', err);
    }
  }, []);

  const fetchMajors = useCallback(async (orgUnitId?: string) => {
    try {
      const qs = new URLSearchParams();
      if (orgUnitId) qs.set('org_unit_id', orgUnitId);
      const response = await fetch(`/api/tms/majors?${qs.toString()}`);
      const result = await response.json();

      if (response.ok && result?.success && Array.isArray(result.data?.items)) {
        setMajors(result.data.items.map((item: any) => ({
          id: item.id?.toString?.() ?? '',
          name_vi: item.name_vi,
            code: item.code,
          org_unit_id: item.org_unit_id?.toString?.() ?? (item.OrgUnit?.id?.toString?.() ?? ''),
        })));
      }
    } catch (err) {
      console.error('Failed to fetch majors', err);
    }
  }, []);

  const fetchProgramOptions = useCallback(async () => {
    try {
      const response = await fetch('/api/tms/programs?page=1&limit=100');
      const result = await response.json();

      if (response.ok && result?.success && Array.isArray(result.data?.items)) {
        const mapped: ProgramOption[] = result.data.items
          .filter((item: any) => item.id?.toString() !== programId) // Exclude current program
          .map((item: any) => ({
            id: item.id?.toString() ?? '',
            code: item.code ?? '',
            nameVi: item.name_vi ?? '',
            totalCredits: Number(item.total_credits ?? 0),
          }));
        setProgramOptions(mapped);
      }
    } catch (err) {
      console.error('Failed to fetch programs', err);
    }
  }, [programId]);

  const fetchProgramDetail = useCallback(async () => {
    if (!programId) return;

    try {
      setLoading(true);
      setLoadError(null);

      const response = await fetch(`/api/tms/programs/${programId}`);
      const result = (await response.json()) as ProgramDetailFetchResponse;

      if (!response.ok || !result?.success || !result.data) {
        throw new Error(result?.error || 'Không thể tải thông tin chương trình');
      }

      const detail = mapProgramDetail(result.data);
      setForm(mapProgramDetailToForm(detail));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể tải thông tin chương trình';
      setLoadError(message);
    } finally {
      setLoading(false);
    }
  }, [programId]);

  useEffect(() => {
    fetchOrgUnits();
    fetchProgramOptions();
  }, [fetchOrgUnits, fetchProgramOptions]);

  useEffect(() => {
    fetchProgramDetail();
  }, [fetchProgramDetail]);

  useEffect(() => {
    if (form.orgUnitId) {
      fetchMajors(form.orgUnitId);
    } else {
      setMajors([]);
    }
  }, [form.orgUnitId, fetchMajors]);

  // Sync major with org unit
  useEffect(() => {
    if (!form.orgUnitId) return;
    const ok = majors.some((m: any) => m.id === form.majorId && m.org_unit_id === form.orgUnitId);
    if (!ok && form.majorId) {
      setForm((prev) => ({ ...prev, majorId: '' }));
    }
  }, [form.orgUnitId, form.majorId, majors]);

  const updateForm = <K extends keyof ProgramFormState>(key: K, value: ProgramFormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleAddOutcome = () => {
    setForm((prev) => ({ ...prev, outcomes: [...prev.outcomes, createEmptyOutcome()] }));
  };

  const handleAddOutcomeFromTemplate = (template: string) => {
    const newOutcome = {
      ...createEmptyOutcome(),
      label: template,
    };
    setForm((prev) => ({ ...prev, outcomes: [...prev.outcomes, newOutcome] }));
  };

  const handleOutcomeChange = (id: string, key: keyof ProgramOutcomeFormItem, value: string) => {
    setForm((prev) => ({
      ...prev,
      outcomes: prev.outcomes.map((outcome) =>
        outcome.id === id ? { ...outcome, [key]: value } : outcome,
      ),
    }));
  };

  const handleOutcomeRemove = (id: string) => {
    setForm((prev) => ({
      ...prev,
      outcomes: prev.outcomes.filter((outcome) => outcome.id !== id),
    }));
  };

  const isValid = useMemo(() => Boolean(form.code.trim() && form.nameVi.trim()), [form.code, form.nameVi]);

  const handleSubmit = async () => {
    if (!programId) return;

    if (!isValid) {
      setError('Vui lòng điền đầy đủ Mã chương trình và Tên chương trình.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const payload = buildProgramPayloadFromForm(form);
      const response = await fetch(`/api/tms/programs/${programId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Không thể cập nhật chương trình');
      }

      setSuccessMessage('Đã cập nhật chương trình đào tạo thành công.');
      setTimeout(() => router.push(`/tms/programs/${programId}`), 800);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể cập nhật chương trình';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  if (!programId) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">Không tìm thấy mã chương trình hợp lệ.</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth={false} sx={{ py: 4 }}>
      <Breadcrumbs sx={{ mb: 3 }}>
        <Link href="/tms/programs" color="inherit">
          Chương trình đào tạo
        </Link>
        <Link href={`/tms/programs/${programId}`} color="inherit">
          Chi tiết chương trình
        </Link>
        <Typography color="text.primary">
          Chỉnh sửa
        </Typography>
      </Breadcrumbs>
      
      <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1">
          Chỉnh sửa chương trình đào tạo
        </Typography>
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            onClick={() => router.push(`/tms/programs/${programId}`)}
          >
            Hủy bỏ
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSubmit}
            disabled={saving || loading}
          >
            {saving ? 'Đang lưu...' : 'Cập nhật chương trình'}
          </Button>
        </Stack>
      </Stack>

      {loadError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {loadError}
        </Alert>
      )}

      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMessage(null)}>
          {successMessage}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Stack direction={{ xs: 'column', lg: 'row' }} spacing={3}>
          <Box sx={{ flex: 2 }}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Thông tin cơ bản
              </Typography>
              <Stack spacing={2}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  label="Mã chương trình *"
                  value={form.code}
                  onChange={(event) => updateForm('code', event.target.value.toUpperCase())}
                    required
                  fullWidth
                />
                  <TextField
                    label="Phiên bản"
                    value={form.version}
                    onChange={(event) => updateForm('version', event.target.value)}
                    fullWidth
                  />
                </Stack>
                <TextField
                  label="Tên chương trình (Tiếng Việt) *"
                  value={form.nameVi}
                  onChange={(event) => updateForm('nameVi', event.target.value)}
                  required
                  fullWidth
                />
                <TextField
                  label="Tên chương trình (Tiếng Anh)"
                  value={form.nameEn}
                  onChange={(event) => updateForm('nameEn', event.target.value)}
                  fullWidth
                />
                <TextField
                  label="Mô tả"
                  value={form.description}
                  onChange={(event) => updateForm('description', event.target.value)}
                  multiline
                  minRows={3}
                  fullWidth
                />
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <TextField
                    label="Tổng số tín chỉ"
                    type="number"
                    inputProps={{ min: 0 }}
                    value={form.totalCredits}
                    onChange={(event) => updateForm('totalCredits', Number(event.target.value) || 0)}
                    fullWidth
                  />
                  <Select
                    value={form.orgUnitId}
                    onChange={(event) => updateForm('orgUnitId', event.target.value)}
                    displayEmpty
                    fullWidth
                    renderValue={(value) => {
                      if (!value) {
                        return <span style={{ color: '#9e9e9e' }}>Chọn đơn vị quản lý</span>;
                      }
                      const unit = orgUnits.find((item) => item.id === value);
                      return unit?.label ?? value;
                    }}
                  >
                    <MenuItem value="">
                      <em>Chọn đơn vị quản lý</em>
                    </MenuItem>
                    {orgUnits.map((unit) => (
                      <MenuItem key={unit.id} value={unit.id}>
                        {unit.label}
                      </MenuItem>
                    ))}
                  </Select>
                </Stack>
                <Select
                    value={form.majorId}
                    onChange={(event) => updateForm('majorId', event.target.value)}
                  displayEmpty
                    fullWidth
                  renderValue={(value) => {
                    if (!value) {
                      return <span style={{ color: '#9e9e9e' }}>Chọn ngành đào tạo (lọc theo đơn vị)</span>;
                    }
                    const major = majors.find((item: any) => item.id === value);
                    return major ? `${major.code} - ${major.name_vi}` : value;
                  }}
                  disabled={!form.orgUnitId}
                >
                  <MenuItem value="">
                    <em>Chọn ngành đào tạo (tùy chọn)</em>
                  </MenuItem>
                  {majors
                    .filter((m: any) => !form.orgUnitId || m.org_unit_id === form.orgUnitId)
                    .map((major: any) => (
                      <MenuItem key={major.id} value={major.id}>
                        {major.code} - {major.name_vi}
                      </MenuItem>
                    ))}
                          </Select>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={!!form.applyDefaultFramework}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        if (e.target.checked) {
                          setEnableCopyStructure(false);
                          updateForm('copyFromProgramId', '');
                        }
                        updateForm('applyDefaultFramework', e.target.checked);
                      }}
                    />
                  }
                  label="Áp dụng khung chuẩn"
                />
                <Stack spacing={2}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={enableCopyStructure}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          setEnableCopyStructure(e.target.checked);
                          if (e.target.checked) {
                            updateForm('applyDefaultFramework', false);
                          } else {
                            updateForm('copyFromProgramId', '');
                          }
                        }}
                      />
                    }
                    label="Sao chép cấu trúc CTĐT"
                  />
                  {enableCopyStructure && (
                          <Select
                      value={form.copyFromProgramId || ''}
                      onChange={(event) => updateForm('copyFromProgramId', event.target.value)}
                      displayEmpty
                      fullWidth
                      renderValue={(value) => {
                        if (!value) {
                          return <span style={{ color: '#9e9e9e' }}>Chọn chương trình đào tạo để sao chép</span>;
                        }
                        const program = programOptions.find((p) => p.id === value);
                        return program ? `${program.code} - ${program.nameVi} (${program.totalCredits} TC)` : value;
                      }}
                    >
                      <MenuItem value="">
                        <em>Chọn chương trình đào tạo</em>
                      </MenuItem>
                      {programOptions.map((program) => (
                        <MenuItem key={program.id} value={program.id}>
                          {program.code} - {program.nameVi} ({program.totalCredits} TC)
                              </MenuItem>
                            ))}
                          </Select>
                  )}
                        </Stack>
                                  </Stack>
                                </Paper>

            <Paper sx={{ p: 3, mt: 3 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Typography variant="h6">Chuẩn đầu ra chương trình</Typography>
                <Button startIcon={<AddIcon />} onClick={handleAddOutcome}>
                  Thêm chuẩn đầu ra
                        </Button>
                        </Stack>

              {/* PLO Templates */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Mẫu chuẩn đầu ra có sẵn:
                            </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {ploTemplates.slice(0, 10).map((template, index) => (
                                          <Chip 
                      key={index}
                      label={`PLO ${index + 1}`}
                      onClick={() => handleAddOutcomeFromTemplate(template)}
                                            variant="outlined" 
                                            size="small"
                      sx={{ mb: 1 }}
                    />
                  ))}
                                    </Stack>
                                        <Button
                                          size="small"
                  onClick={() => {
                    ploTemplates.slice(10).forEach(template => {
                      handleAddOutcomeFromTemplate(template);
                    });
                  }}
                  sx={{ mt: 1 }}
                >
                  Thêm tất cả mẫu
                                        </Button>
              </Box>
              
              {form.outcomes.length === 0 && (
                <Alert severity="info">Chưa có chuẩn đầu ra nào. Thêm mới để mô tả PLO.</Alert>
              )}
                                              <Stack spacing={2}>
                {form.outcomes.map((outcome) => (
                  <Paper key={outcome.id} variant="outlined" sx={{ p: 2 }}>
                    <Stack spacing={1}>
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'stretch', sm: 'center' }}>
                                                  <Select
                          value={outcome.category}
                          onChange={(event) => handleOutcomeChange(outcome.id, 'category', event.target.value)}
                          sx={{ minWidth: 160 }}
                        >
                          <MenuItem value="general">Chuẩn chung</MenuItem>
                          <MenuItem value="specific">Chuẩn cụ thể</MenuItem>
                                                  </Select>
                        <Box sx={{ flexGrow: 1 }}>
                                                  <TextField
                            value={outcome.label}
                            onChange={(event) => handleOutcomeChange(outcome.id, 'label', event.target.value)}
                            placeholder="Mô tả chuẩn đầu ra"
                            fullWidth
                            multiline
                            rows={1}
                          />
                        </Box>
                        <IconButton color="error" onClick={() => handleOutcomeRemove(outcome.id)}>
                                                    <DeleteIcon />
                                                  </IconButton>
                                                </Stack>
                                              </Stack>
                                            </Paper>
                                          ))}
              </Stack>
            </Paper>
          </Box>

          <Box sx={{ flex: 1 }}>
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Thiết lập phê duyệt
              </Typography>
              <Stack spacing={2}>
                <Select
                  value={form.status}
                  onChange={(event) => updateForm('status', event.target.value as string)}
                  fullWidth
                >
                  {PROGRAM_WORKFLOW_STATUS_OPTIONS.map((status) => (
                    <MenuItem key={status.value} value={status.value}>
                      {status.label}
                    </MenuItem>
                  ))}
                </Select>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="body2" color="text.secondary">
                    Trạng thái hiện tại:
                  </Typography>
                  <Chip
                    label={getProgramStatusLabel(form.status)}
                    color={getProgramStatusColor(form.status)}
                    size="small"
                  />
                </Stack>
                <TextField
                  label="Hiệu lực từ"
                  type="date"
                  value={form.effectiveFrom}
                  onChange={(event) => updateForm('effectiveFrom', event.target.value)}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  label="Hiệu lực đến"
                  type="date"
                  value={form.effectiveTo}
                  onChange={(event) => updateForm('effectiveTo', event.target.value)}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Stack>
            </Paper>

            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Tóm tắt
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Stack spacing={1.5}>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    Mã chương trình
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {form.code || '—'}
                  </Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    Tên chương trình
                  </Typography>
                  <Typography variant="body2" fontWeight="medium" sx={{ maxWidth: '55%', textAlign: 'right' }}>
                    {form.nameVi || '—'}
                  </Typography>
                </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">
                  Tổng tín chỉ
                </Typography>
                <Typography variant="body2" fontWeight="medium">
                  {form.totalCredits || 0}
                </Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">
                  Chuẩn đầu ra
                </Typography>
                <Typography variant="body2" fontWeight="medium">
                  {form.outcomes.length}
                </Typography>
              </Stack>
            </Stack>
            </Paper>
          </Box>
        </Stack>
      )}
    </Container>
  );
}
