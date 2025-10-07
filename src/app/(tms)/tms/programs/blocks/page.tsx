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
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Pagination,
  Paper,
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
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import {
  ProgramBlockType,
  PROGRAM_BLOCK_TYPES,
  getProgramBlockTypeLabel,
} from '@/constants/programs';

const DEFAULT_BLOCK_PAGE_SIZE = 10;

interface ProgramOption {
  id: string;
  code: string;
  name: string;
  label: string;
}

interface ProgramBlockListItem {
  id: string;
  programId: string;
  program: ProgramOption | null;
  code: string;
  title: string;
  blockType: ProgramBlockType;
  displayOrder: number;
  courseCount: number;
  groupCount: number;
}

interface ProgramBlockCourseItem {
  id: string;
  mapId: string;
  courseId: string;
  code: string;
  name: string;
  credits: number;
  required: boolean;
  displayOrder: number;
}

interface ProgramBlockDetail extends ProgramBlockListItem {
  courses: ProgramBlockCourseItem[];
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

interface ProgramBlockListApiItem {
  id?: string | number;
  programId?: string | number;
  program?: {
    id?: string | number;
    code?: string;
    name?: string;
  } | null;
  code?: string;
  title?: string;
  blockType?: ProgramBlockType | string;
  displayOrder?: number;
  courseCount?: number;
  groupCount?: number;
}

interface ProgramBlockListApiResponse {
  success: boolean;
  data?: {
    items?: ProgramBlockListApiItem[];
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
  error?: string;
}

interface ProgramBlockCourseApiItem {
  id?: string | number;
  mapId?: string | number;
  courseId?: string | number;
  code?: string;
  name?: string;
  credits?: number;
  required?: boolean;
  displayOrder?: number;
}

interface ProgramBlockDetailApiItem extends ProgramBlockListApiItem {
  courses?: ProgramBlockCourseApiItem[];
}

interface ProgramBlockDetailApiResponse {
  success: boolean;
  data?: ProgramBlockDetailApiItem;
  error?: string;
}

interface PaginationState {
  page: number;
  totalPages: number;
  totalItems: number;
}

type BlockFormMode = 'create' | 'edit';

interface ProgramBlockFormState {
  programId: string;
  code: string;
  title: string;
  blockType: ProgramBlockType;
  displayOrder: number | '';
}

const BLOCK_TYPE_CHIP_COLOR: Record<ProgramBlockType, 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'info' | 'error'> = {
  [ProgramBlockType.GENERAL]: 'info',
  [ProgramBlockType.FOUNDATION]: 'primary',
  [ProgramBlockType.CORE]: 'secondary',
  [ProgramBlockType.MAJOR]: 'success',
  [ProgramBlockType.ELECTIVE]: 'default',
  [ProgramBlockType.THESIS]: 'warning',
  [ProgramBlockType.INTERNSHIP]: 'info',
  [ProgramBlockType.OTHER]: 'default',
};

function getBlockTypeChipColor(type: ProgramBlockType) {
  return BLOCK_TYPE_CHIP_COLOR[type] ?? 'default';
}

function createEmptyForm(): ProgramBlockFormState {
  return {
    programId: '',
    code: '',
    title: '',
    blockType: ProgramBlockType.CORE,
    displayOrder: '',
  };
}

export default function ProgramBlocksPage(): JSX.Element {
  const [blocks, setBlocks] = useState<ProgramBlockListItem[]>([]);
  const [programs, setPrograms] = useState<ProgramOption[]>([]);
  const [pagination, setPagination] = useState<PaginationState>({ page: 1, totalPages: 1, totalItems: 0 });
  const [selectedProgramId, setSelectedProgramId] = useState<string>('all');
  const [selectedBlockType, setSelectedBlockType] = useState<ProgramBlockType | 'all'>('all');
  const [searchValue, setSearchValue] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<BlockFormMode>('create');
  const [formState, setFormState] = useState<ProgramBlockFormState>(createEmptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [editingBlock, setEditingBlock] = useState<ProgramBlockListItem | null>(null);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [detailBlock, setDetailBlock] = useState<ProgramBlockDetail | null>(null);

  const blockTypeOptions = useMemo(
    () => PROGRAM_BLOCK_TYPES.map((type) => ({ value: type, label: getProgramBlockTypeLabel(type) })),
    [],
  );

  const loadPrograms = useCallback(async () => {
    try {
      const response = await fetch('/api/tms/programs/list?limit=200');
      const result: ProgramListApiResponse = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Không thể tải danh sách chương trình');
      }

      const rawItems = Array.isArray(result.data?.items) ? result.data?.items : [];

      const items: ProgramOption[] = rawItems.map((item) => ({
        id: item.id?.toString() ?? '',
        code: item.code ?? '—',
        name: item.name_vi ?? item.name_en ?? 'Không xác định',
        label: item.label ?? `${item.code ?? ''} - ${item.name_vi ?? ''}`.trim(),
      }));

      setPrograms(items);
    } catch (err) {
      console.error('Failed to fetch programs list', err);
    }
  }, []);

  const loadBlocks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: String(DEFAULT_BLOCK_PAGE_SIZE),
      });

      if (selectedProgramId !== 'all') {
        params.set('programId', selectedProgramId);
      }

      if (selectedBlockType !== 'all') {
        params.set('blockType', selectedBlockType);
      }

      if (searchTerm) {
        params.set('search', searchTerm);
      }

      const response = await fetch(`/api/tms/program-blocks?${params.toString()}`);
      const result: ProgramBlockListApiResponse = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Không thể tải danh sách khối học phần');
      }

      const rawItems = Array.isArray(result.data?.items) ? result.data?.items : [];

      const items: ProgramBlockListItem[] = rawItems.map((item) => {
        const programOption = item.program
          ? {
              id: item.program.id?.toString() ?? '',
              code: item.program.code ?? '—',
              name: item.program.name ?? 'Không xác định',
              label: `${item.program.code ?? '—'} - ${item.program.name ?? ''}`.trim(),
            }
          : null;

        return {
          id: item.id?.toString() ?? '',
          programId: item.programId?.toString() ?? '',
          program: programOption,
          code: item.code ?? '',
          title: item.title ?? '',
          blockType: (item.blockType ?? ProgramBlockType.CORE) as ProgramBlockType,
          displayOrder: item.displayOrder ?? 1,
          courseCount: item.courseCount ?? 0,
          groupCount: item.groupCount ?? 0,
        };
      });

      setBlocks(items);
      setPagination((prev) => ({
        ...prev,
        totalPages: result.data?.pagination?.totalPages ?? 1,
        totalItems: result.data?.pagination?.total ?? items.length,
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Đã xảy ra lỗi khi tải dữ liệu';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, searchTerm, selectedBlockType, selectedProgramId]);

  useEffect(() => {
    loadPrograms();
  }, [loadPrograms]);

  useEffect(() => {
    loadBlocks();
  }, [loadBlocks]);

  const handleSearch = () => {
    setPagination((prev) => ({ ...prev, page: 1 }));
    setSearchTerm(searchValue.trim());
  };

  const handleResetFilters = () => {
    setSelectedProgramId('all');
    setSelectedBlockType('all');
    setSearchValue('');
    setSearchTerm('');
    setPagination({ page: 1, totalItems: 0, totalPages: 1 });
  };

  const handleProgramFilterChange = (_event: React.SyntheticEvent, option: ProgramOption | null) => {
    setSelectedProgramId(option?.id ?? 'all');
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleBlockTypeFilterChange = (event: SelectChangeEvent<ProgramBlockType | 'all'>) => {
    setSelectedBlockType(event.target.value as ProgramBlockType | 'all');
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (_: React.ChangeEvent<unknown>, newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const handleOpenCreateForm = () => {
    setFormMode('create');
    setFormState({ ...createEmptyForm(), displayOrder: pagination.totalItems + 1 });
    setEditingBlock(null);
    setFormError(null);
    setFormOpen(true);
  };

  const handleOpenEditForm = (block: ProgramBlockListItem) => {
    setFormMode('edit');
    setEditingBlock(block);
    setFormState({
      programId: block.programId,
      code: block.code,
      title: block.title,
      blockType: block.blockType,
      displayOrder: block.displayOrder,
    });
    setFormError(null);
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    if (formSubmitting) return;
    setFormOpen(false);
    setEditingBlock(null);
    setFormState(createEmptyForm());
    setFormError(null);
  };

  const selectedProgramOption = useMemo(
    () => programs.find((item) => item.id === formState.programId) ?? null,
    [formState.programId, programs],
  );

  const isFormValid = useMemo(() => {
    return Boolean(
      formState.programId &&
        formState.code.trim() &&
        formState.title.trim() &&
        (formState.displayOrder === '' || Number(formState.displayOrder) > 0),
    );
  }, [formState.code, formState.displayOrder, formState.programId, formState.title]);

  const handleFormSubmit = async () => {
    if (!isFormValid) {
      setFormError('Vui lòng điền đầy đủ thông tin bắt buộc.');
      return;
    }

    setFormSubmitting(true);
    setFormError(null);

    const payload = {
      program_id: formState.programId,
      code: formState.code.trim(),
      title: formState.title.trim(),
      block_type: formState.blockType,
      display_order:
        formState.displayOrder === '' ? undefined : Number(formState.displayOrder),
    };

    try {
      const endpoint =
        formMode === 'edit' && editingBlock
          ? `/api/tms/program-blocks/${editingBlock.id}`
          : '/api/tms/program-blocks';
      const method = formMode === 'edit' ? 'PUT' : 'POST';

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Không thể lưu khối học phần');
      }

      setSnackbar({
        open: true,
        message: formMode === 'edit' ? 'Cập nhật khối học phần thành công' : 'Tạo khối học phần thành công',
        severity: 'success',
      });
      setFormOpen(false);
      setEditingBlock(null);
      setFormState(createEmptyForm());
      loadBlocks();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể lưu khối học phần';
      setFormError(message);
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteBlock = async (block: ProgramBlockListItem) => {
    const confirmed = window.confirm(`Bạn có chắc chắn muốn xóa khối học phần "${block.title}"?`);
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/tms/program-blocks/${block.id}`, { method: 'DELETE' });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Không thể xóa khối học phần');
      }

      setSnackbar({ open: true, message: 'Đã xóa khối học phần', severity: 'success' });
      loadBlocks();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể xóa khối học phần';
      setSnackbar({ open: true, message, severity: 'error' });
    }
  };

  const handleViewDetails = async (block: ProgramBlockListItem) => {
    setDetailOpen(true);
    setDetailLoading(true);
    setDetailError(null);
    setDetailBlock(null);

    try {
      const response = await fetch(`/api/tms/program-blocks/${block.id}`);
      const result: ProgramBlockDetailApiResponse = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Không thể tải thông tin khối học phần');
      }

      const detailData = result.data;
      if (!detailData) {
        throw new Error('Không tìm thấy dữ liệu khối học phần');
      }

      const program = detailData.program
        ? {
            id: detailData.program.id?.toString() ?? block.programId,
            code: detailData.program.code ?? block.program?.code ?? '—',
            name: detailData.program.name ?? block.program?.name ?? 'Không xác định',
            label:
              `${detailData.program.code ?? '—'} - ${detailData.program.name ?? ''}`.trim() ||
              block.program?.label ||
              '—',
          }
        : block.program;

      const courses: ProgramBlockCourseItem[] = Array.isArray(detailData.courses)
        ? detailData.courses.map((course) => ({
            id: course.id?.toString() ?? course.courseId?.toString() ?? '',
            mapId: course.mapId?.toString() ?? '',
            courseId: course.courseId?.toString() ?? '',
            code: course.code ?? '—',
            name: course.name ?? 'Chưa đặt tên',
            credits: course.credits ?? 0,
            required: course.required ?? true,
            displayOrder: course.displayOrder ?? 1,
          }))
        : [];

      setDetailBlock({
        id: detailData.id?.toString() ?? block.id,
        programId: detailData.programId?.toString() ?? block.programId,
        program,
        code: detailData.code ?? block.code,
        title: detailData.title ?? block.title,
        blockType: (detailData.blockType ?? block.blockType) as ProgramBlockType,
        displayOrder: detailData.displayOrder ?? block.displayOrder,
        courseCount: detailData.courseCount ?? courses.length,
        groupCount: detailData.groupCount ?? block.groupCount,
        courses,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể tải thông tin khối học phần';
      setDetailError(message);
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Quản lý khối học phần
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Theo dõi, tạo mới và cập nhật các khối học phần thuộc chương trình đào tạo.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Tooltip title="Làm mới">
            <span>
              <IconButton onClick={loadBlocks} disabled={loading}>
                <RefreshIcon />
              </IconButton>
            </span>
          </Tooltip>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreateForm}>
            Thêm khối học phần
          </Button>
        </Stack>
      </Stack>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Stack spacing={2}>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={2}
            alignItems={{ xs: 'stretch', md: 'center' }}
          >
            <Autocomplete
              options={programs}
              value={selectedProgramId === 'all' ? null : programs.find((item) => item.id === selectedProgramId) ?? null}
              onChange={handleProgramFilterChange}
              getOptionLabel={(option) => option.label}
              renderInput={(params) => <TextField {...params} label="Chương trình" placeholder="Tất cả chương trình" />}
              sx={{ minWidth: { sm: 240 } }}
            />

            <FormControl sx={{ minWidth: { sm: 200 } }}>
              <InputLabel id="program-block-type-filter-label">Loại khối</InputLabel>
              <Select
                labelId="program-block-type-filter-label"
                label="Loại khối"
                value={selectedBlockType}
                onChange={handleBlockTypeFilterChange}
              >
                <MenuItem value="all">Tất cả</MenuItem>
                {blockTypeOptions.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box sx={{ flexGrow: 1 }}>
              <TextField
                fullWidth
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') handleSearch();
                }}
                label="Tìm kiếm"
                placeholder="Tìm theo mã hoặc tên khối học phần"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={handleSearch}>
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

          {error && (
            <Alert severity="error">{error}</Alert>
          )}
        </Stack>
      </Paper>

      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Chương trình</TableCell>
                <TableCell>Mã khối</TableCell>
                <TableCell>Tên khối</TableCell>
                <TableCell align="center">Loại</TableCell>
                <TableCell align="center">Thứ tự</TableCell>
                <TableCell align="center">Số học phần</TableCell>
                <TableCell align="center">Nhóm</TableCell>
                <TableCell align="right">Thao tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <Box sx={{ py: 6 }}>
                      <CircularProgress size={32} />
                    </Box>
                  </TableCell>
                </TableRow>
              ) : blocks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <Box sx={{ py: 6 }}>
                      <Typography>Không có khối học phần nào.</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Thử thay đổi bộ lọc hoặc thêm mới khối học phần.
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                blocks.map((block) => (
                  <TableRow key={block.id} hover>
                    <TableCell>
                      <Stack spacing={0.5}>
                        <Typography fontWeight={600}>{block.program?.code ?? '—'}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {block.program?.name ?? 'Chưa cập nhật'}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>{block.code}</TableCell>
                    <TableCell>{block.title}</TableCell>
                    <TableCell align="center">
                      <Chip
                        size="small"
                        label={getProgramBlockTypeLabel(block.blockType)}
                        color={getBlockTypeChipColor(block.blockType)}
                        variant={block.blockType === ProgramBlockType.ELECTIVE || block.blockType === ProgramBlockType.OTHER ? 'outlined' : 'filled'}
                      />
                    </TableCell>
                    <TableCell align="center">{block.displayOrder}</TableCell>
                    <TableCell align="center">{block.courseCount}</TableCell>
                    <TableCell align="center">{block.groupCount}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="Chi tiết">
                        <IconButton onClick={() => handleViewDetails(block)}>
                          <VisibilityIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Chỉnh sửa">
                        <IconButton onClick={() => handleOpenEditForm(block)}>
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Xóa">
                        <IconButton onClick={() => handleDeleteBlock(block)}>
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

        <Stack direction="row" justifyContent="flex-end" alignItems="center" sx={{ px: 3, py: 2 }}>
          <Pagination
            page={pagination.page}
            count={pagination.totalPages}
            color="primary"
            onChange={handlePageChange}
            shape="rounded"
          />
        </Stack>
      </Paper>

      <Dialog open={formOpen} onClose={handleCloseForm} fullWidth maxWidth="sm">
        <DialogTitle>{formMode === 'edit' ? 'Cập nhật khối học phần' : 'Thêm khối học phần'}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Autocomplete
              options={programs}
              value={selectedProgramOption}
              onChange={(_event, option) => {
                setFormState((prev) => ({ ...prev, programId: option?.id ?? '' }));
              }}
              getOptionLabel={(option) => option.label}
              renderInput={(params) => <TextField {...params} label="Chương trình" required />}
            />

            <TextField
              label="Mã khối"
              value={formState.code}
              onChange={(event) => setFormState((prev) => ({ ...prev, code: event.target.value }))}
              required
            />

            <TextField
              label="Tên khối"
              value={formState.title}
              onChange={(event) => setFormState((prev) => ({ ...prev, title: event.target.value }))}
              required
            />

            <FormControl>
              <InputLabel id="program-block-type-label">Loại khối</InputLabel>
              <Select
                labelId="program-block-type-label"
                label="Loại khối"
                value={formState.blockType}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, blockType: event.target.value as ProgramBlockType }))
                }
              >
                {blockTypeOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
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

            {formError && (
              <Alert severity="error">{formError}</Alert>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseForm} disabled={formSubmitting}>
            Hủy
          </Button>
          <Button onClick={handleFormSubmit} variant="contained" disabled={formSubmitting || !isFormValid}>
            {formSubmitting ? 'Đang lưu...' : 'Lưu'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>Chi tiết khối học phần</DialogTitle>
        <DialogContent dividers>
          {detailLoading ? (
            <Box sx={{ py: 4, textAlign: 'center' }}>
              <CircularProgress size={32} />
            </Box>
          ) : detailError ? (
            <Alert severity="error">{detailError}</Alert>
          ) : detailBlock ? (
            <Stack spacing={3}>
              <Box>
                <Typography variant="h6" gutterBottom>
                  {detailBlock.title}
                </Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Chương trình
                    </Typography>
                    <Typography fontWeight={600}>
                      {detailBlock.program?.code ?? '—'} • {detailBlock.program?.name ?? 'Chưa cập nhật'}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Loại khối
                    </Typography>
                    <Chip
                      size="small"
                      color={getBlockTypeChipColor(detailBlock.blockType)}
                      label={getProgramBlockTypeLabel(detailBlock.blockType)}
                    />
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Thứ tự hiển thị
                    </Typography>
                    <Typography fontWeight={600}>{detailBlock.displayOrder}</Typography>
                  </Box>
                </Stack>
              </Box>

              <Box>
                <Typography variant="subtitle1" gutterBottom>
                  Danh sách học phần ({detailBlock.courses.length})
                </Typography>
                {detailBlock.courses.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    Chưa có học phần nào trong khối này.
                  </Typography>
                ) : (
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Mã học phần</TableCell>
                        <TableCell>Tên học phần</TableCell>
                        <TableCell align="center">Số tín chỉ</TableCell>
                        <TableCell align="center">Bắt buộc</TableCell>
                        <TableCell align="center">Thứ tự</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {detailBlock.courses.map((course) => (
                        <TableRow key={course.mapId}>
                          <TableCell>{course.code}</TableCell>
                          <TableCell>{course.name}</TableCell>
                          <TableCell align="center">{course.credits}</TableCell>
                          <TableCell align="center">{course.required ? 'Có' : 'Không'}</TableCell>
                          <TableCell align="center">{course.displayOrder}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </Box>
            </Stack>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailOpen(false)}>Đóng</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
