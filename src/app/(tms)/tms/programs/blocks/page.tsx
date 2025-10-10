'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Breadcrumbs,
  Link,
  Avatar,
  Tooltip,
  Badge,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  School as SchoolIcon,
  FilterList as FilterIcon,
  ViewList as ViewListIcon,
  Apps as AppsIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { getProgramBlockTypeLabel } from '@/constants/programs';

interface ProgramOption {
  id: string;
  code: string;
  name: string;
}

interface TemplateOption {
  id: string;
  code: string;
  title: string;
  blockType: string;
  isActive: boolean;
}

interface ProgramBlockRecord {
  id: string | number;
  programId: string | number;
  programCode: string;
  programName: string;
  templateId: string | number;
  templateCode: string;
  templateTitle: string;
  blockType: string;
  blockTypeLabel: string;
  displayOrder: number | null;
  isRequired: boolean;
  isActive: boolean;
  customTitle?: string;
  customDescription?: string;
}

interface ProgramBlockFormState {
  id: string | number | null;
  programId: string;
  templateId: string;
  displayOrder: string;
  isRequired: boolean;
  isActive: boolean;
  customTitle: string;
  customDescription: string;
}

const createEmptyFormState = (): ProgramBlockFormState => ({
  id: null,
  programId: '',
  templateId: '',
  displayOrder: '',
  isRequired: true,
  isActive: true,
  customTitle: '',
  customDescription: '',
});

const formatDisplayOrder = (value: number | null) => (value == null ? '—' : value);

type ViewMode = 'table' | 'grid';

export default function ProgramBlocksPage(): JSX.Element {
  const [blocks, setBlocks] = useState<ProgramBlockRecord[]>([]);
  const [programs, setPrograms] = useState<ProgramOption[]>([]);
  const [templates, setTemplates] = useState<TemplateOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [programLoading, setProgramLoading] = useState(false);
  const [templateLoading, setTemplateLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedProgram, setSelectedProgram] = useState<string>('all');
  const [searchValue, setSearchValue] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('table');

  const [formOpen, setFormOpen] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formState, setFormState] = useState<ProgramBlockFormState>(createEmptyFormState);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | number | null>(null);
  const [confirmDeleting, setConfirmDeleting] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>(
    { open: false, message: '', severity: 'success' },
  );

  const filteredBlocks = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return blocks.filter((block) => {
      const matchesProgram = selectedProgram === 'all' || block.programId.toString() === selectedProgram;
      const matchesSearch =
        term === '' ||
        block.programCode.toLowerCase().includes(term) ||
        block.programName.toLowerCase().includes(term) ||
        block.templateCode.toLowerCase().includes(term) ||
        block.templateTitle.toLowerCase().includes(term);
      return matchesProgram && matchesSearch;
    });
  }, [blocks, searchTerm, selectedProgram]);

  const fetchPrograms = useCallback(async () => {
    try {
      setProgramLoading(true);
      const params = new URLSearchParams({ page: '1', limit: '200' });
      const res = await fetch(`/api/tms/programs?${params.toString()}`);
      const data = await res.json();
      if (!res.ok || !data?.success || !data?.data?.items) {
        throw new Error(data?.error || 'Không thể tải danh sách chương trình');
      }
      const programOptions: ProgramOption[] = data.data.items.map((item: any) => ({
        id: item.id,
        code: item.code,
        name: item.name_vi,
      }));
      setPrograms(programOptions);
    } catch (err) {
      console.error('Failed to fetch programs', err);
      setPrograms([]);
      setSnackbar({ open: true, message: 'Không thể tải danh sách chương trình', severity: 'error' });
    } finally {
      setProgramLoading(false);
    }
  }, []);

  const fetchTemplates = useCallback(async () => {
    try {
      setTemplateLoading(true);
      const params = new URLSearchParams({ limit: '200', active: 'true', templates: 'true' });
      const res = await fetch(`/api/tms/programs/blocks?${params.toString()}`);
      const json = await res.json();
      if (!res.ok || !json?.success || !Array.isArray(json.data)) {
        throw new Error(json?.error || 'Không thể tải danh sách mẫu khối học phần');
      }
      const templateOptions: TemplateOption[] = json.data.map((item: any) => ({
        id: item.id.toString(),
        code: item.code,
        title: item.title,
        blockType: item.block_type || item.blockType,
        isActive: Boolean(item.is_active ?? item.isActive ?? true),
      }));
      setTemplates(templateOptions);
    } catch (err) {
      console.error('Failed to fetch block templates', err);
      setTemplates([]);
      setSnackbar({ open: true, message: 'Không thể tải danh sách mẫu khối học phần', severity: 'error' });
    } finally {
      setTemplateLoading(false);
    }
  }, []);

  const fetchBlocks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({ limit: '200' });
      if (selectedProgram !== 'all') params.set('programId', selectedProgram);
      if (searchTerm.trim()) params.set('search', searchTerm.trim());

      const res = await fetch(`/api/tms/programs/blocks?${params.toString()}`);
      const json = await res.json();
      if (!res.ok || !json?.success || !Array.isArray(json.data)) {
        throw new Error(json?.error || 'Không thể tải danh sách khối học phần');
      }
      setBlocks(json.data as ProgramBlockRecord[]);
    } catch (err) {
      console.error('Failed to fetch program block assignments', err);
      setError(err instanceof Error ? err.message : 'Không thể tải danh sách khối học phần');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedProgram]);

  useEffect(() => {
    fetchPrograms();
    fetchTemplates();
  }, [fetchPrograms, fetchTemplates]);

  useEffect(() => {
    fetchBlocks();
  }, [fetchBlocks]);

  const handleOpenCreate = () => {
    const defaultTemplateId = templates.length > 0 ? templates[0].id : '';
    setFormState((prev) => ({
      ...createEmptyFormState(),
      programId: selectedProgram === 'all' ? '' : selectedProgram,
      templateId: defaultTemplateId,
    }));
    setFormOpen(true);
  };

  const handleOpenEdit = (block: ProgramBlockRecord) => {
    setFormState({
      id: block.id,
      programId: block.programId.toString(),
      templateId: block.templateId.toString(),
      displayOrder: block.displayOrder != null ? String(block.displayOrder) : '',
      isRequired: block.isRequired,
      isActive: block.isActive,
      customTitle: block.customTitle ?? '',
      customDescription: block.customDescription ?? '',
    });
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    if (formSubmitting) return;
    setFormOpen(false);
  };

  const handleFormChange = <K extends keyof ProgramBlockFormState>(key: K, value: ProgramBlockFormState[K]) => {
    setFormState((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmitForm = async () => {
    if (!formState.programId || !formState.templateId) {
      setSnackbar({ open: true, message: 'Vui lòng chọn chương trình và template', severity: 'error' });
      return;
    }

    const payload = {
      program_id: Number(formState.programId),
      template_id: Number(formState.templateId),
      display_order: formState.displayOrder ? Number(formState.displayOrder) : undefined,
      is_required: formState.isRequired,
      is_active: formState.isActive,
      custom_title: formState.customTitle.trim() || undefined,
      custom_description: formState.customDescription.trim() || undefined,
    };

    try {
      setFormSubmitting(true);
      if (formState.id) {
        const res = await fetch(`/api/tms/programs/blocks/${formState.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data?.error || 'Không thể cập nhật khối học phần');
        }
      } else {
        const res = await fetch('/api/tms/programs/blocks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data?.error || 'Không thể tạo khối học phần');
        }
      }

      setSnackbar({
        open: true,
        message: formState.id ? 'Cập nhật khối học phần thành công' : 'Gán khối học phần thành công',
        severity: 'success',
      });
      setFormOpen(false);
      fetchBlocks();
    } catch (err) {
      setSnackbar({
        open: true,
        message: err instanceof Error ? err.message : 'Có lỗi xảy ra khi lưu khối học phần',
        severity: 'error',
      });
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDeleteId) return;
    try {
      setConfirmDeleting(true);
      const res = await fetch(`/api/tms/programs/blocks/${confirmDeleteId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || 'Không thể xoá khối học phần');
      }
      setSnackbar({ open: true, message: 'Xoá khối học phần thành công', severity: 'success' });
      setConfirmDeleteId(null);
      fetchBlocks();
    } catch (err) {
      setSnackbar({
        open: true,
        message: err instanceof Error ? err.message : 'Có lỗi xảy ra khi xoá khối học phần',
        severity: 'error',
      });
    } finally {
      setConfirmDeleting(false);
    }
  };

  const currentProgramName = useMemo(() => {
    if (selectedProgram === 'all') return 'Tất cả chương trình';
    const found = programs.find((item) => item.id === selectedProgram);
    return found ? `${found.code} • ${found.name}` : 'Chương trình không xác định';
  }, [programs, selectedProgram]);

  const selectedTemplate = useMemo(() => {
    if (!formState.templateId) return undefined;
    return templates.find((template) => template.id === formState.templateId);
  }, [formState.templateId, templates]);

  return (
    <Box sx={{ backgroundColor: 'background.default', minHeight: '100vh' }}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ py: 2, px: 2 }}>
        <Link href="/tms/programs" color="inherit" sx={{ display: 'flex', alignItems: 'center' }}>
          <ArrowBackIcon sx={{ mr: 1 }} />
          Chương trình đào tạo
        </Link>
        <Typography color="text.primary">Quản lý khối học phần</Typography>
      </Breadcrumbs>

      <Box sx={{ px: 2, pb: 4 }}>
        {/* Header */}
        <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
          <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} spacing={3}>
            <Stack spacing={2} sx={{ flex: 1 }}>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <SchoolIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                    Quản lý khối học phần
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Gán và quản lý các khối học phần trong chương trình đào tạo
                  </Typography>
                </Box>
              </Stack>
              
              <Stack direction="row" spacing={2} alignItems="center">
                <Badge badgeContent={blocks.length} color="primary">
                  <Chip 
                    icon={<SchoolIcon />} 
                    label="Tổng khối học phần" 
                    variant="outlined" 
                    size="small"
                  />
                </Badge>
                <Chip 
                  label={`${programs.length} chương trình`} 
                  variant="outlined" 
                  size="small"
                  color="secondary"
                />
              </Stack>
            </Stack>

            <Stack direction="row" spacing={1}>
              <Tooltip title="Chế độ xem bảng">
                <IconButton 
                  onClick={() => setViewMode('table')}
                  color={viewMode === 'table' ? 'primary' : 'default'}
                >
                  <ViewListIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Chế độ xem lưới">
                <IconButton 
                  onClick={() => setViewMode('grid')}
                  color={viewMode === 'grid' ? 'primary' : 'default'}
                >
                  <AppsIcon />
                </IconButton>
              </Tooltip>
              <Divider orientation="vertical" flexItem />
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={fetchBlocks}
                disabled={loading}
              >
                Làm mới
              </Button>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleOpenCreate}
                disabled={programLoading || templateLoading}
              >
                Gán khối học phần
              </Button>
            </Stack>
          </Stack>
        </Paper>

        {/* Filters */}
        <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider', mb: 3 }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
            <FilterIcon color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Bộ lọc và tìm kiếm
            </Typography>
          </Stack>
          
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems="center">
            <Box sx={{ flex: '1 1 300px', minWidth: 0 }}>
              <FormControl fullWidth>
                <InputLabel id="program-filter-label">Chương trình</InputLabel>
                <Select
                  labelId="program-filter-label"
                  label="Chương trình"
                  value={selectedProgram}
                  onChange={(event) => setSelectedProgram(event.target.value)}
                >
                  <MenuItem value="all">Tất cả chương trình</MenuItem>
                  {programs.map((program) => (
                    <MenuItem key={program.id} value={program.id}>
                      {program.code ? `${program.code} • ${program.name}` : program.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ flex: '2 1 400px', minWidth: 0 }}>
              <TextField
                fullWidth
                label="Tìm kiếm theo mã/tên khối hoặc chương trình"
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    setSearchTerm(searchValue.trim());
                  }
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton 
                        edge="end" 
                        onClick={() => setSearchTerm(searchValue.trim())}
                        disabled={!searchValue.trim()}
                      >
                        <SearchIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
            <Box sx={{ flex: '0 0 auto' }}>
              <Button
                variant="outlined"
                color="secondary"
                onClick={() => {
                  setSearchValue('');
                  setSearchTerm('');
                  setSelectedProgram('all');
                }}
                disabled={selectedProgram === 'all' && !searchTerm}
                sx={{ minWidth: 120 }}
              >
                Xoá bộ lọc
              </Button>
            </Box>
          </Stack>
          
          <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 2 }}>
            <Chip 
              label={`Đang hiển thị: ${currentProgramName}`} 
              variant="outlined" 
              size="small"
              color="primary"
            />
            {searchTerm && (
              <Chip 
                label={`Tìm kiếm: "${searchTerm}"`} 
                variant="outlined" 
                size="small"
                color="secondary"
                onDelete={() => {
                  setSearchValue('');
                  setSearchTerm('');
                }}
              />
            )}
            <Chip 
              label={`${filteredBlocks.length} kết quả`} 
              variant="filled" 
              size="small"
              color="success"
            />
          </Stack>
        </Paper>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Content Area */}
        {viewMode === 'table' ? (
          <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
            {loading && <LinearProgress sx={{ borderRadius: 'inherit' }} />}
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Chương trình</TableCell>
                    <TableCell>Template</TableCell>
                    <TableCell align="center">Loại khối</TableCell>
                    <TableCell align="center">Thứ tự</TableCell>
                    <TableCell align="center">Trạng thái</TableCell>
                    <TableCell align="center">Thao tác</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredBlocks.length === 0 && !loading ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                        <Stack spacing={2} alignItems="center">
                          <SchoolIcon sx={{ fontSize: 48, color: 'text.disabled' }} />
                          <Typography color="text.secondary">
                            Không có khối học phần nào phù hợp
                          </Typography>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredBlocks.map((block) => (
                      <TableRow key={block.id} hover>
                        <TableCell>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                              <SchoolIcon fontSize="small" />
                            </Avatar>
                            <Box>
                              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                {block.programCode || '—'}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {block.programName || 'Chưa cập nhật'}
                              </Typography>
                            </Box>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            {block.templateCode || '—'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {block.customTitle || block.templateTitle || 'Chưa cập nhật'}
                          </Typography>
                          {block.customDescription && (
                            <Typography variant="caption" color="text.secondary">
                              {block.customDescription}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="center">
                          <Chip label={block.blockTypeLabel} color="info" size="small" variant="outlined" />
                        </TableCell>
                        <TableCell align="center">
                          <Chip 
                            label={formatDisplayOrder(block.displayOrder)} 
                            color="primary" 
                            size="small" 
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Stack direction="row" spacing={1} justifyContent="center">
                            <Chip
                              label={block.isRequired ? 'Bắt buộc' : 'Tuỳ chọn'}
                              color={block.isRequired ? 'primary' : 'default'}
                              size="small"
                              variant="outlined"
                            />
                            <Chip
                              label={block.isActive ? 'Kích hoạt' : 'Tạm dừng'}
                              color={block.isActive ? 'success' : 'warning'}
                              size="small"
                              variant="outlined"
                            />
                          </Stack>
                        </TableCell>
                        <TableCell align="center">
                          <Stack direction="row" spacing={1} justifyContent="center">
                            <Tooltip title="Chỉnh sửa">
                              <IconButton color="primary" onClick={() => handleOpenEdit(block)} size="small">
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Xóa">
                              <IconButton
                                color="error"
                                onClick={() => setConfirmDeleteId(block.id)}
                                size="small"
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        ) : (
          <Box>
            {filteredBlocks.length === 0 && !loading ? (
              <Paper elevation={0} sx={{ p: 6, textAlign: 'center', borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                <Stack spacing={2} alignItems="center">
                  <SchoolIcon sx={{ fontSize: 64, color: 'text.disabled' }} />
                  <Typography variant="h6" color="text.secondary">
                    Không có khối học phần nào phù hợp
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Thử thay đổi bộ lọc hoặc tìm kiếm để xem thêm kết quả
                  </Typography>
                </Stack>
              </Paper>
            ) : (
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
                gap: 3 
              }}>
                {filteredBlocks.map((block) => (
                  <Box key={block.id}>
                  <Card 
                    elevation={0} 
                    sx={{ 
                      height: '100%', 
                      borderRadius: 3, 
                      border: '1px solid', 
                      borderColor: 'divider',
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: 2,
                      }
                    }}
                  >
                    <CardContent>
                      <Stack spacing={2}>
                        {/* Program Info */}
                        <Stack direction="row" alignItems="center" spacing={2}>
                          <Avatar sx={{ bgcolor: 'primary.main' }}>
                            <SchoolIcon />
                          </Avatar>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600 }} noWrap>
                              {block.programCode || '—'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" noWrap>
                              {block.programName || 'Chưa cập nhật'}
                            </Typography>
                          </Box>
                        </Stack>

                        <Divider />

                        {/* Template Info */}
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                            {block.customTitle || block.templateTitle || 'Chưa cập nhật'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            {block.templateCode || '—'}
                          </Typography>
                          {block.customDescription && (
                            <Typography variant="caption" color="text.secondary">
                              {block.customDescription}
                            </Typography>
                          )}
                        </Box>

                        {/* Status Chips */}
                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                          <Chip 
                            label={block.blockTypeLabel} 
                            color="info" 
                            size="small" 
                            variant="outlined" 
                          />
                          <Chip 
                            label={formatDisplayOrder(block.displayOrder)} 
                            color="primary" 
                            size="small" 
                            variant="outlined"
                          />
                          <Chip
                            label={block.isRequired ? 'Bắt buộc' : 'Tuỳ chọn'}
                            color={block.isRequired ? 'primary' : 'default'}
                            size="small"
                            variant="outlined"
                          />
                          <Chip
                            label={block.isActive ? 'Kích hoạt' : 'Tạm dừng'}
                            color={block.isActive ? 'success' : 'warning'}
                            size="small"
                            variant="outlined"
                          />
                        </Stack>

                        {/* Actions */}
                        <Stack direction="row" spacing={1}>
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<EditIcon />}
                            onClick={() => handleOpenEdit(block)}
                            sx={{ flex: 1 }}
                          >
                            Chỉnh sửa
                          </Button>
                          <Button
                            variant="outlined"
                            color="error"
                            size="small"
                            startIcon={<DeleteIcon />}
                            onClick={() => setConfirmDeleteId(block.id)}
                            sx={{ flex: 1 }}
                          >
                            Xóa
                          </Button>
                        </Stack>
                      </Stack>
                    </CardContent>
                  </Card>
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        )}
      </Box>

      {/* Create / Edit Dialog */}
      <Dialog open={formOpen} onClose={handleCloseForm} maxWidth="sm" fullWidth>
        <DialogTitle>{formState.id ? 'Cập nhật khối học phần' : 'Gán khối học phần cho chương trình'}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} mt={1}>
            <FormControl fullWidth>
              <InputLabel id="program-select-label">Chương trình</InputLabel>
              <Select
                labelId="program-select-label"
                label="Chương trình"
                value={formState.programId}
                onChange={(event) => handleFormChange('programId', event.target.value)}
              >
                {programs.map((program) => (
                  <MenuItem key={program.id} value={program.id}>
                    {program.code ? `${program.code} • ${program.name}` : program.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel id="template-select-label">Template khối học phần</InputLabel>
              <Select
                labelId="template-select-label"
                label="Template khối học phần"
                value={formState.templateId}
                onChange={(event) => handleFormChange('templateId', event.target.value)}
                disabled={templateLoading}
              >
                {templateLoading && <MenuItem value="" disabled>Đang tải...</MenuItem>}
                {templates.map((template) => (
                  <MenuItem key={template.id} value={template.id}>
                    {template.code ? `${template.code} • ${template.title}` : template.title}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {selectedTemplate && (
              <Alert severity={selectedTemplate.isActive ? 'info' : 'warning'}>
                Loại khối: <strong>{getProgramBlockTypeLabel(selectedTemplate.blockType.toLowerCase())}</strong> • Trạng thái template:
                {selectedTemplate.isActive ? ' Đang sử dụng' : ' Tạm dừng'}
              </Alert>
            )}
            <TextField
              label="Thứ tự hiển thị"
              type="number"
              inputProps={{ min: 1 }}
              value={formState.displayOrder}
              onChange={(event) => handleFormChange('displayOrder', event.target.value)}
              fullWidth
            />
            <FormControlLabel
              control={
                <Switch
                  checked={formState.isRequired}
                  onChange={(event) => handleFormChange('isRequired', event.target.checked)}
                />
              }
              label={formState.isRequired ? 'Khối học phần bắt buộc' : 'Khối học phần tuỳ chọn'}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={formState.isActive}
                  onChange={(event) => handleFormChange('isActive', event.target.checked)}
                />
              }
              label={formState.isActive ? 'Kích hoạt trong chương trình' : 'Tạm dừng trong chương trình'}
            />
            <TextField
              label="Tên hiển thị tùy chỉnh"
              value={formState.customTitle}
              onChange={(event) => handleFormChange('customTitle', event.target.value)}
              fullWidth
            />
            <TextField
              label="Mô tả tùy chỉnh"
              value={formState.customDescription}
              onChange={(event) => handleFormChange('customDescription', event.target.value)}
              fullWidth
              multiline
              minRows={2}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseForm} disabled={formSubmitting}>
            Hủy
          </Button>
          <Button onClick={handleSubmitForm} variant="contained" disabled={formSubmitting || programLoading || templateLoading}>
            {formSubmitting ? 'Đang lưu...' : formState.id ? 'Lưu thay đổi' : 'Gán khối học phần'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirm dialog */}
      <Dialog
        open={Boolean(confirmDeleteId)}
        onClose={confirmDeleting ? undefined : () => setConfirmDeleteId(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Xoá khối học phần khỏi chương trình</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary">
            Bạn có chắc chắn muốn xoá khối học phần này? Thao tác không thể hoàn tác.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDeleteId(null)} disabled={confirmDeleting}>
            Hủy
          </Button>
          <Button onClick={handleDelete} color="error" variant="contained" disabled={confirmDeleting}>
            {confirmDeleting ? 'Đang xoá...' : 'Xoá'}
          </Button>
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
    </Box>
  );
}
