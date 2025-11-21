'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  InputAdornment,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Paper,
  Select,
  SelectChangeEvent,
  Snackbar,
  Stack,
  Stepper,
  Step,
  StepLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  ArrowOutward as ArrowOutwardIcon,
  Visibility as VisibilityIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  RocketLaunch as RocketLaunchIcon,
  Description as DescriptionIcon,
  Timeline as TimelineIcon,
  School as SchoolIcon,
  Edit as EditIcon,
  Science as ScienceIcon,
} from '@mui/icons-material';
import {
  ProgramWorkflowStage,
  getProgramWorkflowStageLabel,
  CourseWorkflowStage,
  getCourseWorkflowStageLabel,
  CohortWorkflowStage,
  getCohortWorkflowStageLabel,
} from '@/constants/workflow-statuses';
import {
  getProgramStageFromStatus,
  computeProgramStepIndex,
  formatProgramDateTime,
} from '@/constants/programs';
import {
  formatMajorDateTime,
} from '@/constants/majors';
import {
  getCourseStageFromStatus,
  computeCourseStepIndex,
} from '@/constants/courses';
import {
  getCohortStageFromStatus,
  computeCohortStepIndex,
} from '@/constants/cohorts';
import {
  WORKFLOW_STATUS_OPTIONS,
  WORKFLOW_STATUS_VALUES,
  WorkflowStatus,
  getWorkflowStatusColor,
  getWorkflowStatusLabel,
  normalizeWorkflowStatusFromResource,
} from '@/constants/workflow-statuses';
import { useSession } from 'next-auth/react';

type ResourceType = 'program' | 'major' | 'course' | 'cohort';

interface ReviewRow {
  id: string;
  code: string;
  name: string;
  status: WorkflowStatus;
  owner?: string;
  updatedAt?: string;
}

interface ResourceConfig {
  label: string;
  fetchUrl: string;
  statuses: WorkflowStatus[];
  getStatusLabel: (status: WorkflowStatus) => string;
  getStatusColor: (status: WorkflowStatus) => 'default' | 'info' | 'warning' | 'success' | 'error';
  mapItems: (items: unknown[]) => ReviewRow[];
  detailPath: (id: string) => string;
}

const RESOURCE_CONFIG: Record<ResourceType, ResourceConfig> = {
  program: {
    label: 'Chương trình',
    fetchUrl: '/api/tms/programs?limit=200',
    statuses: WORKFLOW_STATUS_VALUES,
    getStatusLabel: (status) => getWorkflowStatusLabel(status),
    getStatusColor: (status) => getWorkflowStatusColor(status),
    mapItems: (items) =>
      items.map((item: any) => ({
        id: String(item.id),
        code: item.code ?? '—',
        name: item.name_vi ?? item.nameVi ?? item.name_en ?? 'Không xác định',
        status: normalizeWorkflowStatusFromResource('program', item.status ?? WorkflowStatus.DRAFT),
        owner: item.OrgUnit?.name ?? item.org_unit?.name ?? '',
        updatedAt: item.updated_at ?? item.updatedAt ?? '',
      })),
    detailPath: (id) => `/tms/programs/${id}`,
  },
  major: {
    label: 'Ngành đào tạo',
    fetchUrl: '/api/tms/majors?limit=200',
    statuses: WORKFLOW_STATUS_VALUES,
    getStatusLabel: (status) => getWorkflowStatusLabel(status),
    getStatusColor: (status) => getWorkflowStatusColor(status),
    mapItems: (items) =>
      items.map((item: any) => ({
        id: String(item.id),
        code: item.code ?? '—',
        name: item.name_vi ?? item.nameVi ?? item.name_en ?? 'Không xác định',
        status: normalizeWorkflowStatusFromResource('major', item.status ?? WorkflowStatus.DRAFT),
        owner: item.org_unit?.name ?? '',
        updatedAt: item.updated_at ?? item.updatedAt ?? '',
      })),
    detailPath: (id) => `/tms/majors/${id}`,
  },
  course: {
    label: 'Học phần',
    fetchUrl: '/api/tms/courses?limit=200&list=true',
    statuses: WORKFLOW_STATUS_VALUES,
    getStatusLabel: (status) => getWorkflowStatusLabel(status),
    getStatusColor: (status) => getWorkflowStatusColor(status),
    mapItems: (items) =>
      items.map((item: any) => ({
        id: String(item.id),
        code: item.code ?? '—',
        name: item.name_vi ?? item.nameVi ?? item.name_en ?? 'Không xác định',
        status: normalizeWorkflowStatusFromResource('course', item.status ?? WorkflowStatus.DRAFT),
        owner: item.OrgUnit?.name ?? '',
        updatedAt: item.updated_at ?? item.updatedAt ?? '',
      })),
    detailPath: (id) => `/tms/courses/${id}`,
  },
  cohort: {
    label: 'Khóa học',
    fetchUrl: '/api/cohorts?limit=200',
    statuses: WORKFLOW_STATUS_VALUES,
    getStatusLabel: (status) => getWorkflowStatusLabel(status),
    getStatusColor: (status) => getWorkflowStatusColor(status),
    mapItems: (items) =>
      items.map((item: any) => ({
        id: String(item.id),
        code: item.code ?? '—',
        name: item.name_vi ?? item.nameVi ?? item.name_en ?? 'Không xác định',
        status: normalizeWorkflowStatusFromResource('cohort', item.status ?? WorkflowStatus.DRAFT),
        owner: item.org_unit_id?.toString() ?? '',
        updatedAt: item.updated_at ?? item.updatedAt ?? '',
      })),
    detailPath: (id) => `/tms/cohorts/${id}`,
  },
};

const emptyRows: Record<ResourceType, ReviewRow[]> = {
  program: [],
  major: [],
  course: [],
  cohort: [],
};

const emptyLoaded: Record<ResourceType, boolean> = {
  program: false,
  major: false,
  course: false,
  cohort: false,
};

// Workflow stages for each resource type
const PROGRAM_PROCESS_STAGES = [
  { stage: ProgramWorkflowStage.DRAFT, label: 'Giảng viên soạn thảo', Icon: DescriptionIcon },
  { stage: ProgramWorkflowStage.REVIEWING, label: 'Khoa gửi PĐT xem xét', Icon: SchoolIcon },
  { stage: ProgramWorkflowStage.APPROVED, label: 'Phòng Đào Tạo phê duyệt', Icon: CheckCircleIcon },
  { stage: ProgramWorkflowStage.PUBLISHED, label: 'Hội đồng khoa học công bố', Icon: RocketLaunchIcon },
];

const MAJOR_PROCESS_STAGES = [
  { stage: WorkflowStatus.DRAFT, label: 'Giảng viên soạn thảo', Icon: DescriptionIcon },
  { stage: WorkflowStatus.REVIEWING, label: 'Khoa gửi PĐT xem xét', Icon: SchoolIcon },
  { stage: WorkflowStatus.APPROVED, label: 'Phòng Đào Tạo phê duyệt', Icon: CheckCircleIcon },
  { stage: WorkflowStatus.PUBLISHED, label: 'Hội đồng khoa học công bố', Icon: RocketLaunchIcon },
];

const COURSE_PROCESS_STAGES = [
  { stage: CourseWorkflowStage.DRAFT, label: 'Giảng viên soạn thảo', Icon: DescriptionIcon },
  { stage: CourseWorkflowStage.REVIEWING, label: 'Khoa gửi PĐT xem xét', Icon: SchoolIcon },
  { stage: CourseWorkflowStage.APPROVED, label: 'Phòng Đào Tạo phê duyệt', Icon: CheckCircleIcon },
  { stage: CourseWorkflowStage.PUBLISHED, label: 'Hội đồng khoa học công bố', Icon: RocketLaunchIcon },
];

const COHORT_PROCESS_STAGES = [
  { stage: CohortWorkflowStage.DRAFT, label: 'Giảng viên soạn thảo', Icon: DescriptionIcon },
  { stage: CohortWorkflowStage.REVIEWING, label: 'Khoa gửi PĐT xem xét', Icon: SchoolIcon },
  { stage: CohortWorkflowStage.APPROVED, label: 'Phòng Đào Tạo phê duyệt', Icon: CheckCircleIcon },
  { stage: CohortWorkflowStage.PUBLISHED, label: 'Hội đồng khoa học công bố', Icon: RocketLaunchIcon },
];

interface ApprovalHistoryEntry {
  id: string;
  timestamp: string;
  actor: string;
  role: string;
  action: string;
  status: WorkflowStatus;
  note?: string;
}

export default function TmsReviewHub(): JSX.Element {
  const router = useRouter();
  const { data: session } = useSession();
  const [resourceType, setResourceType] = useState<ResourceType>('program');
  const [data, setData] = useState<Record<ResourceType, ReviewRow[]>>(emptyRows);
  const [loaded, setLoaded] = useState<Record<ResourceType, boolean>>(emptyLoaded);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchValue, setSearchValue] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | WorkflowStatus>('all');

  // Modal states
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState<any | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [confirmComment, setConfirmComment] = useState<string>('');
  const [pendingAction, setPendingAction] = useState<{ row: ReviewRow; action: string } | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  // Progress bar states
  const [processIndex, setProcessIndex] = useState<number>(0);
  const [focusedStatus, setFocusedStatus] = useState<WorkflowStatus>(WorkflowStatus.DRAFT);
  const [focusedStage, setFocusedStage] = useState<string>('DRAFT');
  const [historyEntries, setHistoryEntries] = useState<ApprovalHistoryEntry[]>([]);

  const currentConfig = RESOURCE_CONFIG[resourceType];

  const extractItems = (payload: any): unknown[] => {
    if (!payload) return [];
    if (Array.isArray(payload.items)) return payload.items;
    if (Array.isArray(payload.data?.items)) return payload.data.items;
    if (Array.isArray(payload.data)) return payload.data;
    return [];
  };

  const fetchData = async (type: ResourceType, showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      setError(null);
      const response = await fetch(RESOURCE_CONFIG[type].fetchUrl);
      const result = await response.json();

      let items: unknown[] = [];
      if (type === 'cohort') {
        // Cohorts API returns { cohorts: [...] } directly
        if (!response.ok) {
          throw new Error(result?.error || 'Không thể tải dữ liệu');
        }
        items = result?.cohorts || result?.data?.cohorts || [];
      } else {
        // Programs/Majors/Courses return { success: true, data: [...] }
        if (!response.ok || !result?.success) {
          throw new Error(result?.error || 'Không thể tải dữ liệu');
        }
        items = extractItems(result);
      }

      const mapped = RESOURCE_CONFIG[type].mapItems(items);

      setData((prev) => ({ ...prev, [type]: mapped }));
      setLoaded((prev) => ({ ...prev, [type]: true }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Đã xảy ra lỗi';
      setError(message);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    if (!loaded[resourceType]) {
      fetchData(resourceType);
    }
  }, [resourceType, loaded]);

  const handleTypeChange = (_: React.MouseEvent<HTMLElement>, nextType: ResourceType | null) => {
    if (nextType) {
      setResourceType(nextType);
      setStatusFilter('all');
      setSearchTerm('');
      setSearchValue('');
      setError(null);
    }
  };

  const handleSearchSubmit = () => {
    setSearchTerm(searchValue.trim());
  };

  const handleStatusChange = (event: SelectChangeEvent<string>) => {
    setStatusFilter(event.target.value as WorkflowStatus | 'all');
  };

  const filteredRows = useMemo(() => {
    return data[resourceType].filter((row) => {
      const matchesStatus = statusFilter === 'all' || row.status === statusFilter;
      const haystack = `${row.code} ${row.name}`.toLowerCase();
      const matchesSearch = searchTerm === '' || haystack.includes(searchTerm.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [data, resourceType, statusFilter, searchTerm]);

  const statusCounts = useMemo(() => {
    const initialCounts = WORKFLOW_STATUS_VALUES.reduce<Record<WorkflowStatus, number>>((acc, status) => {
      acc[status] = 0;
      return acc;
    }, {} as Record<WorkflowStatus, number>);

    return data[resourceType].reduce((acc, row) => {
      acc[row.status] = (acc[row.status] || 0) + 1;
      return acc;
    }, initialCounts);
  }, [data, resourceType]);

  const refreshCurrent = () => {
    fetchData(resourceType);
  };

  const formatDate = (input?: string) => {
    if (!input) return '—';
    const date = new Date(input);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('vi-VN');
  };

  const resolveStatusLabel = (status: WorkflowStatus) => currentConfig.getStatusLabel(status);

  // Workflow functions
  const getProcessStages = () => {
    if (resourceType === 'program') return PROGRAM_PROCESS_STAGES;
    if (resourceType === 'major') return MAJOR_PROCESS_STAGES;
    if (resourceType === 'course') return COURSE_PROCESS_STAGES;
    if (resourceType === 'cohort') return COHORT_PROCESS_STAGES;
    return [];
  };

  const updateProcessContext = (status?: string) => {
    if (!status) {
      setProcessIndex(0);
      setFocusedStatus(WorkflowStatus.DRAFT);
      setFocusedStage(resourceType === 'course' ? 'FACULTY' : 'DRAFT');
      return;
    }

    const normalizedDisplayStatus = normalizeWorkflowStatusFromResource(resourceType, status);
    setFocusedStatus(normalizedDisplayStatus);

    if (resourceType === 'program') {
      const stage = getProgramStageFromStatus(status);
      setProcessIndex(computeProgramStepIndex(status));
      setFocusedStage(stage);
    } else if (resourceType === 'major') {
      const normalizedStatus = normalizeWorkflowStatusFromResource('major', status);
      const statusToStageMap: Record<WorkflowStatus, string> = {
        [WorkflowStatus.DRAFT]: WorkflowStatus.DRAFT,
        [WorkflowStatus.REVIEWING]: WorkflowStatus.REVIEWING,
        [WorkflowStatus.APPROVED]: WorkflowStatus.APPROVED,
        [WorkflowStatus.REJECTED]: WorkflowStatus.REVIEWING,
        [WorkflowStatus.PUBLISHED]: WorkflowStatus.PUBLISHED,
        [WorkflowStatus.ARCHIVED]: WorkflowStatus.DRAFT,
      };
      const stage = statusToStageMap[normalizedStatus] || WorkflowStatus.DRAFT;
      const stageIndexMap: Record<WorkflowStatus, number> = {
        [WorkflowStatus.DRAFT]: 0,
        [WorkflowStatus.REVIEWING]: 1,
        [WorkflowStatus.APPROVED]: 2,
        [WorkflowStatus.REJECTED]: 1,
        [WorkflowStatus.PUBLISHED]: 3,
        [WorkflowStatus.ARCHIVED]: 0,
      };
      setProcessIndex(stageIndexMap[normalizedStatus] || 0);
      setFocusedStage(stage);
    } else if (resourceType === 'course') {
      const stage = getCourseStageFromStatus(status);
      setProcessIndex(computeCourseStepIndex(status));
      setFocusedStage(stage);
    } else if (resourceType === 'cohort') {
      const stage = getCohortStageFromStatus(status);
      setProcessIndex(computeCohortStepIndex(status));
      setFocusedStage(stage);
    }
  };

  const mapApprovalActionToStatus = (action: string): WorkflowStatus => {
    const normalized = action.toUpperCase();
    if (normalized.includes('APPROVE')) return WorkflowStatus.APPROVED;
    if (normalized.includes('REJECT')) return WorkflowStatus.REJECTED;
    if (normalized.includes('PUBLISH') || normalized.includes('ACTIVATE')) return WorkflowStatus.PUBLISHED;
    if (normalized.includes('SUBMIT') || normalized.includes('REVIEW')) return WorkflowStatus.REVIEWING;
    if (normalized.includes('ARCHIVE')) return WorkflowStatus.ARCHIVED;
    if (normalized.includes('REQUEST') || normalized.includes('EDIT')) return WorkflowStatus.DRAFT;
    return WorkflowStatus.DRAFT;
  };

  const openDetailDialog = async (row: ReviewRow) => {
    setDetailOpen(true);
    setDetailLoading(true);
    try {
      const apiPath = resourceType === 'program' 
        ? `/api/tms/programs/${row.id}`
        : resourceType === 'major'
        ? `/api/tms/majors/${row.id}`
        : resourceType === 'course'
        ? `/api/tms/courses/${row.id}`
        : `/api/cohorts/${row.id}`;
      
      const response = await fetch(apiPath);
      const result = await response.json();

      // Handle different response formats
      let detailData: any = null;
      if (resourceType === 'cohort') {
        // Cohorts API returns { cohort: {...}, stats: {...} }
        detailData = result?.cohort || result?.data?.cohort || result?.data;
      } else {
        // Programs/Majors/Courses return { success: true, data: {...} }
        if (!response.ok || !result?.success || !result?.data) {
          throw new Error(result?.error || 'Không thể tải chi tiết');
        }
        detailData = result.data?.data || result.data;
      }

      if (!detailData) {
        throw new Error('Không thể tải chi tiết');
      }

      setDetail(detailData);
      
      // Fetch approval history
      try {
        const historyPath = `${apiPath}/approval-history`;
        const hRes = await fetch(historyPath);
        const hJson = await hRes.json();
        
        // Handle different response formats
        let items: any[] = [];
        if (hRes.ok) {
          if (hJson?.success !== false) {
            // Response is OK and not an error
            if (Array.isArray(hJson?.items)) {
              items = hJson.items;
            } else if (Array.isArray(hJson?.data?.items)) {
              items = hJson.data.items;
            } else if (Array.isArray(hJson?.data)) {
              items = hJson.data;
            } else if (Array.isArray(hJson)) {
              items = hJson;
            }
          }
        }
        
        if (items.length > 0) {
          const entries = (items as Array<Record<string, unknown>>).map((r, idx) => {
            const id = String((r as any).id ?? idx);
            const approver = (r as any).approver as { full_name?: string; email?: string } | undefined;
            const actor = approver?.full_name || approver?.email || '—';
            const role = approver?.email || '';
            const action = String((r as any).action ?? '');
            const status = mapApprovalActionToStatus(action);
            const timestamp = String((r as any).approved_at ?? (r as any).created_at ?? new Date().toISOString());
            const note = (r as any).comments as string | undefined;
            return { id, actor, role, action, status, timestamp, note } as ApprovalHistoryEntry;
          }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          
          setHistoryEntries(entries);
        } else {
          setHistoryEntries([]);
        }
      } catch (err) {
        console.error('Failed to fetch approval history:', err);
        setHistoryEntries([]);
      }
      
      updateProcessContext(detailData.status);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể tải chi tiết';
      setDetail(null);
      setSnackbar({ open: true, message, severity: 'error' });
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetailDialog = () => {
    setDetailOpen(false);
    setDetail(null);
    setHistoryEntries([]);
  };

  const openActionConfirm = (row: ReviewRow, action: string) => {
    setPendingAction({ row, action });
    setConfirmOpen(true);
  };

  const closeActionConfirm = () => {
    setConfirmOpen(false);
    setPendingAction(null);
    setConfirmComment('');
  };

  const performWorkflowAction = async () => {
    if (!pendingAction) return;

    try {
      setConfirmLoading(true);
      const nextStatus = mapApprovalActionToStatus(pendingAction.action);
      const apiPath = resourceType === 'program'
        ? `/api/tms/programs/${pendingAction.row.id}`
        : resourceType === 'major'
        ? `/api/tms/majors/${pendingAction.row.id}`
        : resourceType === 'course'
        ? `/api/tms/courses/${pendingAction.row.id}`
        : `/api/cohorts/${pendingAction.row.id}`;
      
      const method = resourceType === 'program' ? 'PATCH' : 'PUT';
      const response = await fetch(apiPath, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          status: nextStatus, 
          workflow_notes: confirmComment,
          workflow_action: pendingAction.action,
        }),
      });

      const result = await response.json();
      
      // Handle different response formats
      if (resourceType === 'cohort') {
        // Cohorts API returns { cohort: {...} } directly
        if (!response.ok || !result?.cohort) {
          throw new Error(result?.error || 'Thao tác không thành công');
        }
      } else {
        // Programs/Majors/Courses return { success: true, data: {...} }
        if (!response.ok || !result?.success) {
          throw new Error(result?.error || 'Thao tác không thành công');
        }
      }

      setSnackbar({ open: true, message: 'Thao tác thành công', severity: 'success' });
      
      // Refresh approval history before closing dialog
      if (detail && detail.id) {
        try {
          const historyPath = `${apiPath}/approval-history`;
          const hRes = await fetch(historyPath);
          const hJson = await hRes.json();
          
          let items: any[] = [];
          if (hRes.ok && hJson?.success !== false) {
            if (Array.isArray(hJson?.items)) {
              items = hJson.items;
            } else if (Array.isArray(hJson?.data?.items)) {
              items = hJson.data.items;
            } else if (Array.isArray(hJson?.data)) {
              items = hJson.data;
            } else if (Array.isArray(hJson)) {
              items = hJson;
            }
          }
          
          if (items.length > 0) {
            const entries = (items as Array<Record<string, unknown>>).map((r, idx) => {
              const id = String((r as any).id ?? idx);
              const approver = (r as any).approver as { full_name?: string; email?: string } | undefined;
              const actor = approver?.full_name || approver?.email || '—';
              const role = approver?.email || '';
              const action = String((r as any).action ?? '');
              const status = mapApprovalActionToStatus(action);
              const timestamp = String((r as any).approved_at ?? (r as any).created_at ?? new Date().toISOString());
              const note = (r as any).comments as string | undefined;
              return { id, actor, role, action, status, timestamp, note } as ApprovalHistoryEntry;
            }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            
            setHistoryEntries(entries);
          } else {
            setHistoryEntries([]);
          }
        } catch (err) {
          console.error('Failed to refresh approval history:', err);
        }
      }
      
      closeActionConfirm();
      // Don't auto-close dialog, let user see the updated history
      fetchData(resourceType, false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể thực hiện thao tác';
      setSnackbar({ open: true, message, severity: 'error' });
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleSnackbarClose = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  const getActionButtons = (row: ReviewRow) => {
    const buttons: JSX.Element[] = [];
    const permissions = session?.user?.permissions || [];
    const hasPermission = (perm: string) => permissions.includes(perm);

    // Always show View button
    buttons.push(
      <Button
        key={`view-${row.id}`}
        size="small"
        variant="outlined"
        startIcon={<VisibilityIcon fontSize="small" />}
        onClick={() => openDetailDialog(row)}
      >
        Xem
      </Button>
    );

    // Get permission keys based on resource type
    const approvePerm = resourceType === 'program' ? 'tms.program.approve' 
      : resourceType === 'major' ? 'tms.major.approve'
      : resourceType === 'course' ? 'tms.course.approve'
      : 'tms.cohort.approve';
    const updatePerm = resourceType === 'program' ? 'tms.program.update'
      : resourceType === 'major' ? 'tms.major.update'
      : resourceType === 'course' ? 'tms.course.update'
      : 'tms.cohort.update';
    const publishPerm = resourceType === 'program' ? 'tms.program.publish'
      : resourceType === 'major' ? 'tms.major.publish'
      : resourceType === 'course' ? 'tms.course.publish'
      : 'tms.cohort.publish';

    const workflowStatus = row.status;

    if (workflowStatus === WorkflowStatus.DRAFT) {
      buttons.push(
        <Button
          key={`submit-${row.id}`}
          size="small"
          variant="contained"
          color="primary"
          startIcon={<CheckCircleIcon fontSize="small" />}
          onClick={() => openActionConfirm(row, 'submit')}
        >
          Gửi xem xét
        </Button>
      );
    }

    if (workflowStatus === WorkflowStatus.REVIEWING) {
      if (hasPermission(approvePerm)) {
        buttons.push(
          <Button
            key={`approve-${row.id}`}
            size="small"
            variant="contained"
            color="success"
            startIcon={<CheckCircleIcon fontSize="small" />}
            onClick={() => openActionConfirm(row, 'approve')}
          >
            Phê duyệt
          </Button>
        );
        buttons.push(
          <Button
            key={`reject-${row.id}`}
            size="small"
            color="error"
            variant="outlined"
            startIcon={<CancelIcon fontSize="small" />}
            onClick={() => openActionConfirm(row, 'reject')}
          >
            Từ chối
          </Button>
        );
      }
      if (hasPermission(updatePerm)) {
        buttons.push(
          <Button
            key={`request-edit-${row.id}`}
            size="small"
            variant="outlined"
            color="warning"
            startIcon={<EditIcon fontSize="small" />}
            onClick={() => openActionConfirm(row, 'request_edit')}
          >
            Yêu cầu chỉnh sửa
          </Button>
        );
      }
    }

    if (workflowStatus === WorkflowStatus.APPROVED) {
      if (hasPermission(publishPerm)) {
        buttons.push(
          <Button
            key={`publish-${row.id}`}
            size="small"
            variant="contained"
            color="primary"
            startIcon={<ScienceIcon fontSize="small" />}
            onClick={() => openActionConfirm(row, 'publish')}
          >
            Công bố
          </Button>
        );
      }
    }

    return buttons;
  };

  // Progress bar calculations
  const processStages = getProcessStages();
  const clampedProcessIndex = Math.max(0, Math.min(processStages.length - 1, processIndex));
  const progressValue = processStages.length <= 1 ? 100 : (clampedProcessIndex / (processStages.length - 1)) * 100;
  
  const getActiveStageLabel = () => {
    if (resourceType === 'program') {
      return getProgramWorkflowStageLabel(focusedStage as ProgramWorkflowStage);
    }
    if (resourceType === 'major') {
      const stageLabelMap: Record<WorkflowStatus, string> = {
        [WorkflowStatus.DRAFT]: 'Giảng viên soạn thảo',
        [WorkflowStatus.REVIEWING]: 'Khoa gửi PĐT xem xét',
        [WorkflowStatus.APPROVED]: 'Phòng Đào Tạo phê duyệt',
        [WorkflowStatus.REJECTED]: 'Khoa gửi PĐT xem xét',
        [WorkflowStatus.PUBLISHED]: 'Hội đồng khoa học công bố',
        [WorkflowStatus.ARCHIVED]: 'Giảng viên soạn thảo',
      };
      return stageLabelMap[focusedStage as WorkflowStatus] || focusedStage;
    }
    if (resourceType === 'course') {
      return getCourseWorkflowStageLabel(focusedStage as CourseWorkflowStage);
    }
    if (resourceType === 'cohort') {
      return getCohortWorkflowStageLabel(focusedStage as CohortWorkflowStage);
    }
    return focusedStage;
  };

  const activeStageLabel = getActiveStageLabel();
  const activeStatusLabel = resolveStatusLabel(focusedStatus);
  const detailDisplayStatus = detail
    ? normalizeWorkflowStatusFromResource(resourceType, detail.status)
    : WorkflowStatus.DRAFT;

  return (
    <Container
      maxWidth={false}
      sx={{
        py: 4,
        px: { xs: 1, md: 2 },
        backgroundColor: 'background.default',
        maxWidth: '100%',
      }}
    >
      <Stack spacing={3}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Trung tâm phê duyệt TMS
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Tổng hợp các yêu cầu phê duyệt chương trình, ngành, học phần và khóa học trong một giao diện.
          </Typography>
        </Box>

        <Paper sx={{ p: 3 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center" justifyContent="space-between">
            <ToggleButtonGroup
              color="primary"
              value={resourceType}
              exclusive
              onChange={handleTypeChange}
              size="small"
            >
              {Object.entries(RESOURCE_CONFIG).map(([value, config]) => (
                <ToggleButton key={value} value={value}>
                  {config.label}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
            <Stack direction="row" spacing={1} width={{ xs: '100%', sm: 'auto' }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Tìm mã, tên..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSearchSubmit();
                  }
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
              <Select
                size="small"
                value={statusFilter}
                onChange={handleStatusChange}
                sx={{ minWidth: 160 }}
              >
                <MenuItem value="all">Tất cả trạng thái</MenuItem>
                {WORKFLOW_STATUS_OPTIONS.map((status) => (
                  <MenuItem key={status.value} value={status.value}>
                    {status.label}
                  </MenuItem>
                ))}
              </Select>
              <Tooltip title="Làm mới">
                <span>
                  <IconButton onClick={refreshCurrent} disabled={loading}>
                    <RefreshIcon />
                  </IconButton>
                </span>
              </Tooltip>
            </Stack>
          </Stack>
        </Paper>

        {error && (
          <Alert severity="error" action={<Button color="inherit" size="small" onClick={refreshCurrent}>Thử lại</Button>}>
            {error}
          </Alert>
        )}

        <Paper sx={{ p: 3 }}>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {WORKFLOW_STATUS_OPTIONS.map((status) => (
              <Chip
                key={status.value}
                label={`${status.label} (${statusCounts[status.value] || 0})`}
                color={currentConfig.getStatusColor(status.value)}
                variant="outlined"
                sx={{ mr: 1, mb: 1 }}
              />
            ))}
          </Stack>
        </Paper>

        <Paper sx={{ p: 2 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: 120 }}>Loại</TableCell>
                  <TableCell sx={{ width: 120 }}>Mã</TableCell>
                  <TableCell>Tên</TableCell>
                  <TableCell sx={{ width: 140 }}>Trạng thái</TableCell>
                  <TableCell sx={{ width: 140 }}>Cập nhật</TableCell>
                  <TableCell sx={{ width: 80 }} align="center">
                    Xem
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading && (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                      Đang tải dữ liệu...
                    </TableCell>
                  </TableRow>
                )}

                {!loading && filteredRows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                      Không có bản ghi nào phù hợp.
                    </TableCell>
                  </TableRow>
                )}

                {!loading &&
                  filteredRows.map((row) => (
                    <TableRow 
                      key={`${row.id}-${row.code}`}
                      hover
                      sx={{ cursor: 'pointer' }}
                      onClick={() => openDetailDialog(row)}
                    >
                      <TableCell>{currentConfig.label}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{row.code}</TableCell>
                      <TableCell>{row.name}</TableCell>
                      <TableCell>
                        <Chip
                          label={resolveStatusLabel(row.status)}
                          color={currentConfig.getStatusColor(row.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{formatDate(row.updatedAt)}</TableCell>
                      <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                        <Tooltip title="Xem chi tiết và xử lý">
                          <IconButton
                            color="primary"
                            onClick={() => openDetailDialog(row)}
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                          <Tooltip title="Mở trang chi tiết">
                              <IconButton
                                color="primary"
                                onClick={() => router.push(currentConfig.detailPath(row.id))}
                              >
                                <ArrowOutwardIcon fontSize="small" />
                              </IconButton>
                          </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Stack>

      {/* Detail Dialog with Progress Bar */}
      <Dialog open={detailOpen} onClose={closeDetailDialog} maxWidth="lg" fullWidth>
        <DialogTitle>Chi tiết {currentConfig.label.toLowerCase()}</DialogTitle>
        <DialogContent dividers sx={{ minHeight: 260 }}>
          {detailLoading && <LinearProgress sx={{ mb: 2 }} />}

          {detail && (
            <Stack spacing={3}>
              <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2}>
                <Stack spacing={1}>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {detail.name_vi ?? detail.nameVi ?? detail.name_en ?? detail.name ?? 'Không xác định'}
                  </Typography>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Chip
                      label={resolveStatusLabel(detailDisplayStatus)}
                      color={currentConfig.getStatusColor(detailDisplayStatus)}
                      size="small"
                    />
                    {processStages.length > 0 && (
                      <Chip
                        label={activeStageLabel}
                      color={currentConfig.getStatusColor(detailDisplayStatus)}
                        size="small"
                        variant="outlined"
                      />
                    )}
                  </Stack>
                </Stack>
                <Stack spacing={0.5} alignItems={{ xs: 'flex-start', md: 'flex-end' }}>
                  <Typography variant="body2" color="text.secondary">
                    Mã: <strong>{detail.code ?? '—'}</strong>
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Cập nhật: <strong>{getUpdatedAtDisplay(detail)}</strong>
                  </Typography>
                </Stack>
              </Stack>

              {/* Progress Bar */}
              {processStages.length > 0 && (
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    borderRadius: 3,
                    border: '1px solid',
                    borderColor: 'divider',
                    backgroundColor: 'background.paper',
                  }}
                >
                  <Stack spacing={2.5}>
                    <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2}>
                      <Stack spacing={0.5}>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                          Quy trình phê duyệt {currentConfig.label.toLowerCase()}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Theo dõi tiến độ xử lý hiện tại dựa trên trạng thái đang được chọn.
                        </Typography>
                      </Stack>
                      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} alignItems={{ xs: 'flex-start', md: 'center' }}>
                        <Chip
                          label={`Bước hiện tại: ${activeStageLabel}`}
                          color="info"
                          variant="outlined"
                          size="small"
                        />
                        <Chip
                          label={`Trạng thái: ${activeStatusLabel}`}
                          color={currentConfig.getStatusColor(focusedStatus)}
                          variant="outlined"
                          size="small"
                        />
                      </Stack>
                    </Stack>

                    <Box sx={{ position: 'relative', px: 1, py: 3 }}>
                      <Box
                        sx={{
                          '@keyframes glow': {
                            '0%': { boxShadow: '0 0 0 0 rgba(25,118,210,0.4)' },
                            '70%': { boxShadow: '0 0 0 12px rgba(25,118,210,0)' },
                            '100%': { boxShadow: '0 0 0 0 rgba(25,118,210,0)' },
                          },
                          '@keyframes pulse': {
                            '0%': { transform: 'scale(1)' },
                            '50%': { transform: 'scale(1.05)' },
                            '100%': { transform: 'scale(1)' },
                          },
                        }}
                      />
                      <Box sx={{ position: 'relative', height: 10, bgcolor: 'action.hover', borderRadius: 9999 }}>
                        <Box
                          sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            height: 10,
                            width: `${progressValue}%`,
                            background: 'linear-gradient(90deg, #42a5f5 0%, #1e88e5 50%, #1565c0 100%)',
                            borderRadius: 9999,
                            transition: 'width 400ms cubic-bezier(0.22, 1, 0.36, 1)',
                          }}
                        />
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1.5 }}>
                        {processStages.map((stageDef, idx) => {
                          const StageIcon = stageDef.Icon;
                          const isReached = idx <= clampedProcessIndex;
                          const isCurrent = stageDef.stage === focusedStage;
                          return (
                            <Box key={idx} sx={{ textAlign: 'center', minWidth: 0 }}>
                              <Box sx={{ position: 'relative', height: 32 }}>
                                <Box
                                  sx={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: 32,
                                    height: 32,
                                    borderRadius: '50%',
                                    border: '2px solid',
                                    borderColor: isCurrent ? 'primary.main' : isReached ? 'primary.light' : 'divider',
                                    backgroundColor: isReached ? 'primary.light' : 'background.paper',
                                    color: isReached ? 'primary.contrastText' : 'text.secondary',
                                    animation: isCurrent ? 'pulse 1.8s infinite ease-in-out' : 'none',
                                  }}
                                >
                                  <StageIcon sx={{ fontSize: 18 }} />
                                </Box>
                              </Box>
                              <Typography
                                variant="caption"
                                sx={{
                                  mt: 0.5,
                                  display: 'block',
                                  fontWeight: isCurrent ? 700 : 500,
                                  color: isCurrent ? 'primary.main' : 'text.secondary',
                                }}
                              >
                                {stageDef.label}
                              </Typography>
                            </Box>
                          );
                        })}
                      </Box>
                    </Box>
                  </Stack>
                </Paper>
              )}

              {/* Approval History */}
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                  Lịch sử phê duyệt
                </Typography>
                {historyEntries.length > 0 ? (
                  <List dense disablePadding>
                    {historyEntries.map((entry, index) => {
                      const statusLabel = resolveStatusLabel(entry.status);
                      const statusChipColor = currentConfig.getStatusColor(entry.status);

                      const renderIcon = () => {
                        if (entry.status === 'REJECTED') return <CancelIcon color="error" fontSize="small" />;
                        if (entry.status === 'PUBLISHED') return <RocketLaunchIcon color="primary" fontSize="small" />;
                        if (entry.status === 'APPROVED') return <CheckCircleIcon color="success" fontSize="small" />;
                        return <TimelineIcon color="info" fontSize="small" />;
                      };

                      const formatEntryDate = () => {
                        if (resourceType === 'program') return formatProgramDateTime(entry.timestamp);
                        if (resourceType === 'major') return formatMajorDateTime(entry.timestamp);
                        return formatDate(entry.timestamp);
                      };

                      return (
                        <React.Fragment key={entry.id}>
                          <ListItem alignItems="flex-start" sx={{ px: 0 }}>
                            <ListItemIcon sx={{ minWidth: 32 }}>{renderIcon()}</ListItemIcon>
                            <ListItemText
                              primary={
                                <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} alignItems={{ md: 'center' }}>
                                  <Typography variant="body2" sx={{ fontWeight: 600 }} color="text.secondary">
                                    {entry.actor}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    {entry.role}
                                  </Typography>
                                  <Chip label={statusLabel} size="small" color={statusChipColor} variant="outlined" />
                                </Stack>
                              }
                              secondary={
                                <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                                  <Typography variant="caption" color="text.secondary">
                                    {formatEntryDate()}
                                  </Typography>
                                  {entry.note && (
                                    <Typography variant="body2" color="text.secondary">
                                      {entry.note}
                                    </Typography>
                                  )}
                                </Stack>
                              }
                            />
                          </ListItem>
                          {index < historyEntries.length - 1 && <Divider variant="inset" component="li" sx={{ ml: 4 }} />}
                        </React.Fragment>
                      );
                    })}
                  </List>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Chưa có lịch sử phê duyệt.
                  </Typography>
                )}
      </Box>
            </Stack>
          )}

          {!detailLoading && !detail && (
            <Typography variant="body2" color="text.secondary">
              Không tìm thấy thông tin.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          {detail && (
            <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mr: 'auto' }}>
              {getActionButtons({
                ...detail,
                id: detail.id,
                code: detail.code,
                name: detail.name_vi ?? detail.nameVi,
                status: detailDisplayStatus,
                owner: detail.org_unit?.name,
                updatedAt: detail.updated_at,
              })}
            </Stack>
          )}
          {detail && (
            <Button
              variant="outlined"
              onClick={() => {
                router.push(currentConfig.detailPath(detail.id));
                closeDetailDialog();
              }}
            >
              Mở trang chi tiết
            </Button>
          )}
          <Button variant="contained" onClick={closeDetailDialog}>
            Đóng
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirm Dialog */}
      <Dialog open={confirmOpen} onClose={confirmLoading ? undefined : closeActionConfirm} maxWidth="xs" fullWidth>
        <DialogTitle>Xác nhận thao tác</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Bạn có chắc muốn tiếp tục?
          </Typography>
          <TextField
            autoFocus
            fullWidth
            multiline
            minRows={2}
            sx={{ mt: 2 }}
            label="Ghi chú (tùy chọn)"
            placeholder="Nhập ghi chú phê duyệt/từ chối..."
            value={confirmComment}
            onChange={(e) => setConfirmComment(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeActionConfirm} disabled={confirmLoading}>
            Hủy
          </Button>
          <Button
            onClick={performWorkflowAction}
            variant="contained"
            color="primary"
            disabled={confirmLoading}
          >
            {confirmLoading ? 'Đang xử lý...' : 'Xác nhận'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}

