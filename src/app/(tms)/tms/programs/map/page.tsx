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
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Pagination,
  Paper,
  Radio,
  RadioGroup,
  Select,
  SelectChangeEvent,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { ProgramBlockType, getProgramBlockTypeLabel } from '@/constants/programs';

const DEFAULT_PAGE_SIZE = 10;

interface ProgramOption {
  id: string;
  code: string;
  name: string;
  label: string;
}

interface ProgramBlockOption {
  id: string;
  code: string;
  title: string;
  blockType: ProgramBlockType;
}

interface CourseOption {
  id: string;
  code: string;
  name: string;
  credits: number;
  type?: string | null;
}

interface ProgramCourseMapListItem {
  id: string;
  programId: string;
  courseId: string;
  blockId: string | null;
  isRequired: boolean;
  displayOrder: number;
  course: {
    id: string;
    code: string;
    nameVi?: string | null;
    nameEn?: string | null;
    credits?: number | null;
    type?: string | null;
  } | null;
  block: {
    id: string;
    code: string;
    title: string;
  } | null;
}

interface ProgramListApiItem {
  id?: string | number;
  code?: string;
  name_vi?: string;
  name_en?: string;
  label?: string;
}

interface ProgramListApiResponse {
  success: boolean;
  data?: {
    items?: ProgramListApiItem[];
  };
  error?: string;
}

interface ProgramBlockListItem {
  id?: string | number;
  code?: string;
  title?: string;
  blockType?: ProgramBlockType | string;
}

interface ProgramBlockListResponse {
  success: boolean;
  data?: {
    items?: ProgramBlockListItem[];
  };
  error?: string;
}

interface ProgramCourseMapApiItem {
  id?: string | number;
  programId?: string | number;
  courseId?: string | number;
  blockId?: string | number | null;
  isRequired?: boolean;
  displayOrder?: number;
  course?: {
    id?: string | number;
    code?: string;
    nameVi?: string;
    nameEn?: string;
    credits?: number;
    type?: string;
  } | null;
  block?: {
    id?: string | number;
    code?: string;
    title?: string;
  } | null;
}

interface ProgramCourseMapApiResponse {
  success: boolean;
  data?: {
    items?: ProgramCourseMapApiItem[];
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
  error?: string;
}

interface CourseListApiItem {
  id?: string | number;
  code?: string;
  name_vi?: string;
  name_en?: string;
  credits?: number;
  type?: string;
}

interface CourseListApiResponse {
  success: boolean;
  data?: {
    items?: CourseListApiItem[];
  };
  error?: string;
}

interface PaginationState {
  page: number;
  totalPages: number;
  totalItems: number;
}

type FormMode = 'create' | 'edit';

interface MappingFormState {
  programId: string;
  courseId: string;
  blockId: string | null;
  isRequired: boolean;
  displayOrder: number | '';
}

const REQUIRED_OPTIONS = [
  { value: 'all', label: 'Tất cả' },
  { value: 'true', label: 'Bắt buộc' },
  { value: 'false', label: 'Tự chọn' },
];

const REQUIRED_LABEL: Record<string, string> = {
  true: 'Bắt buộc',
  false: 'Tự chọn',
};

export default function ProgramCourseMapPage(): JSX.Element {
  const [programs, setPrograms] = useState<ProgramOption[]>([]);
  const [selectedProgramId, setSelectedProgramId] = useState<string>('');
  const [programBlocks, setProgramBlocks] = useState<ProgramBlockOption[]>([]);

  const [mappings, setMappings] = useState<ProgramCourseMapListItem[]>([]);
  const [pagination, setPagination] = useState<PaginationState>({ page: 1, totalPages: 1, totalItems: 0 });
  const [searchValue, setSearchValue] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBlockId, setSelectedBlockId] = useState<string>('all');
  const [selectedRequired, setSelectedRequired] = useState<string>('all');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<FormMode>('create');
  const [formState, setFormState] = useState<MappingFormState>({
    programId: '',
    courseId: '',
    blockId: null,
    isRequired: true,
    displayOrder: '',
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [editingMapping, setEditingMapping] = useState<ProgramCourseMapListItem | null>(null);

  const [availableCourses, setAvailableCourses] = useState<CourseOption[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);

  const selectedProgram = useMemo(() => programs.find((p) => p.id === selectedProgramId) ?? null, [programs, selectedProgramId]);

  const selectedBlockFilter = useMemo(
      () => (selectedBlockId === 'all' ? null : programBlocks.find((block) => block.id === selectedBlockId) ?? null),
      [programBlocks, selectedBlockId],
  );

  const fetchPrograms = useCallback(async () => {
    try {
      const response = await fetch('/api/tms/programs/list?limit=200');
      const result: ProgramListApiResponse = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Không thể tải danh sách chương trình');
      }

      const items = Array.isArray(result.data?.items) ? result.data?.items : [];
      const options: ProgramOption[] = items.map((item) => ({
        id: item.id?.toString() ?? '',
        code: item.code ?? '—',
        name: item.name_vi ?? item.name_en ?? 'Không xác định',
        label: item.label ?? `${item.code ?? ''} - ${item.name_vi ?? item.name_en ?? ''}`.trim(),
      }));

      setPrograms(options);
      if (!selectedProgramId && options.length > 0) {
        setSelectedProgramId(options[0].id);
      }
    } catch (err) {
      console.error('Failed to load program list', err);
    }
  }, [selectedProgramId]);

  const fetchProgramBlocks = useCallback(async (programId: string) => {
    if (!programId) {
      setProgramBlocks([]);
      return;
    }

    try {
      const params = new URLSearchParams({ programId, limit: '200' });
      const response = await fetch(`/api/tms/program-blocks?${params.toString()}`);
      const result: ProgramBlockListResponse = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Không thể tải khối học phần của chương trình');
      }

      const items = Array.isArray(result.data?.items) ? result.data?.items : [];

      const mapped: ProgramBlockOption[] = items.map((item) => ({
        id: item.id?.toString() ?? '',
        code: item.code ?? '—',
        title: item.title ?? 'Không xác định',
        blockType: (item.blockType ?? ProgramBlockType.CORE) as ProgramBlockType,
      }));

      setProgramBlocks(mapped);
    } catch (err) {
      console.error('Failed to load program blocks', err);
    }
  }, []);

  const fetchMappings = useCallback(async () => {
    if (!selectedProgramId) {
      setMappings([]);
      setPagination((prev) => ({ ...prev, totalItems: 0, totalPages: 1 }));
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: String(DEFAULT_PAGE_SIZE),
        programId: selectedProgramId,
      });

      if (selectedBlockId !== 'all') {
        params.set('blockId', selectedBlockId);
      }

      if (selectedRequired !== 'all') {
        params.set('required', selectedRequired);
      }

      if (searchTerm) {
        params.set('search', searchTerm);
      }

      const response = await fetch(`/api/tms/program-course-map?${params.toString()}`);
      const result: ProgramCourseMapApiResponse = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Không thể tải bản đồ học phần');
      }

      const items = Array.isArray(result.data?.items) ? result.data.items : [];

      const mappedItems: ProgramCourseMapListItem[] = items.map((item) => ({
        id: item.id?.toString() ?? '',
        programId: item.programId?.toString() ?? selectedProgramId,
        courseId: item.courseId?.toString() ?? '',
        blockId: item.blockId != null ? item.blockId.toString() : null,
        isRequired: item.isRequired ?? true,
        displayOrder: item.displayOrder ?? 1,
        course: item.course
            ? {
              id: item.course.id?.toString() ?? '',
              code: item.course.code ?? '—',
              nameVi: item.course.nameVi ?? item.course.nameEn ?? '',
              nameEn: item.course.nameEn ?? '',
              credits: item.course.credits,
              type: item.course.type,
            }
            : null,
        block: item.block
            ? {
              id: item.block.id?.toString() ?? '',
              code: item.block.code ?? '—',
              title: item.block.title ?? 'Không xác định',
            }
            : null,
      }));

      setMappings(mappedItems);
      setPagination((prev) => ({
        ...prev,
        totalPages: result.data?.pagination?.totalPages ?? 1,
        totalItems: result.data?.pagination?.total ?? mappedItems.length,
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Đã xảy ra lỗi khi tải dữ liệu';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, searchTerm, selectedBlockId, selectedProgramId, selectedRequired]);

  const fetchCourses = useCallback(async () => {
    try {
      setLoadingCourses(true);
      const response = await fetch('/api/tms/courses?limit=200&list=true');
      const result: CourseListApiResponse = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Không thể tải danh sách học phần');
      }

      const items = Array.isArray(result.data?.items) ? result.data.items : [];
      const mapped: CourseOption[] = items.map((item) => ({
        id: item.id?.toString() ?? '',
        code: item.code ?? '—',
        name: item.name_vi ?? item.name_en ?? 'Không xác định',
        credits: item.credits ?? 0,
        type: item.type ?? null,
      }));

      setAvailableCourses(mapped);
    } catch (err) {
      console.error('Failed to load courses', err);
    } finally {
      setLoadingCourses(false);
    }
  }, []);

  useEffect(() => {
    fetchPrograms();
  }, [fetchPrograms]);

  useEffect(() => {
    if (selectedProgramId) {
      fetchProgramBlocks(selectedProgramId);
    }
  }, [fetchProgramBlocks, selectedProgramId]);

  useEffect(() => {
    fetchMappings();
  }, [fetchMappings]);

  const handleSearchSubmit = () => {
    setPagination((prev) => ({ ...prev, page: 1 }));
    setSearchTerm(searchValue.trim());
  };

  const handleResetFilters = () => {
    setSearchValue('');
    setSearchTerm('');
    setSelectedBlockId('all');
    setSelectedRequired('all');
    setPagination({ page: 1, totalItems: 0, totalPages: 1 });
  };

  const handleProgramChange = (_event: React.SyntheticEvent, option: ProgramOption | null) => {
    const programId = option?.id ?? '';
    setSelectedProgramId(programId);
    setPagination({ page: 1, totalItems: 0, totalPages: 1 });
    setSelectedBlockId('all');
  };

  const handleBlockFilterChange = (event: SelectChangeEvent<string>) => {
    setSelectedBlockId(event.target.value);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleRequiredFilterChange = (event: SelectChangeEvent<string>) => {
    setSelectedRequired(event.target.value);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (_: React.ChangeEvent<unknown>, newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const openCreateDialog = () => {
    if (!selectedProgramId) {
      setSnackbar({ open: true, message: 'Vui lòng chọn chương trình trước khi thêm học phần.', severity: 'error' });
      return;
    }

    setDialogMode('create');
    setEditingMapping(null);
    setFormError(null);
    setFormState({
      programId: selectedProgramId,
      courseId: '',
      blockId: null,
      isRequired: true,
      displayOrder: pagination.totalItems + 1,
    });
    setDialogOpen(true);
    if (availableCourses.length === 0) {
      fetchCourses();
    }
  };

  const openEditDialog = (mapping: ProgramCourseMapListItem) => {
    setDialogMode('edit');
    setEditingMapping(mapping);
    setFormError(null);
    setFormState({
      programId: mapping.programId,
      courseId: mapping.courseId,
      blockId: mapping.blockId,
      isRequired: mapping.isRequired,
      displayOrder: mapping.displayOrder,
    });
    setDialogOpen(true);
    if (availableCourses.length === 0) {
      fetchCourses();
    }
  };

  const closeDialog = () => {
    if (formSubmitting) return;
    setDialogOpen(false);
    setFormState({ programId: selectedProgramId, courseId: '', blockId: null, isRequired: true, displayOrder: '' });
    setEditingMapping(null);
    setFormError(null);
  };

  const selectedCourse = useMemo(
      () => availableCourses.find((course) => course.id === formState.courseId) ?? null,
      [availableCourses, formState.courseId],
  );

  const mappedCourseIds = useMemo(() => new Set(mappings.map((item) => item.courseId)), [mappings]);

  const courseOptionsForForm = useMemo(() => {
    if (!formState.programId) return [];
    return availableCourses.filter((course) => dialogMode === 'edit' || !mappedCourseIds.has(course.id));
  }, [availableCourses, dialogMode, mappedCourseIds, formState.programId]);

  const isFormValid = useMemo(() => {
    return Boolean(formState.programId && formState.courseId && (formState.displayOrder === '' || Number(formState.displayOrder) > 0));
  }, [formState.courseId, formState.displayOrder, formState.programId]);

  const handleSubmitForm = async () => {
    if (!isFormValid) {
      setFormError('Vui lòng chọn học phần và nhập thứ tự hợp lệ.');
      return;
    }

    setFormSubmitting(true);
    setFormError(null);

    const payload = {
      program_id: formState.programId,
      course_id: formState.courseId,
      block_id: formState.blockId ?? null,
      is_required: formState.isRequired,
      display_order: formState.displayOrder === '' ? undefined : Number(formState.displayOrder),
    };

    try {
      const endpoint = dialogMode === 'edit' && editingMapping ? `/api/tms/program-course-map/${editingMapping.id}` : '/api/tms/program-course-map';
      const method = dialogMode === 'edit' ? 'PUT' : 'POST';

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Không thể lưu bản đồ học phần');
      }

      setSnackbar({
        open: true,
        message: dialogMode === 'edit' ? 'Cập nhật bản đồ học phần thành công' : 'Đã thêm học phần vào chương trình',
        severity: 'success',
      });
      setDialogOpen(false);
      setEditingMapping(null);
      fetchMappings();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể lưu bản đồ học phần';
      setFormError(message);
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDelete = async (mapping: ProgramCourseMapListItem) => {
    const confirmed = window.confirm(`Bạn có chắc chắn muốn xóa học phần "${mapping.course?.code ?? mapping.courseId}" khỏi chương trình này?`);
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/tms/program-course-map/${mapping.id}`, { method: 'DELETE' });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Không thể xóa bản đồ học phần');
      }

      setSnackbar({ open: true, message: 'Đã xóa học phần khỏi chương trình', severity: 'success' });
      fetchMappings();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể xóa bản đồ học phần';
      setSnackbar({ open: true, message, severity: 'error' });
    }
  };

  return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              Bản đồ học phần chương trình
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Quản lý các học phần thuộc chương trình, phân loại theo khối và trạng thái bắt buộc/tự chọn.
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Tooltip title="Làm mới">
            <span>
              <IconButton onClick={fetchMappings} disabled={loading}>
                <RefreshIcon />
              </IconButton>
            </span>
            </Tooltip>
            <Button variant="contained" startIcon={<AddIcon />} onClick={openCreateDialog} disabled={!selectedProgramId}>
              Thêm học phần
            </Button>
          </Stack>
        </Stack>

        <Paper sx={{ p: 3, mb: 3 }}>
          <Stack spacing={2}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ xs: 'stretch', md: 'center' }}>
              <Autocomplete
                  options={programs}
                  value={selectedProgram}
                  onChange={handleProgramChange}
                  getOptionLabel={(option) => option.label}
                  renderInput={(params) => <TextField {...params} label="Chương trình" placeholder="Chọn chương trình" />}
                  sx={{ minWidth: { sm: 260 } }}
              />

              <FormControl sx={{ minWidth: { sm: 200 } }} disabled={!selectedProgramId || programBlocks.length === 0}>
                <InputLabel id="block-filter-label">Khối học phần</InputLabel>
                <Select
                    labelId="block-filter-label"
                    label="Khối học phần"
                    value={selectedBlockId}
                    onChange={handleBlockFilterChange}
                >
                  <MenuItem value="all">Tất cả</MenuItem>
                  <MenuItem value="null">Không thuộc khối</MenuItem>
                  {programBlocks.map((block) => (
                      <MenuItem key={block.id} value={block.id}>
                        {block.code} — {block.title}
                      </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl sx={{ minWidth: { sm: 180 } }}>
                <InputLabel id="required-filter-label">Trạng thái</InputLabel>
                <Select
                    labelId="required-filter-label"
                    label="Trạng thái"
                    value={selectedRequired}
                    onChange={handleRequiredFilterChange}
                >
                  {REQUIRED_OPTIONS.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Box sx={{ flexGrow: 1 }}>
                <TextField
                    fullWidth
                    label="Tìm kiếm học phần"
                    placeholder="Nhập mã hoặc tên học phần"
                    value={searchValue}
                    onChange={(event) => setSearchValue(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') handleSearchSubmit();
                    }}
                    InputProps={{
                      endAdornment: (
                          <InputAdornment position="end">
                            <IconButton onClick={handleSearchSubmit}>
                              <SearchIcon />
                            </IconButton>
                          </InputAdornment>
                      ),
                    }}
                />
              </Box>

              <Button variant="outlined" onClick={handleResetFilters}>
                Đặt lại
              </Button>
            </Stack>

            {selectedProgram && (
                <Alert severity="info" variant="outlined">
                  <Typography variant="body2">
                    Đang quản lý chương trình: <strong>{selectedProgram.code}</strong> — {selectedProgram.name}
                  </Typography>
                  {selectedBlockFilter && (
                      <Typography variant="caption" display="block" color="text.secondary">
                        Lọc theo khối: {selectedBlockFilter.code} — {selectedBlockFilter.title}
                      </Typography>
                  )}
                </Alert>
            )}

            {error && <Alert severity="error">{error}</Alert>}
          </Stack>
        </Paper>

        <Paper>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Học phần</TableCell>
                  <TableCell align="center">Tín chỉ</TableCell>
                  <TableCell>Khối học phần</TableCell>
                  <TableCell align="center">Thứ tự</TableCell>
                  <TableCell align="center">Trạng thái</TableCell>
                  <TableCell align="right">Thao tác</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        <Box sx={{ py: 6 }}>
                          <CircularProgress size={32} />
                        </Box>
                      </TableCell>
                    </TableRow>
                ) : mappings.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        <Box sx={{ py: 6 }}>
                          <Typography>Chưa có học phần nào được gán cho chương trình.</Typography>
                          <Typography variant="body2" color="text.secondary">
                            Hãy nhấn &quot;Thêm học phần&quot; để bắt đầu xây dựng bản đồ học phần.
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                ) : (
                    mappings.map((mapping) => (
                        <TableRow key={mapping.id} hover>
                          <TableCell>
                            <Stack spacing={0.5}>
                              <Typography fontWeight={600}>{mapping.course?.code ?? '—'}</Typography>
                              <Typography variant="body2" color="text.secondary">
                                {mapping.course?.nameVi || mapping.course?.nameEn || 'Không xác định'}
                              </Typography>
                            </Stack>
                          </TableCell>
                          <TableCell align="center">{mapping.course?.credits ?? '—'}</TableCell>
                          <TableCell>
                            {mapping.block ? (
                                <Stack spacing={0.5}>
                                  <Typography>{mapping.block.code}</Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    {mapping.block.title}
                                  </Typography>
                                </Stack>
                            ) : (
                                <Typography color="text.secondary">Không thuộc khối</Typography>
                            )}
                          </TableCell>
                          <TableCell align="center">{mapping.displayOrder}</TableCell>
                          <TableCell align="center">
                            <Chip
                                label={REQUIRED_LABEL[String(mapping.isRequired)] || (mapping.isRequired ? 'Bắt buộc' : 'Tự chọn')}
                                color={mapping.isRequired ? 'success' : 'default'}
                                size="small"
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Tooltip title="Chỉnh sửa">
                              <IconButton onClick={() => openEditDialog(mapping)}>
                                <EditIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Xóa">
                              <IconButton onClick={() => handleDelete(mapping)}>
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <Stack direction="row" justifyContent="flex-end" sx={{ px: 3, py: 2 }}>
            <Pagination page={pagination.page} count={pagination.totalPages} onChange={handlePageChange} shape="rounded" color="primary" />
          </Stack>
        </Paper>

        <Dialog open={dialogOpen} onClose={closeDialog} fullWidth maxWidth="sm">
          <DialogTitle>{dialogMode === 'edit' ? 'Cập nhật bản đồ học phần' : 'Thêm học phần vào chương trình'}</DialogTitle>
          <DialogContent dividers>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Autocomplete
                  options={programs}
                  value={programs.find((p) => p.id === formState.programId) ?? null}
                  onChange={(_event, option) => {
                    const newProgramId = option?.id ?? '';
                    setFormState((prev) => ({
                      ...prev,
                      programId: newProgramId,
                      blockId: null,
                    }));
                    if (newProgramId) {
                      fetchProgramBlocks(newProgramId);
                    }
                  }}
                  getOptionLabel={(option) => option.label}
                  renderInput={(params) => <TextField {...params} label="Chương trình" required />}
                  disabled={dialogMode === 'edit'}
              />

              <Autocomplete
                  options={courseOptionsForForm}
                  loading={loadingCourses}
                  value={selectedCourse}
                  getOptionLabel={(option) => `${option.code} — ${option.name}`}
                  onOpen={() => {
                    if (availableCourses.length === 0) {
                      fetchCourses();
                    }
                  }}
                  onChange={(_event, option) => {
                    setFormState((prev) => ({ ...prev, courseId: option?.id ?? '' }));
                  }}
                  renderInput={(params) => (
                      <TextField
                          {...params}
                          label="Học phần"
                          required
                          InputProps={{
                            ...params.InputProps,
                            endAdornment: (
                                <>
                                  {loadingCourses ? <CircularProgress color="inherit" size={18} /> : null}
                                  {params.InputProps.endAdornment}
                                </>
                            ),
                          }}
                      />
                  )}
                  disabled={dialogMode === 'edit'}
              />

              <FormControl>
                <InputLabel id="mapping-block-label">Gán vào khối</InputLabel>
                <Select
                    labelId="mapping-block-label"
                    label="Gán vào khối"
                    value={formState.blockId ?? 'null'}
                    onChange={(event) => {
                      const value = event.target.value;
                      setFormState((prev) => ({ ...prev, blockId: value === 'null' ? null : value }));
                    }}
                    disabled={programBlocks.length === 0}
                >
                  <MenuItem value="null">Không thuộc khối</MenuItem>
                  {programBlocks.map((block) => (
                      <MenuItem key={block.id} value={block.id}>
                        {block.code} — {block.title} ({getProgramBlockTypeLabel(block.blockType)})
                      </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl component="fieldset">
                <RadioGroup
                    row
                    value={formState.isRequired ? 'true' : 'false'}
                    onChange={(event) => setFormState((prev) => ({ ...prev, isRequired: event.target.value === 'true' }))}
                >
                  <FormControlLabel value="true" control={<Radio />} label="Bắt buộc" />
                  <FormControlLabel value="false" control={<Radio />} label="Tự chọn" />
                </RadioGroup>
              </FormControl>

              <TextField
                  label="Thứ tự hiển thị"
                  type="number"
                  value={formState.displayOrder}
                  onChange={(event) => {
                    const value = event.target.value;
                    setFormState((prev) => ({ ...prev, displayOrder: value === '' ? '' : Number(value) }));
                  }}
                  inputProps={{ min: 1 }}
              />

              {formError && <Alert severity="error">{formError}</Alert>}
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={closeDialog} disabled={formSubmitting}>
              Hủy
            </Button>
            <Button onClick={handleSubmitForm} variant="contained" disabled={formSubmitting || !isFormValid}>
              {formSubmitting ? 'Đang lưu...' : 'Lưu'}
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar
            open={snackbar.open}
            autoHideDuration={4000}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        >
          <Alert severity={snackbar.severity} onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))} sx={{ width: '100%' }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
  );
}
