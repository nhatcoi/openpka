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
  Breadcrumbs,
  Link,
} from '@mui/material';
import {
  Delete as DeleteIcon,
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
  groupId: string | null;
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
  groupId?: string | number | null;
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

  const [availableCourses, setAvailableCourses] = useState<CourseOption[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);

  // Bulk assign state
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [bulkFormSubmitting, setBulkFormSubmitting] = useState(false);
  const [bulkSelectedCourses, setBulkSelectedCourses] = useState<string[]>([]);
  const [bulkBlockId, setBulkBlockId] = useState<string | null>(null);
  const [bulkGroupId, setBulkGroupId] = useState<string | null>(null);
  const [bulkBlockOptions, setBulkBlockOptions] = useState<ProgramBlockOption[]>([]);
  const [groupOptions, setGroupOptions] = useState<Array<{ id: string; code: string; title: string }>>([]);
  const [bulkRequired, setBulkRequired] = useState<boolean>(true);
  const [bulkStartOrder, setBulkStartOrder] = useState<number | ''>('');
  const [bulkDragIndex, setBulkDragIndex] = useState<number | null>(null);
  const [leftListIds, setLeftListIds] = useState<string[]>([]);
  const [draggingCourseId, setDraggingCourseId] = useState<string | null>(null);
  const [existingCourseIds, setExistingCourseIds] = useState<Set<string>>(new Set());
  
  // Constraints state: Map<courseId, constraints JSON>
  const [courseConstraints, setCourseConstraints] = useState<Record<string, {
    courses: Array<{
      course_id: string;
      code: string;
      name: string;
      type: string;
    }>;
  }>>({});
  const [editingConstraintsCourseId, setEditingConstraintsCourseId] = useState<string | null>(null);
  const [constraintsDialogOpen, setConstraintsDialogOpen] = useState(false);
  const [newConstraintType, setNewConstraintType] = useState<string>('PRIOR');

  const loadBulkBlockOptions = useCallback(async (_programId?: string) => {
    try {
      // Use templates mode to fetch available block templates
      const paramsBlk = new URLSearchParams({ templates: 'true', limit: '200' });
      const resBlk = await fetch(`/api/tms/program-blocks?${paramsBlk.toString()}`);
      const jsonBlk = await resBlk.json();
      if (resBlk.ok && jsonBlk?.success) {
        const itemsBlk = Array.isArray(jsonBlk.data?.items) ? jsonBlk.data.items : Array.isArray(jsonBlk.data) ? jsonBlk.data : [];
        const mappedBlk: ProgramBlockOption[] = itemsBlk.map((item: any) => ({
          id: item.id?.toString() ?? '',
          code: item.code ?? '—',
          title: item.title ?? 'Không xác định',
          blockType: (item.blockType ?? ProgramBlockType.CORE) as ProgramBlockType,
        }));
        setBulkBlockOptions(mappedBlk);
      } else {
        setBulkBlockOptions([]);
      }
    } catch {
      setBulkBlockOptions([]);
    }
  }, []);

  // Load course prerequisites and initialize constraints
  const loadCoursePrerequisites = useCallback(async (courseId: string) => {
    try {
      const response = await fetch(`/api/tms/courses/${courseId}`);
      const result = await response.json();
      if (response.ok && result?.success && result.data) {
        const course = result.data;
        const prerequisites = course.prerequisites || [];
        // Convert prerequisites to constraints format
        const constraints = {
          courses: prerequisites.map((prereq: any) => ({
            course_id: prereq.prerequisite_course?.id?.toString() || prereq.prerequisite_course_id?.toString() || '',
            code: prereq.prerequisite_course?.code || '',
            name: prereq.prerequisite_course?.name_vi || prereq.prerequisite_course?.name_en || '',
            type: prereq.prerequisite_type || 'PRIOR',
          })).filter((c: any) => c.course_id),
        };
        setCourseConstraints((prev) => ({
          ...prev,
          [courseId]: constraints,
        }));
      }
    } catch (err) {
      // Initialize empty constraints if load fails
      setCourseConstraints((prev) => ({
        ...prev,
        [courseId]: { courses: [] },
      }));
    }
  }, []);

  const loadGroupOptions = useCallback(async (programId?: string) => {
    try {
      const params = new URLSearchParams({ limit: '200' });
      if (programId) params.set('programId', programId);
      const res = await fetch(`/api/tms/program-groups?${params.toString()}`);
      const json = await res.json();
      if (res.ok && json?.success) {
        const items = Array.isArray(json.data?.items) ? json.data.items : [];
        setGroupOptions(items.map((g: any) => ({ id: g.id?.toString() ?? '', code: g.code ?? '—', title: g.title ?? '' })));
      } else {
        setGroupOptions([]);
      }
    } catch {
      setGroupOptions([]);
    }
  }, []);

  const loadExistingCourseIds = useCallback(async (programId: string, updateState = true): Promise<Set<string>> => {
    try {
      const params = new URLSearchParams({ programId, limit: '10000' });
      const res = await fetch(`/api/tms/program-course-map?${params.toString()}`);
      const json = await res.json();
      if (res.ok && json?.success) {
        const items = Array.isArray(json.data?.items) ? json.data.items : [];
        const ids = new Set<string>(items
          .map((it: any) => it?.courseId?.toString?.() ?? it?.course?.id?.toString?.())
          .filter((v: any) => typeof v === 'string' && v.length > 0));
        if (updateState) {
          setExistingCourseIds(ids);
        }
        return ids;
      }
      const emptySet = new Set<string>();
      if (updateState) {
        setExistingCourseIds(emptySet);
      }
      return emptySet;
    } catch {
      const emptySet = new Set<string>();
      if (updateState) {
        setExistingCourseIds(emptySet);
      }
      return emptySet;
    }
  }, []);

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
      // Silently fail - user can retry with refresh button
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
      setProgramBlocks([]);
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
        groupId: item.groupId != null ? item.groupId.toString() : null,
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
      const response = await fetch('/api/tms/courses?limit=200&list=true&status=APPROVED,PUBLISHED');
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
      setAvailableCourses([]);
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
      loadExistingCourseIds(selectedProgramId);
    }
  }, [fetchProgramBlocks, loadExistingCourseIds, selectedProgramId]);

  // Update leftListIds when existingCourseIds changes (after program change)
  useEffect(() => {
    if (selectedProgramId && availableCourses.length > 0) {
      const updatedLeft = availableCourses
        .filter((c) => !existingCourseIds.has(c.id))
        .map((c) => c.id);
      setLeftListIds(updatedLeft);
    }
  }, [existingCourseIds, availableCourses, selectedProgramId]);

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

  const handlePageChange = useCallback((_: React.ChangeEvent<unknown>, newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  }, []);

  const handleOpenBulkDialog = useCallback(async () => {
    if (!selectedProgramId) {
      setSnackbar({ open: true, message: 'Vui lòng chọn chương trình trước khi gán hàng loạt.', severity: 'error' });
      return;
    }
    setBulkSelectedCourses([]);
    setBulkBlockId(null);
    setBulkGroupId(null);
    setBulkRequired(true);
    setBulkStartOrder(pagination.totalItems + 1);
    
    const existingIds = await loadExistingCourseIds(selectedProgramId, false);
    const initialLeft = availableCourses
      .filter((c) => !existingIds.has(c.id))
      .map((c) => c.id);
    setLeftListIds(initialLeft);
    
    await Promise.all([
      loadGroupOptions(selectedProgramId),
      loadBulkBlockOptions(selectedProgramId),
    ]);
    
    setBulkDialogOpen(true);
    if (availableCourses.length === 0) {
      fetchCourses();
    }
  }, [selectedProgramId, pagination.totalItems, availableCourses, loadExistingCourseIds, loadGroupOptions, loadBulkBlockOptions, fetchCourses]);

  const handleBulkSubmit = useCallback(async () => {
    try {
      setBulkFormSubmitting(true);
      const payload = {
        program_id: selectedProgramId,
        block_id: bulkBlockId ?? null,
        group_id: bulkGroupId ?? null,
        items: bulkSelectedCourses.map((cid, idx) => ({
          course_id: cid,
          is_required: bulkRequired,
          display_order: bulkStartOrder === '' ? undefined : Number(bulkStartOrder) + idx,
          constraints: courseConstraints[cid] || null,
        })),
      };
      const response = await fetch('/api/tms/program-course-map/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Không thể gán học phần hàng loạt');
      }
      setSnackbar({ open: true, message: 'Đã gán học phần hàng loạt', severity: 'success' });
      setBulkDialogOpen(false);
      setBulkSelectedCourses([]);
      setCourseConstraints({});
      fetchMappings();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể gán học phần hàng loạt';
      setSnackbar({ open: true, message, severity: 'error' });
    } finally {
      setBulkFormSubmitting(false);
    }
  }, [selectedProgramId, bulkBlockId, bulkGroupId, bulkSelectedCourses, bulkRequired, bulkStartOrder, courseConstraints, fetchMappings]);

  const handleRemoveCourse = useCallback((courseId: string) => {
    setBulkSelectedCourses((prev) => prev.filter((x) => x !== courseId));
    setCourseConstraints((prev) => {
      const updated = { ...prev };
      delete updated[courseId];
      return updated;
    });
  }, []);

  const handleEditConstraints = useCallback((courseId: string) => {
    if (!courseConstraints[courseId]) {
      loadCoursePrerequisites(courseId);
    }
    setEditingConstraintsCourseId(courseId);
    setConstraintsDialogOpen(true);
  }, [courseConstraints, loadCoursePrerequisites]);

  const handleRemoveConstraint = useCallback((courseId: string, index: number) => {
    setCourseConstraints((prev) => {
      const updated = { ...prev };
      if (updated[courseId]) {
        updated[courseId] = {
          courses: updated[courseId].courses.filter((_: any, i: number) => i !== index),
        };
      }
      return updated;
    });
  }, []);

  const handleUpdateConstraintType = useCallback((courseId: string, index: number, newType: string) => {
    setCourseConstraints((prev) => {
      const updated = { ...prev };
      if (updated[courseId]) {
        updated[courseId] = {
          courses: updated[courseId].courses.map((item: any, i: number) =>
            i === index ? { ...item, type: newType } : item
          ),
        };
      }
      return updated;
    });
  }, []);

  const handleAddConstraint = useCallback((courseId: string, newCourse: CourseOption) => {
    setCourseConstraints((prev) => {
      const updated = { ...prev };
      if (!updated[courseId]) {
        updated[courseId] = { courses: [] };
      }
      updated[courseId] = {
        courses: [
          ...updated[courseId].courses,
          {
            course_id: newCourse.id,
            code: newCourse.code,
            name: newCourse.name,
            type: newConstraintType,
          },
        ],
      };
      return updated;
    });
  }, [newConstraintType]);

  const handleDragDropReorder = useCallback((dragIndex: number, dropIndex: number) => {
    if (dragIndex === null || dragIndex === dropIndex) return;
    const updated = [...bulkSelectedCourses];
    const [moved] = updated.splice(dragIndex, 1);
    updated.splice(dropIndex, 0, moved);
    setBulkSelectedCourses(updated);
    setBulkDragIndex(null);
  }, [bulkSelectedCourses]);

  const handleAddCourseToList = useCallback((courseId: string) => {
    if (!bulkSelectedCourses.includes(courseId)) {
      setBulkSelectedCourses((prev) => [...prev, courseId]);
      loadCoursePrerequisites(courseId);
    }
  }, [bulkSelectedCourses, loadCoursePrerequisites]);


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
            href="/tms/programs"
            sx={{ textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
          >
            Chương trình đào tạo
          </Link>
          <Typography color="text.primary">Bản đồ học phần</Typography>
        </Breadcrumbs>

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
            <Button variant="outlined" onClick={handleOpenBulkDialog} disabled={!selectedProgramId}>
              Gán học phần
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
                            Hãy nhấn &quot;Gán hàng loạt&quot; để bắt đầu xây dựng bản đồ học phần.
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
                            <Tooltip title="Xóa">
                              <IconButton onClick={() => handleDelete(mapping)} color="error">
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

        {/* Bulk assign dialog */}
        <Dialog 
          open={bulkDialogOpen} 
          onClose={() => { 
            if (!bulkFormSubmitting) {
              setBulkDialogOpen(false);
              setBulkSelectedCourses([]);
              setCourseConstraints({});
            }
          }} 
          fullWidth 
          maxWidth="md"
        >
          <DialogTitle>Gán học phần hàng loạt cho một khối</DialogTitle>
          <DialogContent dividers>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mt: 1 }}>
              {/* Left: source list and options */}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Stack spacing={2}>
                  <FormControl>
                    <InputLabel id="bulk-block-label">Gán vào khối</InputLabel>
                    <Select
                        labelId="bulk-block-label"
                        label="Gán vào khối"
                        value={bulkBlockId ?? 'null'}
                        onOpen={() => { if (selectedProgramId) loadBulkBlockOptions(selectedProgramId); }}
                        onChange={(event) => {
                          const value = event.target.value as string;
                          setBulkBlockId(value === 'null' ? null : value);
                        }}
                        disabled={bulkBlockOptions.length === 0}
                    >
                      <MenuItem value="null">Không thuộc khối</MenuItem>
                      {bulkBlockOptions.map((block) => (
                          <MenuItem key={block.id} value={block.id}>
                            {block.code} — {block.title} ({getProgramBlockTypeLabel(block.blockType)})
                          </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl>
                    <InputLabel id="bulk-group-label">Nhóm (tuỳ chọn)</InputLabel>
                    <Select
                        labelId="bulk-group-label"
                        label="Nhóm (tuỳ chọn)"
                        value={bulkGroupId ?? 'null'}
                        onOpen={() => loadGroupOptions(selectedProgramId)}
                        onChange={(event) => {
                          const value = event.target.value as string;
                          setBulkGroupId(value === 'null' ? null : value);
                        }}
                    >
                      <MenuItem value="null">Không thuộc nhóm</MenuItem>
                      {groupOptions.map((g) => (
                          <MenuItem key={g.id} value={g.id}>{g.code} — {g.title}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl component="fieldset">
                    <RadioGroup
                        row
                        value={bulkRequired ? 'true' : 'false'}
                        onChange={(event) => setBulkRequired(event.target.value === 'true')}
                    >
                      <FormControlLabel value="true" control={<Radio />} label="Bắt buộc" />
                      <FormControlLabel value="false" control={<Radio />} label="Tự chọn" />
                    </RadioGroup>
                  </FormControl>

                  <TextField
                      label="Thứ tự bắt đầu"
                      type="number"
                      value={bulkStartOrder}
                      onChange={(event) => {
                        const value = event.target.value;
                        setBulkStartOrder(value === '' ? '' : Number(value));
                      }}
                      inputProps={{ min: 1 }}
                  />

                  <TextField
                      label="Tìm kiếm học phần"
                      placeholder="Nhập mã hoặc tên"
                      onChange={(e) => {
                        const q = e.target.value.trim().toLowerCase();
                        const all = availableCourses.filter((c) => !existingCourseIds.has(c.id) && !bulkSelectedCourses.includes(c.id));
                        const filtered = q
                          ? all.filter((c) => (c.code + ' ' + c.name).toLowerCase().includes(q))
                          : all;
                        setLeftListIds(filtered.map((c) => c.id));
                      }}
                  />

                  {/* Left list */}
                  <Paper variant="outlined" sx={{ p: 1, maxHeight: 360, overflow: 'auto' }}>
                    <Stack spacing={1}>
                      {leftListIds.map((cid) => {
                        const c = availableCourses.find((x) => x.id === cid);
                        if (!c) return null;
                        return (
                            <Box
                                key={cid}
                                draggable
                                onDragStart={() => setDraggingCourseId(cid)}
                                onDoubleClick={() => handleAddCourseToList(cid)}
                                sx={{
                                  px: 1.5,
                                  py: 1,
                                  borderRadius: 1,
                                  border: '1px solid',
                                  borderColor: 'divider',
                                  bgcolor: 'background.paper',
                                  cursor: 'grab',
                                  '&:active': { cursor: 'grabbing' },
                                }}
                            >
                              <Typography variant="body2">{c.code} — {c.name}</Typography>
                            </Box>
                        );
                      })}
                      {leftListIds.length === 0 && (
                          <Typography variant="body2" color="text.secondary">Không còn học phần để thêm.</Typography>
                      )}
                    </Stack>
                  </Paper>
                </Stack>
              </Box>

              {/* Right: selected list and preview */}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Đã chọn</Typography>
                <Paper
                    variant="outlined"
                    sx={{ p: 1, minHeight: 360, maxHeight: 360, overflow: 'auto' }}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => {
                      if (draggingCourseId) {
                        handleAddCourseToList(draggingCourseId);
                        setDraggingCourseId(null);
                      }
                    }}
                >
                  <Stack spacing={1}>
                    {bulkSelectedCourses.map((cid, idx) => {
                      const course = availableCourses.find((c) => c.id === cid);
                      const label = course ? `${course.code} — ${course.name}` : cid;
                      const constraints = courseConstraints[cid];
                      const constraintsCount = constraints?.courses?.length || 0;
                      return (
                          <Box
                              key={cid}
                              draggable
                              onDragStart={() => setBulkDragIndex(idx)}
                              onDragOver={(e) => e.preventDefault()}
                              onDrop={() => {
                                if (bulkDragIndex !== null && bulkDragIndex !== idx) {
                                  handleDragDropReorder(bulkDragIndex, idx);
                                }
                              }}
                              sx={{
                                px: 1.5,
                                py: 1,
                                borderRadius: 1,
                                border: '1px solid',
                                borderColor: 'divider',
                                bgcolor: 'background.paper',
                                cursor: 'grab',
                                '&:active': { cursor: 'grabbing' },
                              }}
                          >
                            <Stack spacing={0.5}>
                              <Stack direction="row" justifyContent="space-between" alignItems="center">
                                <Typography variant="body2">{idx + 1}. {label}</Typography>
                                <Stack direction="row" spacing={1}>
                                  <Button
                                      size="small"
                                      onClick={() => handleEditConstraints(cid)}
                                  >
                                    Điều kiện {constraintsCount > 0 && `(${constraintsCount})`}
                                  </Button>
                                  <Button size="small" onClick={() => handleRemoveCourse(cid)}>Bỏ</Button>
                                </Stack>
                              </Stack>
                              {constraintsCount > 0 && (
                                  <Box sx={{ pl: 2, pt: 0.5 }}>
                                    <Typography variant="caption" color="text.secondary">
                                      Điều kiện: {constraints.courses.map((c: any) => `${c.code} - ${c.name}`).join(', ')}
                                    </Typography>
                                  </Box>
                              )}
                            </Stack>
                          </Box>
                      );
                    })}
                    {bulkSelectedCourses.length === 0 && (
                        <Typography variant="body2" color="text.secondary">Kéo học phần từ bên trái qua đây để chọn.</Typography>
                    )}
                  </Stack>
                </Paper>

                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>Xem trước cấu trúc</Typography>
                  <Paper variant="outlined" sx={{ p: 1.5 }}>
                    {/* Block */}
                    <Stack spacing={0.5}>
                      <Typography variant="body2" fontWeight={600}>Khối</Typography>
                      <Box sx={{ pl: 2 }}>
                        {(() => {
                          const blk = bulkBlockId ? bulkBlockOptions.find((b) => b.id === bulkBlockId) : null;
                          return blk ? (
                            <Typography variant="body2">{`${blk.code} — ${blk.title} (${getProgramBlockTypeLabel(blk.blockType)})`}</Typography>
                          ) : (
                            <Typography variant="body2" color="text.secondary">Không thuộc khối</Typography>
                          );
                        })()}
                      </Box>

                      {/* Group */}
                      <Typography variant="body2" fontWeight={600} sx={{ mt: 1 }}>Nhóm khối</Typography>
                      <Box sx={{ pl: 2 }}>
                        {(() => {
                          const grp = bulkGroupId ? groupOptions.find((g) => g.id === bulkGroupId) : null;
                          return grp ? (
                            <Typography variant="body2">{`${grp.code} — ${grp.title}`}</Typography>
                          ) : (
                            <Typography variant="body2" color="text.secondary">Không thuộc nhóm</Typography>
                          );
                        })()}
                      </Box>

                      {/* Courses */}
                      <Typography variant="body2" fontWeight={600} sx={{ mt: 1 }}>Học phần</Typography>
                      <Box sx={{ pl: 2 }}>
                        {bulkSelectedCourses.length > 0 ? (
                            <Stack spacing={0.5}>
                              {bulkSelectedCourses.map((cid, idx) => {
                                const course = availableCourses.find((c) => c.id === cid);
                                const orderBase = bulkStartOrder === '' ? 1 : Number(bulkStartOrder);
                                const indexLabel = `${orderBase + idx}.`;
                                return (
                                    <Typography key={cid} variant="body2">{indexLabel} {course ? `${course.code} — ${course.name}` : cid}</Typography>
                                );
                              })}
                            </Stack>
                        ) : (
                            <Typography variant="body2" color="text.secondary">Chưa chọn học phần</Typography>
                        )}
                      </Box>
                    </Stack>
                  </Paper>
                </Box>
              </Box>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setBulkDialogOpen(false)} disabled={bulkFormSubmitting}>Hủy</Button>
            <Button
                variant="contained"
                disabled={bulkFormSubmitting || bulkSelectedCourses.length === 0}
                onClick={handleBulkSubmit}
            >
              {bulkFormSubmitting ? 'Đang lưu...' : 'Gán'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Constraints editing dialog */}
        <Dialog open={constraintsDialogOpen} onClose={() => setConstraintsDialogOpen(false)} fullWidth maxWidth="md">
          <DialogTitle>
            {(() => {
              const course = editingConstraintsCourseId 
                ? availableCourses.find((c) => c.id === editingConstraintsCourseId)
                : null;
              return course 
                ? `Chỉnh sửa điều kiện học phần - ${course.code} - ${course.name}`
                : 'Chỉnh sửa điều kiện học phần';
            })()}
          </DialogTitle>
          <DialogContent dividers>
            {editingConstraintsCourseId && (() => {
              const courseId = editingConstraintsCourseId;
              const constraints = courseConstraints[courseId] || { courses: [] };
              const currentCourses = constraints.courses || [];
              
              return (
                <Stack spacing={2} sx={{ mt: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Điều kiện học phần cho CTĐT này. Có thể chỉnh sửa từ điều kiện chung của học phần.
                  </Typography>
                  
                  {/* List of current constraints */}
                  <Box>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>Điều kiện hiện tại:</Typography>
                    {currentCourses.length === 0 ? (
                      <Typography variant="body2" color="text.secondary">Chưa có điều kiện</Typography>
                    ) : (
                      <Stack spacing={1}>
                        {currentCourses.map((c: any, idx: number) => (
                          <Paper key={idx} variant="outlined" sx={{ p: 1.5 }}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                              <Box>
                                <Typography variant="body2" fontWeight={600}>
                                  {c.code} - {c.name}
                                </Typography>
                                <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
                                  <FormControl size="small" sx={{ minWidth: 200 }}>
                                    <InputLabel>Loại điều kiện</InputLabel>
                                    <Select
                                      value={c.type || 'PRIOR'}
                                      label="Loại điều kiện"
                                      onChange={(e) => handleUpdateConstraintType(courseId, idx, e.target.value)}
                                    >
                                      <MenuItem value="PRIOR">Học trước</MenuItem>
                                      <MenuItem value="PREREQUISITE">Tiên quyết</MenuItem>
                                      <MenuItem value="COREQUISITE">Học đồng thời</MenuItem>
                                    </Select>
                                  </FormControl>
                                </Stack>
                              </Box>
                              <IconButton
                                size="small"
                                onClick={() => handleRemoveConstraint(courseId, idx)}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Stack>
                          </Paper>
                        ))}
                      </Stack>
                    )}
                  </Box>

                  {/* Add new constraint */}
                  <Box>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>Thêm điều kiện:</Typography>
                    <Stack spacing={2}>
                      <FormControl component="fieldset">
                        <Typography variant="body2" sx={{ mb: 1 }}>Loại điều kiện:</Typography>
                        <RadioGroup
                          row
                          value={newConstraintType}
                          onChange={(e) => setNewConstraintType(e.target.value)}
                        >
                          <FormControlLabel value="PRIOR" control={<Radio />} label="Học trước" />
                          <FormControlLabel value="PREREQUISITE" control={<Radio />} label="Tiên quyết" />
                          <FormControlLabel value="COREQUISITE" control={<Radio />} label="Học đồng thời" />
                        </RadioGroup>
                      </FormControl>
                      <Autocomplete
                        options={availableCourses.filter((c) => 
                          c.id !== courseId && 
                          !currentCourses.some((existing: any) => existing.course_id === c.id)
                        )}
                        getOptionLabel={(option) => `${option.code} — ${option.name}`}
                        onChange={(_event, option) => {
                          if (option) {
                            handleAddConstraint(courseId, option);
                          }
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Chọn học phần điều kiện"
                            placeholder="Tìm kiếm học phần..."
                          />
                        )}
                      />
                    </Stack>
                  </Box>
                </Stack>
              );
            })()}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConstraintsDialogOpen(false)}>Đóng</Button>
            <Button
              variant="contained"
              onClick={() => {
                setConstraintsDialogOpen(false);
                setEditingConstraintsCourseId(null);
              }}
            >
              Lưu
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
