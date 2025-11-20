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
  Tooltip,
  Divider,
  Tab,
  Tabs,
} from '@mui/material';
import {
  Add as AddIcon,
  CheckCircle as CheckCircleIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  HelpOutline as HelpOutlineIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  School as SchoolIcon,
  FilterList as FilterIcon,
  ViewList as ViewListIcon,
  Apps as AppsIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { getProgramBlockTypeLabel } from '@/constants/programs';
import { API_ROUTES } from '@/constants/routes';

interface ProgramBlock {
  id: string;
  code: string;
  title: string;
  block_type: string;
  display_order: number;
  _count: {
    ProgramCourseMap: number;
  };
}

interface ProgramBlockGroup {
  id: string;
  code: string;
  title: string;
  group_type: string;
  display_order: number | null;
  description: string | null;
  parent_id: string | null;
  parent?: {
    id: string;
    code: string;
    title: string;
  };
  children: Array<{
    id: string;
    code: string;
    title: string;
    group_type: string;
    display_order: number | null;
  }>;
  _count: {
    ProgramCourseMap: number;
    children: number;
  };
}

interface BlockFormState {
  id: string | null;
  type: 'block' | 'group';
  code: string;
  title: string;
  block_type?: string;
  group_type?: string;
  display_order: number;
  description?: string;
  parent_id?: string;
}

const createEmptyFormState = (): BlockFormState => ({
  id: null,
  type: 'block',
  code: '',
  title: '',
  block_type: '',
  group_type: '',
  display_order: 1,
  description: '',
  parent_id: '',
});

const formatDisplayOrder = (value: number | null) => (value == null ? '—' : value);

type ViewMode = 'table' | 'grid';

export default function ProgramBlocksPage(): JSX.Element {
  const [blocks, setBlocks] = useState<ProgramBlock[]>([]);
  const [groups, setGroups] = useState<ProgramBlockGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentType, setCurrentType] = useState<'blocks' | 'groups'>('blocks');
  const [searchValue, setSearchValue] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('table');

  const [formOpen, setFormOpen] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formState, setFormState] = useState<BlockFormState>(createEmptyFormState);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmDeleting, setConfirmDeleting] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>(
    { open: false, message: '', severity: 'success' },
  );

  const filteredData = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (currentType === 'blocks') {
      return blocks.filter((block) => {
        const matchesSearch =
          term === '' ||
          block.code.toLowerCase().includes(term) ||
          block.title.toLowerCase().includes(term) ||
          block.block_type.toLowerCase().includes(term);
        return matchesSearch;
      });
    } else {
      return groups.filter((group) => {
        const matchesSearch =
          term === '' ||
          group.code.toLowerCase().includes(term) ||
          group.title.toLowerCase().includes(term) ||
          group.group_type.toLowerCase().includes(term) ||
          (group.description && group.description.toLowerCase().includes(term));
        return matchesSearch;
      });
    }
  }, [blocks, groups, searchTerm, currentType]);

  const fetchData = useCallback(async (type?: 'blocks' | 'groups') => {
    try {
      setLoading(true);
      setError(null);
      const fetchType = type || currentType;
      const params = new URLSearchParams({ limit: '200' });
      if (searchTerm.trim()) params.set('search', searchTerm.trim());
      params.set('type', fetchType);

      const res = await fetch(`${API_ROUTES.TMS.PROGRAMS_BLOCKS}?${params.toString()}`);
      const json = await res.json();
      if (!res.ok || !json?.success || !Array.isArray(json.data)) {
        throw new Error(json?.error || `Không thể tải danh sách ${fetchType === 'blocks' ? 'khối học phần' : 'nhóm khối'}`);
      }
      
      if (fetchType === 'blocks') {
        setBlocks(json.data as ProgramBlock[]);
      } else {
        setGroups(json.data as ProgramBlockGroup[]);
      }
    } catch (err) {
      console.error('Failed to fetch data', err);
      setError(err instanceof Error ? err.message : `Không thể tải danh sách ${type === 'blocks' ? 'khối học phần' : 'nhóm khối'}`);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, currentType]);

  const fetchAllData = useCallback(async () => {
    // Fetch both blocks and groups to have complete data for forms
    try {
      setLoading(true);
      setError(null);
      
      const [blocksRes, groupsRes] = await Promise.all([
        fetch(`${API_ROUTES.TMS.PROGRAMS_BLOCKS}?type=blocks&limit=200`),
        fetch(`${API_ROUTES.TMS.PROGRAMS_BLOCKS}?type=groups&limit=200`)
      ]);

      const [blocksJson, groupsJson] = await Promise.all([
        blocksRes.json(),
        groupsRes.json()
      ]);

      if (blocksRes.ok && blocksJson?.success && Array.isArray(blocksJson.data)) {
        setBlocks(blocksJson.data as ProgramBlock[]);
      }

      if (groupsRes.ok && groupsJson?.success && Array.isArray(groupsJson.data)) {
        setGroups(groupsJson.data as ProgramBlockGroup[]);
      }
    } catch (err) {
      console.error('Failed to fetch all data', err);
      setError(err instanceof Error ? err.message : 'Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenCreate = () => {
    // Calculate next display order (highest + 1)
    const maxOrder = currentType === 'blocks' 
      ? Math.max(0, ...blocks.map(b => b.display_order))
      : Math.max(0, ...groups.map(g => g.display_order || 0));
    
    setFormState({
      ...createEmptyFormState(),
      type: currentType === 'blocks' ? 'block' : 'group',
      display_order: maxOrder + 1,
    });
    setFormOpen(true);
  };

  const handleOpenEdit = (item: ProgramBlock | ProgramBlockGroup) => {
    if ('block_type' in item) {
      // It's a ProgramBlock
      const block = item as ProgramBlock;
      setFormState({
        id: block.id,
        type: 'block',
        code: block.code,
        title: block.title,
        block_type: block.block_type,
        display_order: block.display_order,
      });
    } else {
      // It's a ProgramBlockGroup
      const group = item as ProgramBlockGroup;
      setFormState({
        id: group.id,
        type: 'group',
        code: group.code,
        title: group.title,
        group_type: group.group_type,
        display_order: group.display_order || 1,
        description: group.description || '',
        parent_id: group.parent_id || '',
      });
    }
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    if (formSubmitting) return;
    setFormOpen(false);
  };

  const handleFormChange = <K extends keyof BlockFormState>(key: K, value: BlockFormState[K]) => {
    setFormState((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmitForm = async () => {
    if (!formState.code || !formState.title) {
      setSnackbar({ open: true, message: 'Vui lòng nhập mã và tiêu đề', severity: 'error' });
      return;
    }

    const payload: any = {
      type: formState.type,
      code: formState.code.trim(),
      title: formState.title.trim(),
      display_order: formState.display_order,
    };

    if (formState.type === 'block') {
      payload.block_type = formState.block_type?.trim() || 'GENERAL';
    } else {
      payload.group_type = formState.group_type?.trim() || 'GENERAL';
      if (formState.description) payload.description = formState.description.trim();
      if (formState.parent_id) payload.parent_id = Number(formState.parent_id);
    }

    try {
      setFormSubmitting(true);
      if (formState.id) {
        const res = await fetch(API_ROUTES.TMS.PROGRAMS_BLOCKS_BY_ID(formState.id, formState.type), {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data?.error || `Không thể cập nhật ${formState.type === 'block' ? 'khối học phần' : 'nhóm khối'}`);
        }
      } else {
        const res = await fetch(API_ROUTES.TMS.PROGRAMS_BLOCKS, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data?.error || `Không thể tạo ${formState.type === 'block' ? 'khối học phần' : 'nhóm khối'}`);
        }
      }

      setSnackbar({
        open: true,
        message: formState.id 
          ? `Cập nhật ${formState.type === 'block' ? 'khối học phần' : 'nhóm khối'} thành công`
          : `Tạo ${formState.type === 'block' ? 'khối học phần' : 'nhóm khối'} thành công`,
        severity: 'success',
      });
      setFormOpen(false);
      fetchAllData(); // Reload all data to ensure parent options are updated
    } catch (err) {
      setSnackbar({
        open: true,
        message: err instanceof Error ? err.message : 'Có lỗi xảy ra khi xử lý yêu cầu',
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
      const res = await fetch(API_ROUTES.TMS.PROGRAMS_BLOCKS_BY_ID(confirmDeleteId, currentType), {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || `Không thể xoá ${currentType === 'blocks' ? 'khối học phần' : 'nhóm khối'}`);
      }
      setSnackbar({ 
        open: true, 
        message: `Xoá ${currentType === 'blocks' ? 'khối học phần' : 'nhóm khối'} thành công`, 
        severity: 'success' 
      });
      setConfirmDeleteId(null);
      fetchAllData(); // Reload all data to ensure parent options are updated
    } catch (err) {
      setSnackbar({
        open: true,
        message: err instanceof Error ? err.message : `Có lỗi xảy ra khi xoá ${currentType === 'blocks' ? 'khối học phần' : 'nhóm khối'}`,
        severity: 'error',
      });
    } finally {
      setConfirmDeleting(false);
    }
  };

  const currentTypeLabel = useMemo(() => {
    return currentType === 'blocks' ? 'Khối học phần' : 'Nhóm khối học phần';
  }, [currentType]);

  return (
    <Box sx={{ backgroundColor: 'background.default', minHeight: '100vh' }}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ py: 2, px: 2 }}>
        <Link href="/tms" color="inherit" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ArrowBackIcon fontSize="small" />
          TMS
        </Link>
        <Typography color="text.primary">Quản lý {currentTypeLabel}</Typography>
      </Breadcrumbs>

      <Box sx={{ p: 2 }}>
        {/* Header */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h5" component="h1">
              Quản lý {currentTypeLabel}
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenCreate}
              disabled={loading}
            >
              Thêm {currentType === 'blocks' ? 'Khối' : 'Nhóm'}
            </Button>
          </Stack>
        </Paper>

        {/* Tabs */}
        <Paper sx={{ mb: 2 }}>
          <Tabs
            value={currentType}
            onChange={(_, value) => setCurrentType(value)}
            variant="fullWidth"
          >
            <Tab label="Khối kiến thức" value="blocks" />
            <Tab label="Nhóm khối học phần" value="groups" />
          </Tabs>
        </Paper>

        {/* Search and Filters */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
            <TextField
              fullWidth
              placeholder={`Tìm kiếm ${currentTypeLabel.toLowerCase()}...`}
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  setSearchTerm(searchValue);
                }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
            <Stack direction="row" spacing={2}>
              <Button
                variant="outlined"
                onClick={() => setSearchTerm(searchValue)}
                disabled={loading}
              >
                Tìm kiếm
              </Button>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={() => fetchData()}
                disabled={loading}
              >
                Làm mới
              </Button>
            </Stack>
          </Stack>
        </Paper>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Loading */}
        {loading && <LinearProgress sx={{ mb: 2 }} />}

        {/* Data Table */}
        <Paper>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Mã</TableCell>
                  <TableCell>Tiêu đề</TableCell>
                  <TableCell>Loại</TableCell>
                  <TableCell>Thứ tự</TableCell>
                  {currentType === 'groups' && <TableCell>Khối cha</TableCell>}
                  {currentType === 'groups' && <TableCell>Mô tả</TableCell>}
                  <TableCell>Khóa học</TableCell>
                  <TableCell align="right">Thao tác</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={currentType === 'groups' ? 8 : 6} align="center">
                      <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
                        Không có dữ liệu
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredData.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {item.code}
                        </Typography>
                      </TableCell>
                      <TableCell>{item.title}</TableCell>
                      <TableCell>
                        <Chip
                          label={currentType === 'blocks' ? getProgramBlockTypeLabel((item as ProgramBlock).block_type) : (item as ProgramBlockGroup).group_type}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>{formatDisplayOrder(item.display_order)}</TableCell>
                      {currentType === 'groups' && (
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {(item as ProgramBlockGroup).parent ? 
                              `${(item as ProgramBlockGroup).parent!.code} - ${(item as ProgramBlockGroup).parent!.title}` : 
                              'Khối gốc'
                            }
                          </Typography>
                        </TableCell>
                      )}
                      {currentType === 'groups' && (
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {(item as ProgramBlockGroup).description || '—'}
                          </Typography>
                        </TableCell>
                      )}
                      <TableCell>
                        <Chip
                          label={`${currentType === 'blocks' ? (item as ProgramBlock)._count.ProgramCourseMap : (item as ProgramBlockGroup)._count.ProgramCourseMap} khóa học`}
                          size="small"
                          color="secondary"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Tooltip title="Chỉnh sửa">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenEdit(item)}
                              disabled={loading}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Xóa">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => setConfirmDeleteId(item.id)}
                              disabled={loading}
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

        {/* Create/Edit Form Dialog */}
        <Dialog open={formOpen} onClose={handleCloseForm} maxWidth="md" fullWidth>
          <DialogTitle>
            {formState.id ? 'Chỉnh sửa' : 'Thêm mới'} {formState.type === 'block' ? 'Khối học phần' : 'Nhóm khối học phần'}
          </DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  fullWidth
                  label="Mã"
                  value={formState.code}
                  onChange={(e) => handleFormChange('code', e.target.value)}
                  required
                />
                <TextField
                  fullWidth
                  label="Tiêu đề"
                  value={formState.title}
                  onChange={(e) => handleFormChange('title', e.target.value)}
                  required
                />
              </Stack>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  fullWidth
                  label="Thứ tự hiển thị"
                  type="number"
                  value={formState.display_order}
                  onChange={(e) => handleFormChange('display_order', parseInt(e.target.value) || 1)}
                />
                <TextField
                  fullWidth
                  label="Loại"
                  value={formState.type === 'block' ? formState.block_type || '' : formState.group_type || ''}
                  onChange={(e) => {
                    if (formState.type === 'block') {
                      handleFormChange('block_type', e.target.value);
                    } else {
                      handleFormChange('group_type', e.target.value);
                    }
                  }}
                  placeholder="Nhập loại (ví dụ: GENERAL, CORE, MAJOR...)"
                  helperText={
                    <Box>
                      <Typography variant="caption" display="block">
                        <strong>Các loại phổ biến:</strong>
                      </Typography>
                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        {['GENERAL', 'CORE', 'MAJOR', 'ELECTIVE', 'FOUNDATION', 'SUPPORT'].map((type) => (
                          <Chip
                            key={type}
                            label={type}
                            size="small"
                            variant="outlined"
                            onClick={() => {
                              if (formState.type === 'block') {
                                handleFormChange('block_type', type);
                              } else {
                                handleFormChange('group_type', type);
                              }
                            }}
                            sx={{ cursor: 'pointer', mb: 0.5 }}
                          />
                        ))}
                      </Stack>
                    </Box>
                  }
                />
              </Stack>
              {formState.type === 'group' && (
                <>
                  <FormControl fullWidth>
                    <InputLabel>Nhóm khối cha</InputLabel>
                    <Select
                      value={formState.parent_id || ''}
                      onChange={(e) => handleFormChange('parent_id', e.target.value)}
                      label="Gán vào khối"
                      displayEmpty
                    >
                      <MenuItem value="">
                        <em>Không gán vào khối nào (Khối gốc)</em>
                      </MenuItem>
                      {groups
                        .filter(group => group.id !== formState.id) // Exclude self to prevent circular reference
                        .map((group) => (
                          <MenuItem key={group.id} value={group.id}>
                            {group.code} - {group.title}
                          </MenuItem>
                        ))}
                    </Select>
                  </FormControl>
                  <TextField
                    fullWidth
                    label="Mô tả"
                    multiline
                    rows={3}
                    value={formState.description || ''}
                    onChange={(e) => handleFormChange('description', e.target.value)}
                  />
                </>
              )}
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseForm} disabled={formSubmitting}>
              Hủy
            </Button>
            <Button
              variant="contained"
              onClick={handleSubmitForm}
              disabled={formSubmitting}
            >
              {formSubmitting ? 'Đang xử lý...' : (formState.id ? 'Cập nhật' : 'Tạo mới')}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={!!confirmDeleteId} onClose={() => setConfirmDeleteId(null)}>
          <DialogTitle>Xác nhận xóa</DialogTitle>
          <DialogContent>
            <Typography>
              Bạn có chắc chắn muốn xóa {currentTypeLabel.toLowerCase()} này không? Hành động này không thể hoàn tác.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConfirmDeleteId(null)} disabled={confirmDeleting}>
              Hủy
            </Button>
            <Button
              color="error"
              variant="contained"
              onClick={handleDelete}
              disabled={confirmDeleting}
            >
              {confirmDeleting ? 'Đang xóa...' : 'Xóa'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          message={snackbar.message}
        />
      </Box>
    </Box>
  );
}