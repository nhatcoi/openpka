'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Autocomplete,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
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
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  ManageAccounts as ManageAccountsIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import {
  ProgramBlockGroupType,
  ProgramBlockType,
  PROGRAM_BLOCK_GROUP_TYPES,
  getProgramBlockGroupBaseType,
  getProgramBlockGroupTypeLabel,
  getProgramBlockTypeLabel,
} from '@/constants/programs';

interface ProgramOption {
  id: string;
  code: string;
  name: string;
  label: string;
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

interface ProgramBlockOption {
  id: string;
  code: string;
  title: string;
  blockType: ProgramBlockType;
}

interface ProgramBlockListResponse {
  success: boolean;
  data?: {
    items?: {
      id?: string | number;
      code?: string;
      title?: string;
      blockType?: string;
    }[];
  };
  error?: string;
}

interface ProgramBlockGroupRuleItem {
  id: string;
  minCredits: number | null;
  maxCredits: number | null;
  minCourses: number | null;
  maxCourses: number | null;
}

interface ProgramBlockGroupApiItem {
  id?: string | number;
  blockId?: string | number;
  programId?: string | number;
  code?: string;
  title?: string;
  groupType?: ProgramBlockGroupType | string;
  rawGroupType?: string;
  displayOrder?: number;
  block?: {
    id?: string | number;
    code?: string;
    title?: string;
    blockType?: string;
  } | null;
  ruleCount?: number;
  courseCount?: number;
  rules?: {
    id?: string | number;
    minCredits?: number;
    maxCredits?: number;
    minCourses?: number;
    maxCourses?: number;
  }[];
}

interface ProgramBlockGroupApiResponse {
  success: boolean;
  data?: {
    items?: ProgramBlockGroupApiItem[];
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
  error?: string;
}

interface ProgramBlockGroupListItem {
  id: string;
  blockId: string;
  programId: string | null;
  code: string;
  title: string;
  groupType: ProgramBlockGroupType;
  rawGroupType: string;
  displayOrder: number;
  block: {
    id: string;
    code: string;
    title: string;
    blockType: ProgramBlockType;
  } | null;
  ruleCount: number;
  courseCount: number;
  rules: ProgramBlockGroupRuleItem[];
}

interface ProgramBlockGroupRuleFormState {
  groupId: string;
  minCredits: number | '';
  maxCredits: number | '';
  minCourses: number | '';
  maxCourses: number | '';
}

interface PaginationState {
  page: number;
  totalPages: number;
  totalItems: number;
}

const DEFAULT_PAGE_SIZE = 12;

const GROUP_TYPE_OPTIONS = [
  { value: 'all', label: 'Tất cả' },
  ...PROGRAM_BLOCK_GROUP_TYPES.map((type) => ({ value: type, label: getProgramBlockGroupTypeLabel(type) })),
];

const mapGroupApiItem = (item: ProgramBlockGroupApiItem): ProgramBlockGroupListItem => ({
  id: item.id?.toString() ?? '',
  blockId: item.blockId?.toString() ?? '',
  programId: item.programId != null ? item.programId.toString() : null,
  code: item.code ?? '—',
  title: item.title ?? 'Không xác định',
  rawGroupType: item.rawGroupType ?? item.groupType?.toString() ?? '',
  groupType: getProgramBlockGroupBaseType(item.rawGroupType ?? item.groupType),
  displayOrder: item.displayOrder ?? 1,
  block: item.block
    ? {
        id: item.block.id?.toString() ?? '',
        code: item.block.code ?? '—',
        title: item.block.title ?? 'Không xác định',
        blockType: (item.block.blockType ?? ProgramBlockType.CORE) as ProgramBlockType,
      }
    : null,
  ruleCount: item.ruleCount ?? (item.rules?.length ?? 0),
  courseCount: item.courseCount ?? 0,
  rules: (item.rules ?? []).map((rule) => ({
    id: rule.id?.toString() ?? '',
    minCredits: rule.minCredits ?? null,
    maxCredits: rule.maxCredits ?? null,
    minCourses: rule.minCourses ?? null,
    maxCourses: rule.maxCourses ?? null,
  })),
});

function RulesPreview({ rules }: { rules: ProgramBlockGroupRuleItem[] }): JSX.Element | null {
  if (!rules || rules.length === 0) return null;
  return (
    <Stack spacing={0.5} sx={{ mt: 1 }}>
      {rules.map((rule) => {
        const parts: string[] = [];
        if (rule.minCredits != null || rule.maxCredits != null) {
          parts.push(`Tín chỉ: ${rule.minCredits ?? '—'} - ${rule.maxCredits ?? '—'}`);
        }
        if (rule.minCourses != null || rule.maxCourses != null) {
          parts.push(`Học phần: ${rule.minCourses ?? '—'} - ${rule.maxCourses ?? '—'}`);
        }
        return (
          <Typography key={rule.id} variant="caption" color="text.secondary">
            • {parts.join(' • ')}
          </Typography>
        );
      })}
    </Stack>
  );
}

export default function ProgramBlockGroupsPage(): JSX.Element {
  const [programs, setPrograms] = useState<ProgramOption[]>([]);
  const [selectedProgramId, setSelectedProgramId] = useState<string>('');
  const [programBlocks, setProgramBlocks] = useState<ProgramBlockOption[]>([]);
  const [groups, setGroups] = useState<ProgramBlockGroupListItem[]>([]);
  const [pagination, setPagination] = useState<PaginationState>({ page: 1, totalPages: 1, totalItems: 0 });
  const [selectedBlockId, setSelectedBlockId] = useState<string>('all');
  const [selectedGroupType, setSelectedGroupType] = useState<string>('all');
  const [searchValue, setSearchValue] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const [groupDialogOpen, setGroupDialogOpen] = useState<boolean>(false);
  const [groupDialogMode, setGroupDialogMode] = useState<'create' | 'edit'>('create');
  const [groupFormSubmitting, setGroupFormSubmitting] = useState<boolean>(false);
  const [groupFormError, setGroupFormError] = useState<string | null>(null);
  const [editingGroup, setEditingGroup] = useState<ProgramBlockGroupListItem | null>(null);
  const [groupFormState, setGroupFormState] = useState({
    blockId: '',
    code: '',
    title: '',
    groupType: PROGRAM_BLOCK_GROUP_TYPES[0] as ProgramBlockGroupType,
    displayOrder: '' as number | '',
  });

  const [ruleDialogOpen, setRuleDialogOpen] = useState<boolean>(false);
  const [activeRuleGroup, setActiveRuleGroup] = useState<ProgramBlockGroupListItem | null>(null);
  const [ruleFormDialogOpen, setRuleFormDialogOpen] = useState<boolean>(false);
  const [ruleFormSubmitting, setRuleFormSubmitting] = useState<boolean>(false);
  const [ruleFormError, setRuleFormError] = useState<string | null>(null);
  const [ruleFormMode, setRuleFormMode] = useState<'create' | 'edit'>('create');
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [ruleFormState, setRuleFormState] = useState<ProgramBlockGroupRuleFormState>({
    groupId: '',
    minCredits: '',
    maxCredits: '',
    minCourses: '',
    maxCourses: '',
  });

  const selectedProgram = useMemo(
    () => programs.find((option) => option.id === selectedProgramId) ?? null,
    [programs, selectedProgramId],
  );

  const loadPrograms = useCallback(async () => {
    try {
      const response = await fetch('/api/tms/programs/list?limit=200');
      const result: ProgramListApiResponse = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Không thể tải danh sách chương trình');
      }
      const options: ProgramOption[] = (result.data?.items ?? []).map((item) => ({
        id: item.id?.toString() ?? '',
        code: item.code ?? '—',
        name: item.name_vi ?? item.name_en ?? 'Không xác định',
        label: item.label ?? `${item.code ?? ''} — ${item.name_vi ?? item.name_en ?? ''}`.trim(),
      }));
      setPrograms(options);
      if (!selectedProgramId && options.length > 0) {
        setSelectedProgramId(options[0].id);
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Không thể tải danh sách chương trình');
    }
  }, [selectedProgramId]);

  const loadProgramBlocks = useCallback(async (programId: string) => {
    if (!programId) {
      setProgramBlocks([]);
      return;
    }
    try {
      const params = new URLSearchParams({ programId, limit: '200' });
      const response = await fetch(`/api/tms/program-blocks?${params.toString()}`);
      const result: ProgramBlockListResponse = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Không thể tải danh sách khối học phần');
      }
      const mapped: ProgramBlockOption[] = (result.data?.items ?? []).map((item) => ({
        id: item.id?.toString() ?? '',
        code: item.code ?? '—',
        title: item.title ?? 'Không xác định',
        blockType: (item.blockType ?? ProgramBlockType.CORE) as ProgramBlockType,
      }));
      setProgramBlocks(mapped);
    } catch (err) {
      console.error(err);
      setSnackbar({ open: true, message: 'Không thể tải khối học phần', severity: 'error' });
    }
  }, []);

const loadGroups = useCallback(async () => {
    if (!selectedProgramId) {
      setGroups([]);
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
      if (selectedGroupType !== 'all') {
        params.set('groupType', selectedGroupType);
      }
      if (searchTerm) {
        params.set('search', searchTerm);
      }
      const response = await fetch(`/api/tms/program-block-groups?${params.toString()}`);
      const result: ProgramBlockGroupApiResponse = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Không thể tải danh sách nhóm');
      }
      const items = result.data?.items ?? [];
      const mapped = items.map(mapGroupApiItem);
      setGroups(mapped);
      setPagination({
        page: result.data?.pagination?.page ?? pagination.page,
        totalPages: result.data?.pagination?.totalPages ?? 1,
        totalItems: result.data?.pagination?.total ?? mapped.length,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải danh sách nhóm');
      setGroups([]);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, searchTerm, selectedBlockId, selectedGroupType, selectedProgramId]);

  useEffect(() => {
    loadPrograms();
  }, [loadPrograms]);

  useEffect(() => {
    if (selectedProgramId) {
      loadProgramBlocks(selectedProgramId);
    }
  }, [loadProgramBlocks, selectedProgramId]);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  const handleProgramChange = (_event: React.SyntheticEvent, option: ProgramOption | null) => {
    if (!option) return;
    setSelectedProgramId(option.id);
    setPagination({ page: 1, totalPages: 1, totalItems: 0 });
    setSelectedBlockId('all');
  };

  const handleBlockFilterChange = (event: SelectChangeEvent<string>) => {
    setSelectedBlockId(event.target.value);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleGroupTypeFilterChange = (event: SelectChangeEvent<string>) => {
    setSelectedGroupType(event.target.value);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleSearch = () => {
    setPagination((prev) => ({ ...prev, page: 1 }));
    setSearchTerm(searchValue.trim());
  };

  const handleResetFilters = () => {
    setSelectedBlockId('all');
    setSelectedGroupType('all');
    setSearchValue('');
    setSearchTerm('');
    setPagination({ page: 1, totalPages: 1, totalItems: 0 });
  };

  const openCreateGroup = () => {
    if (!selectedProgramId) {
      setSnackbar({ open: true, message: 'Vui lòng chọn chương trình trước.', severity: 'error' });
      return;
    }
    if (programBlocks.length === 0) {
      setSnackbar({ open: true, message: 'Chưa có khối học phần trong chương trình này.', severity: 'error' });
      return;
    }
    setGroupDialogMode('create');
    setEditingGroup(null);
    setGroupFormState({
      blockId: programBlocks[0]?.id ?? '',
      code: '',
      title: '',
      groupType: PROGRAM_BLOCK_GROUP_TYPES[0] as ProgramBlockGroupType,
      displayOrder: (pagination.totalItems || 0) + 1,
    });
    setGroupFormError(null);
    setGroupDialogOpen(true);
  };

  const openEditGroup = (group: ProgramBlockGroupListItem) => {
    setGroupDialogMode('edit');
    setEditingGroup(group);
    setGroupFormState({
      blockId: group.blockId,
      code: group.code,
      title: group.title,
      groupType: group.groupType,
      displayOrder: group.displayOrder,
    });
    setGroupFormError(null);
    setGroupDialogOpen(true);
  };

  const closeGroupDialog = () => {
    if (groupFormSubmitting) return;
    setGroupDialogOpen(false);
    setGroupFormError(null);
  };

  const isGroupFormValid = useMemo(() => {
    return Boolean(
      selectedProgramId &&
        groupFormState.blockId &&
        groupFormState.code.trim() &&
        groupFormState.title.trim() &&
        (groupFormState.displayOrder === '' || Number(groupFormState.displayOrder) > 0),
    );
  }, [groupFormState, selectedProgramId]);

  const handleSubmitGroup = async () => {
    if (!isGroupFormValid) {
      setGroupFormError('Vui lòng điền đầy đủ thông tin.');
      return;
    }
    setGroupFormSubmitting(true);
    setGroupFormError(null);

    const payload = {
      block_id: groupFormState.blockId,
      code: groupFormState.code.trim(),
      title: groupFormState.title.trim(),
      group_type: groupFormState.groupType,
      display_order: groupFormState.displayOrder === '' ? undefined : Number(groupFormState.displayOrder),
    };

    try {
      const endpoint =
        groupDialogMode === 'edit' && editingGroup
          ? `/api/tms/program-block-groups/${editingGroup.id}`
          : '/api/tms/program-block-groups';
      const method = groupDialogMode === 'edit' ? 'PUT' : 'POST';
      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Không thể lưu nhóm khối học phần');
      }
      setSnackbar({
        open: true,
        message: groupDialogMode === 'edit' ? 'Đã cập nhật nhóm' : 'Đã tạo nhóm mới',
        severity: 'success',
      });
      setGroupDialogOpen(false);
      setEditingGroup(null);
      await loadGroups();
    } catch (err) {
      setGroupFormError(err instanceof Error ? err.message : 'Không thể lưu nhóm khối học phần');
    } finally {
      setGroupFormSubmitting(false);
    }
  };

  const handleDeleteGroup = async (group: ProgramBlockGroupListItem) => {
    const confirmed = window.confirm(`Bạn có chắc chắn muốn xóa nhóm "${group.code}"?`);
    if (!confirmed) return;
    try {
      const response = await fetch(`/api/tms/program-block-groups/${group.id}`, { method: 'DELETE' });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Không thể xóa nhóm khối học phần');
      }
      setSnackbar({ open: true, message: 'Đã xóa nhóm', severity: 'success' });
      await loadGroups();
    } catch (err) {
      setSnackbar({ open: true, message: err instanceof Error ? err.message : 'Không thể xóa nhóm', severity: 'error' });
    }
  };

  const openRuleDialog = (group: ProgramBlockGroupListItem) => {
    setActiveRuleGroup(group);
    setRuleDialogOpen(true);
  };

  const closeRuleDialog = () => {
    setRuleDialogOpen(false);
    setActiveRuleGroup(null);
  };

  const openRuleForm = (mode: 'create' | 'edit', group: ProgramBlockGroupListItem, rule?: ProgramBlockGroupRuleItem) => {
    setRuleFormMode(mode);
    setEditingRuleId(rule?.id ?? null);
    setRuleFormState({
      groupId: group.id,
      minCredits: rule?.minCredits ?? '',
      maxCredits: rule?.maxCredits ?? '',
      minCourses: rule?.minCourses ?? '',
      maxCourses: rule?.maxCourses ?? '',
    });
    setRuleFormError(null);
    setRuleFormDialogOpen(true);
  };

  const closeRuleFormDialog = () => {
    if (ruleFormSubmitting) return;
    setRuleFormDialogOpen(false);
    setRuleFormError(null);
    setEditingRuleId(null);
  };

  const handleSubmitRule = async () => {
    if (!ruleFormState.groupId) {
      setRuleFormError('Thiếu thông tin nhóm.');
      return;
    }
    setRuleFormSubmitting(true);
    setRuleFormError(null);

    const payload = {
      group_id: ruleFormState.groupId,
      min_credits: ruleFormState.minCredits === '' ? null : ruleFormState.minCredits,
      max_credits: ruleFormState.maxCredits === '' ? null : ruleFormState.maxCredits,
      min_courses: ruleFormState.minCourses === '' ? null : ruleFormState.minCourses,
      max_courses: ruleFormState.maxCourses === '' ? null : ruleFormState.maxCourses,
    };

    try {
      const endpoint =
        ruleFormMode === 'edit' && editingRuleId
          ? `/api/tms/program-block-group-rules/${editingRuleId}`
          : '/api/tms/program-block-group-rules';
      const method = ruleFormMode === 'edit' ? 'PUT' : 'POST';
      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Không thể lưu quy tắc');
      }
      setSnackbar({
        open: true,
        message: ruleFormMode === 'edit' ? 'Đã cập nhật quy tắc' : 'Đã thêm quy tắc',
        severity: 'success',
      });
      setRuleFormDialogOpen(false);
      setEditingRuleId(null);
      await loadGroups();
    } catch (err) {
      setRuleFormError(err instanceof Error ? err.message : 'Không thể lưu quy tắc');
    } finally {
      setRuleFormSubmitting(false);
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    const confirmed = window.confirm('Bạn có chắc chắn muốn xóa quy tắc này?');
    if (!confirmed) return;
    try {
      const response = await fetch(`/api/tms/program-block-group-rules/${ruleId}`, { method: 'DELETE' });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Không thể xóa quy tắc');
      }
      setSnackbar({ open: true, message: 'Đã xóa quy tắc', severity: 'success' });
      await loadGroups();
    } catch (err) {
      setSnackbar({ open: true, message: err instanceof Error ? err.message : 'Không thể xóa quy tắc', severity: 'error' });
    }
  };

  const currentGroups = useMemo(() => groups, [groups]);

  const handlePageChange = (_: React.ChangeEvent<unknown>, newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  useEffect(() => {
    if (!activeRuleGroup) return;
    const updated = groups.find((group) => group.id === activeRuleGroup.id);
    if (updated && updated !== activeRuleGroup) {
      setActiveRuleGroup(updated);
    }
  }, [groups, activeRuleGroup]);

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ xs: 'flex-start', md: 'center' }} sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
          Quản lý nhóm khối học phần
        </Typography>
        <Stack direction="row" spacing={1} alignItems="center">
          <Tooltip title="Làm mới">
            <span>
              <IconButton onClick={loadGroups} disabled={loading}>
                <RefreshIcon />
              </IconButton>
            </span>
          </Tooltip>
          <Autocomplete
            options={programs}
            value={selectedProgram}
            onChange={handleProgramChange}
            sx={{ minWidth: { xs: 240, md: 320 } }}
            getOptionLabel={(option) => option.label}
            loading={programs.length === 0}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Chọn chương trình"
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {programs.length === 0 ? <CircularProgress color="inherit" size={16} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
          />
        </Stack>
      </Stack>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ xs: 'stretch', md: 'center' }}>
          <FormControl sx={{ minWidth: { md: 220 } }} disabled={!selectedProgramId || programBlocks.length === 0}>
            <InputLabel id="block-filter-label">Khối học phần</InputLabel>
            <Select
              labelId="block-filter-label"
              label="Khối học phần"
              value={selectedBlockId}
              onChange={handleBlockFilterChange}
            >
              <MenuItem value="all">Tất cả</MenuItem>
              {programBlocks.map((block) => (
                <MenuItem key={block.id} value={block.id}>
                  {block.code} — {block.title}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl sx={{ minWidth: { md: 200 } }}>
            <InputLabel id="group-type-filter-label">Loại nhóm</InputLabel>
            <Select
              labelId="group-type-filter-label"
              label="Loại nhóm"
              value={selectedGroupType}
              onChange={handleGroupTypeFilterChange}
            >
              {GROUP_TYPE_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="Tìm kiếm theo mã/tên nhóm"
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') handleSearch();
            }}
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

          <Button variant="outlined" onClick={handleResetFilters}>
            Đặt lại
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreateGroup}>
            Thêm nhóm
          </Button>
        </Stack>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Paper variant="outlined" sx={{ py: 6, textAlign: 'center' }}>
          <CircularProgress size={32} />
        </Paper>
      ) : currentGroups.length === 0 ? (
        <Paper variant="outlined" sx={{ py: 6, textAlign: 'center' }}>
          <Typography>Chưa có nhóm khối học phần nào.</Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {currentGroups.map((group) => (
            <Grid item xs={12} md={6} key={group.id}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardHeader
                  title={
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Typography variant="h6" component="span">
                        {group.code} — {group.title}
                      </Typography>
                      <Chip
                        label={getProgramBlockGroupTypeLabel(group.groupType)}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </Stack>
                  }
                  subheader={
                    group.block
                      ? `${group.block.code} • ${group.block.title} • ${getProgramBlockTypeLabel(group.block.blockType)}`
                      : 'Khối học phần không xác định'
                  }
                  action={
                    <Stack direction="row" spacing={1}>
                      <Tooltip title="Quản lý quy tắc">
                        <IconButton onClick={() => openRuleDialog(group)}>
                          <ManageAccountsIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Chỉnh sửa">
                        <IconButton onClick={() => openEditGroup(group)}>
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Xóa">
                        <IconButton onClick={() => handleDeleteGroup(group)}>
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  }
                />
                <CardContent>
                  <Stack spacing={1}>
                    <Stack direction="row" spacing={1}>
                      <Chip label={`${group.courseCount} học phần`} size="small" variant="outlined" />
                      <Chip label={`${group.ruleCount} quy tắc`} size="small" variant="outlined" />
                    </Stack>
                    <RulesPreview rules={group.rules} />
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {pagination.totalPages > 1 && (
        <Stack direction="row" justifyContent="center" sx={{ mt: 3 }}>
          <Pagination
            page={pagination.page}
            count={pagination.totalPages}
            color="primary"
            shape="rounded"
            onChange={handlePageChange}
          />
        </Stack>
      )}

      <Dialog open={groupDialogOpen} onClose={closeGroupDialog} fullWidth maxWidth="sm">
        <DialogTitle>{groupDialogMode === 'edit' ? 'Cập nhật nhóm khối học phần' : 'Thêm nhóm khối học phần'}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel id="group-block-label">Khối học phần</InputLabel>
              <Select
                labelId="group-block-label"
                label="Khối học phần"
                value={groupFormState.blockId}
                onChange={(event) => setGroupFormState((prev) => ({ ...prev, blockId: event.target.value }))}
              >
                {programBlocks.map((block) => (
                  <MenuItem key={block.id} value={block.id}>
                    {block.code} — {block.title}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Mã nhóm"
              value={groupFormState.code}
              onChange={(event) => setGroupFormState((prev) => ({ ...prev, code: event.target.value }))}
              required
            />
            <TextField
              label="Tên nhóm"
              value={groupFormState.title}
              onChange={(event) => setGroupFormState((prev) => ({ ...prev, title: event.target.value }))}
              required
            />
            <FormControl fullWidth>
              <InputLabel id="group-type-label">Loại nhóm</InputLabel>
              <Select
                labelId="group-type-label"
                label="Loại nhóm"
                value={groupFormState.groupType}
                onChange={(event) =>
                  setGroupFormState((prev) => ({ ...prev, groupType: event.target.value as ProgramBlockGroupType }))
                }
              >
                {GROUP_TYPE_OPTIONS.filter((option) => option.value !== 'all').map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Thứ tự hiển thị"
              type="number"
              value={groupFormState.displayOrder}
              onChange={(event) => {
                const value = event.target.value;
                setGroupFormState((prev) => ({ ...prev, displayOrder: value === '' ? '' : Number(value) }));
              }}
              inputProps={{ min: 1 }}
            />
            {groupFormError && <Alert severity="error">{groupFormError}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeGroupDialog} disabled={groupFormSubmitting}>
            Đóng
          </Button>
          <Button onClick={handleSubmitGroup} variant="contained" disabled={groupFormSubmitting || !isGroupFormValid}>
            {groupFormSubmitting ? 'Đang lưu...' : 'Lưu'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={ruleDialogOpen} onClose={closeRuleDialog} fullWidth maxWidth="sm">
        <DialogTitle>Quy tắc của nhóm {activeRuleGroup?.code}</DialogTitle>
        <DialogContent dividers>
          {activeRuleGroup?.rules?.length ? (
            <Stack spacing={1.5}>
              {activeRuleGroup.rules.map((rule) => (
                <Paper key={rule.id} variant="outlined" sx={{ p: 1.5 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <RulesPreview rules={[rule]} />
                    <Stack direction="row" spacing={1}>
                      <Tooltip title="Chỉnh sửa">
                        <IconButton onClick={() => activeRuleGroup && openRuleForm('edit', activeRuleGroup, rule)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Xóa">
                        <IconButton onClick={() => handleDeleteRule(rule.id)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </Stack>
                </Paper>
              ))}
            </Stack>
          ) : (
            <Alert severity="info">Nhóm này chưa có quy tắc.</Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            startIcon={<AddIcon />}
            onClick={() => activeRuleGroup && openRuleForm('create', activeRuleGroup)}
          >
            Thêm quy tắc
          </Button>
          <Button onClick={closeRuleDialog}>Đóng</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={ruleFormDialogOpen} onClose={closeRuleFormDialog} fullWidth maxWidth="sm">
        <DialogTitle>{ruleFormMode === 'edit' ? 'Cập nhật quy tắc' : 'Thêm quy tắc'}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Tín chỉ tối thiểu"
              type="number"
              value={ruleFormState.minCredits}
              onChange={(event) => {
                const value = event.target.value;
                setRuleFormState((prev) => ({ ...prev, minCredits: value === '' ? '' : Number(value) }));
              }}
            />
            <TextField
              label="Tín chỉ tối đa"
              type="number"
              value={ruleFormState.maxCredits}
              onChange={(event) => {
                const value = event.target.value;
                setRuleFormState((prev) => ({ ...prev, maxCredits: value === '' ? '' : Number(value) }));
              }}
            />
            <TextField
              label="Số học phần tối thiểu"
              type="number"
              value={ruleFormState.minCourses}
              onChange={(event) => {
                const value = event.target.value;
                setRuleFormState((prev) => ({ ...prev, minCourses: value === '' ? '' : Number(value) }));
              }}
            />
            <TextField
              label="Số học phần tối đa"
              type="number"
              value={ruleFormState.maxCourses}
              onChange={(event) => {
                const value = event.target.value;
                setRuleFormState((prev) => ({ ...prev, maxCourses: value === '' ? '' : Number(value) }));
              }}
            />
            {ruleFormError && <Alert severity="error">{ruleFormError}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeRuleFormDialog} disabled={ruleFormSubmitting}>
            Đóng
          </Button>
          <Button onClick={handleSubmitRule} variant="contained" disabled={ruleFormSubmitting}>
            {ruleFormSubmitting ? 'Đang lưu...' : 'Lưu'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
