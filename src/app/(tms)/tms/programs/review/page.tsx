'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Stack,
  Chip,
  Button,
  TextField,
  InputAdornment,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  LinearProgress,
  Alert,
  Snackbar,
  Tooltip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Stepper,
  Step,
  StepLabel,
  Collapse,
  CardHeader,
  CardActions,
  Breadcrumbs,
  Link,
} from '@mui/material';
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Visibility as VisibilityIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  RocketLaunch as RocketLaunchIcon,
  Description as DescriptionIcon,
  Timeline as TimelineIcon,
  School as SchoolIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Science as ScienceIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Help as HelpIcon,
  Security as SecurityIcon,
} from '@mui/icons-material';
import { PermissionGuard } from '@/components/auth/permission-guard';
import { PermissionButton } from '@/components/auth/PermissionButton';
import {
  ProgramPriority,
  ProgramStatus,
  ProgramWorkflowStage,
  ProgramWorkflowAction,
  PROGRAM_STATUSES,
  PROGRAM_PRIORITIES,
  PROGRAM_WORKFLOW_STAGES,
  PROGRAM_PERMISSIONS,
  DEFAULT_PROGRAM_STATS,
  PROGRAM_STAGE_CHIP_COLORS,
  PROGRAM_ACTION_COPY,
  getProgramStatusColor,
  getProgramStatusLabel,
  getProgramPriorityColor,
  getProgramPriorityLabel,
  getProgramWorkflowStageLabel,
  getProgramStageFromStatus,
  normalizeProgramPriority,
  getProgramStageChipColor,
  getProgramActionCopy,
  formatProgramDateTime,
  computeProgramStepIndex,
} from '@/constants/programs';
import {
  ProgramListItem,
  ProgramListApiResponse,
  ProgramApiResponseItem,
  ProgramDetail,
  mapProgramResponse,
  mapProgramDetail,
} from '../program-utils';

interface ProgramReviewItem extends ProgramListItem {
  stage: ProgramWorkflowStage;
}

interface ApprovalHistoryEntry {
  id: string;
  timestamp: string;
  actor: string;
  role: string;
  action: string;
  status: ProgramStatus | string;
  note?: string;
}

interface ApprovalHistoryDataset {
  programId: string;
  entries: ApprovalHistoryEntry[];
}

interface ProgramStatsSummary {
  pending: number;
  reviewing: number;
  approved: number;
  rejected: number;
  total: number;
}

// Constants moved to @/constants/programs

const processStages = [
  { stage: ProgramWorkflowStage.DRAFT, label: 'Giảng viên soạn thảo', Icon: DescriptionIcon },
  { stage: ProgramWorkflowStage.REVIEWING, label: 'Khoa gửi PĐT xem xét', Icon: SchoolIcon },
  { stage: ProgramWorkflowStage.APPROVED, label: 'Phòng Đào Tạo phê duyệt', Icon: CheckCircleIcon },
  { stage: ProgramWorkflowStage.PUBLISHED, label: 'Hội đồng khoa học công bố', Icon: RocketLaunchIcon },
];


const buildReviewItemFromDetail = (detail: ProgramDetail): ProgramReviewItem => ({
  id: detail.id,
  code: detail.code,
  nameVi: detail.nameVi,
  nameEn: detail.nameEn,
  description: detail.description,
  version: detail.version,
  status: detail.status,
  totalCredits: detail.totalCredits,
  priority: detail.priority,
  effectiveFrom: detail.effectiveFrom,
  effectiveTo: detail.effectiveTo,
  createdAt: detail.createdAt,
  updatedAt: detail.updatedAt,
  orgUnit: detail.orgUnit,
  major: detail.major,
  stats: detail.stats,
  stage: getProgramStageFromStatus(detail.status),
});

export default function ProgramReviewPage(): JSX.Element {
  const router = useRouter();
  const [programs, setPrograms] = useState<ProgramReviewItem[]>([]);
  const [stats, setStats] = useState<ProgramStatsSummary>(DEFAULT_PROGRAM_STATS);
  const [selectedStatus, setSelectedStatus] = useState<ProgramStatus | 'all'>('all');
  const [selectedStage, setSelectedStage] = useState<ProgramWorkflowStage | 'all'>('all');
  const [selectedPriority, setSelectedPriority] = useState<ProgramPriority | 'all'>('all');
  const [searchValue, setSearchValue] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState<ProgramDetail | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [confirmComment, setConfirmComment] = useState<string>('');
  const [pendingAction, setPendingAction] = useState<{ program: ProgramReviewItem; action: ProgramWorkflowAction } | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });
  const [processIndex, setProcessIndex] = useState<number>(0);
  const [focusedStatus, setFocusedStatus] = useState<ProgramStatus>(ProgramStatus.DRAFT);
  const [focusedStage, setFocusedStage] = useState<ProgramWorkflowStage>(ProgramWorkflowStage.DRAFT);
  // Removed sample datasets; we will fetch real history per program on demand
  const [historyEntries, setHistoryEntries] = useState<ApprovalHistoryEntry[]>([]);
  const [showGuide, setShowGuide] = useState(false);

  const updateProcessContext = (program?: { status: ProgramStatus }) => {
    if (!program) {
      setProcessIndex(0);
      setFocusedStatus(ProgramStatus.DRAFT);
      setFocusedStage(ProgramWorkflowStage.DRAFT);
      return;
    }
    const stage = getProgramStageFromStatus(program.status);
    setProcessIndex(computeProgramStepIndex(program.status));
    setFocusedStatus(program.status);
    setFocusedStage(stage);
  };

  const mapApprovalActionToStatus = (action?: string): ProgramStatus => {
    const normalized = (action || '').toUpperCase();
    if (normalized.includes('REQUEST') || normalized.includes('EDIT')) return ProgramStatus.DRAFT;
    if (normalized.includes('APPROVE')) return ProgramStatus.APPROVED;
    if (normalized.includes('REJECT')) return ProgramStatus.REJECTED;
    if (normalized.includes('PUBLISH')) return ProgramStatus.PUBLISHED;
    if (normalized.includes('SUBMIT') || normalized.includes('REVIEW')) return ProgramStatus.REVIEWING;
    return ProgramStatus.DRAFT;
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/tms/programs/stats');
      const result = await response.json();
      if (response.ok && result?.success) {
        setStats(result.data ?? DEFAULT_PROGRAM_STATS);
      }
    } catch (err) {
      console.error('Failed to fetch program stats', err);
    }
  };

  const fetchPrograms = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: '1',
        limit: '100',
      });

      const response = await fetch(`/api/tms/programs?${params.toString()}`);
      const result = (await response.json()) as ProgramListApiResponse;

      if (!response.ok || !result.success || !result.data) {
        throw new Error(result.error || 'Không thể tải danh sách chương trình');
      }

      const mapped = (result.data.items ?? []).map(mapProgramResponse).map((item) => ({
        ...item,
        priority: normalizeProgramPriority(item.priority),
        stage: getProgramStageFromStatus(item.status),
      }));

      setPrograms(mapped);
      setHistoryEntries([]);
      if (mapped.length > 0) {
        updateProcessContext({ status: mapped[0].status });
      } else {
        updateProcessContext();
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Đã xảy ra lỗi khi tải dữ liệu';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrograms();
    fetchStats();
  }, []);

  // No dependency on sample datasets anymore

  const filteredPrograms = useMemo(() => {
    return programs.filter((program) => {
      const matchesStatus = selectedStatus === 'all' || program.status === selectedStatus;
      const matchesStage = selectedStage === 'all' || program.stage === selectedStage;
      const matchesPriority = selectedPriority === 'all' || program.priority === selectedPriority;
      const haystack = `${program.code} ${program.nameVi}`.toLowerCase();
      const matchesSearch = searchTerm === '' || haystack.includes(searchTerm.toLowerCase());
      return matchesStatus && matchesStage && matchesPriority && matchesSearch;
    });
  }, [programs, searchTerm, selectedStatus, selectedStage, selectedPriority]);

  const handleSearch = () => {
    setSearchTerm(searchValue.trim());
  };

  const handleResetFilters = () => {
    setSelectedStatus('all');
    setSelectedStage('all');
    setSelectedPriority('all');
    setSearchValue('');
    setSearchTerm('');
  };

  const openActionConfirm = (program: ProgramReviewItem, action: ProgramWorkflowAction) => {
    setPendingAction({ program, action });
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
      const nextStatus = mapApprovalActionToStatus(String(pendingAction.action));
      const response = await fetch(`/api/tms/programs/${pendingAction.program.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: nextStatus, workflow_notes: confirmComment }),
      });

      const result = await response.json();
      if (!response.ok || !result?.success) {
        throw new Error(result?.error || 'Thao tác không thành công');
      }

      const successMessage = getProgramActionCopy(pendingAction.action)?.success || 'Thao tác thành công.';
      setSnackbar({ open: true, message: successMessage, severity: 'success' });
      closeActionConfirm();
      fetchPrograms();
      fetchStats();
      if (detail) {
        try {
          const hRes = await fetch(`/api/tms/programs/${detail.id}/approval-history`);
          const hJson = await hRes.json();
          const items = hJson?.items ?? hJson?.data?.items ?? [];
          if (hRes.ok && Array.isArray(items)) {
            setHistoryEntries(
              (items as Array<Record<string, unknown>>)
                .map((r, idx) => {
                  const id = String((r as any).id ?? idx);
                  const approver = (r as any).approver as { full_name?: string; email?: string } | undefined;
                  const actor = approver?.full_name || approver?.email || '—';
                  const role = approver?.email || '';
                  const action = String((r as any).action ?? '');
                  const normalized = (action || '').toUpperCase();
                  const status = mapApprovalActionToStatus(normalized);
                  const timestamp = String((r as any).approved_at ?? (r as any).created_at ?? new Date().toISOString());
                  const note = (r as any).comments as string | undefined;
                  return { id, actor, role, action, status, timestamp, note } as ApprovalHistoryEntry;
                })
                .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            );
          }
        } catch (_) {
          // ignore
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể thực hiện thao tác';
      setSnackbar({ open: true, message, severity: 'error' });
    } finally {
      setConfirmLoading(false);
    }
  };

  const openDetailDialog = async (programId: string) => {
    setDetailOpen(true);
    setDetailLoading(true);
    try {
      const response = await fetch(`/api/tms/programs/${programId}`);
      const result = await response.json();

      if (!response.ok || !result?.success || !result?.data) {
        throw new Error(result?.error || 'Không thể tải chi tiết chương trình');
      }

      const detailData = mapProgramDetail(result.data as ProgramApiResponseItem);
      setDetail(detailData);
      // Fetch real approval history
      try {
        const hRes = await fetch(`/api/tms/programs/${programId}/approval-history`);
        const hJson = await hRes.json();
        const items = hJson?.items ?? hJson?.data?.items ?? [];
        if (hRes.ok && Array.isArray(items)) {
          setHistoryEntries(
            (items as Array<Record<string, unknown>>).map((r, idx) => {
              const id = String((r as any).id ?? idx);
              const approver = (r as any).approver as { full_name?: string; email?: string } | undefined;
              const actor = approver?.full_name || approver?.email || '—';
              const role = approver?.email || '';
              const action = String((r as any).action ?? '');
              const normalized = (action || '').toUpperCase();
              const status = mapApprovalActionToStatus(normalized);
              const timestamp = String((r as any).approved_at ?? (r as any).created_at ?? new Date().toISOString());
              const note = (r as any).comments as string | undefined;
              return { id, actor, role, action, status, timestamp, note } as ApprovalHistoryEntry;
            }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          );
        } else {
          setHistoryEntries([]);
        }
      } catch (_) {
        setHistoryEntries([]);
      }
      updateProcessContext({ status: detailData.status });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể tải chi tiết chương trình';
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

  const handleSnackbarClose = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  const clampedProcessIndex = Math.max(0, Math.min(processStages.length - 1, processIndex));
  const progressValue =
    processStages.length <= 1 ? 100 : (clampedProcessIndex / (processStages.length - 1)) * 100;
  const activeStageLabel = getProgramWorkflowStageLabel(focusedStage);
  const activeStatusLabel = getProgramStatusLabel(focusedStatus);

  const getActionButtons = (program: ProgramReviewItem, context: 'table' | 'detail' = 'table') => {
    const buttons: JSX.Element[] = [];

    if (context === 'table') {
      buttons.push(
        <Tooltip key={`view-${program.id}`} title="Xem chi tiết">
          <Button
            size="small"
            variant="outlined"
            startIcon={<VisibilityIcon fontSize="small" />}
            onClick={(event) => {
              event.stopPropagation();
              openDetailDialog(program.id);
            }}
          >
            Xem
          </Button>
        </Tooltip>,
      );
      // Chỉ hiển thị nút xem ở bảng; các thao tác khác giữ trong modal chi tiết
      return buttons;
    }

    // Nút Xóa và các thao tác chỉ hiển thị trong modal chi tiết

    // Logic theo từng status
    if (program.status === ProgramStatus.DRAFT) {
      // Draft: Gửi xem xét + Xóa (Xóa đã thêm ở trên)
      buttons.push(
        <Button
          key={`submit-${program.id}`}
          size="small"
          variant="contained"
          color="primary"
          startIcon={<CheckCircleIcon fontSize="small" />}
          onClick={(event) => {
            event.stopPropagation();
            openActionConfirm(program, ProgramWorkflowAction.SUBMIT);
          }}
        >
          Gửi xem xét
        </Button>,
      );
    }

    if (program.status === ProgramStatus.REVIEWING) {
      // Reviewing: Phê duyệt, Từ chối, Yêu cầu chỉnh sửa
      buttons.push(
        <PermissionButton
          key={`approve-${program.id}`}
          requiredPermissions={[PROGRAM_PERMISSIONS.APPROVE]}
          size="small"
          variant="contained"
          color="success"
          startIcon={<CheckCircleIcon fontSize="small" />}
          onClick={(event) => {
            event.stopPropagation();
            openActionConfirm(program, ProgramWorkflowAction.APPROVE);
          }}
          noPermissionTooltip="Bạn không có quyền phê duyệt chương trình này"
        >
          Phê duyệt
        </PermissionButton>,
      );
      buttons.push(
        <PermissionButton
          key={`reject-${program.id}`}
          requiredPermissions={[PROGRAM_PERMISSIONS.REJECT]}
          size="small"
          color="error"
          variant="outlined"
          startIcon={<CancelIcon fontSize="small" />}
          onClick={(event) => {
            event.stopPropagation();
            openActionConfirm(program, ProgramWorkflowAction.REJECT);
          }}
          noPermissionTooltip="Bạn không có quyền từ chối chương trình này"
        >
          Từ chối
        </PermissionButton>,
      );
      buttons.push(
        <PermissionButton
          key={`request-edit-${program.id}`}
          requiredPermissions={[PROGRAM_PERMISSIONS.REQUEST_EDIT]}
          size="small"
          variant="outlined"
          color="warning"
          startIcon={<EditIcon fontSize="small" />}
          onClick={(event) => {
            event.stopPropagation();
            openActionConfirm(program, ProgramWorkflowAction.REQUEST_EDIT);
          }}
          noPermissionTooltip="Bạn không có quyền yêu cầu chỉnh sửa chương trình này"
        >
          Yêu cầu chỉnh sửa
        </PermissionButton>,
      );
    }

    if (program.status === ProgramStatus.APPROVED) {
      // Approved: Yêu cầu chỉnh sửa, Hội đồng khoa học công bố
      buttons.push(
        <PermissionButton
          key={`request-edit-${program.id}`}
          requiredPermissions={[PROGRAM_PERMISSIONS.REQUEST_EDIT]}
          size="small"
          variant="outlined"
          color="warning"
          startIcon={<EditIcon fontSize="small" />}
          onClick={(event) => {
            event.stopPropagation();
            openActionConfirm(program, ProgramWorkflowAction.REQUEST_EDIT);
          }}
          noPermissionTooltip="Bạn không có quyền yêu cầu chỉnh sửa chương trình này"
        >
          Yêu cầu chỉnh sửa
        </PermissionButton>,
      );
      buttons.push(
        <PermissionButton
          key={`science-council-publish-${program.id}`}
          requiredPermissions={[PROGRAM_PERMISSIONS.SCIENCE_COUNCIL_PUBLISH]}
          size="small"
          variant="contained"
          color="primary"
          startIcon={<ScienceIcon fontSize="small" />}
          onClick={(event) => {
            event.stopPropagation();
            openActionConfirm(program, ProgramWorkflowAction.SCIENCE_COUNCIL_PUBLISH);
          }}
          noPermissionTooltip="Bạn không có quyền Hội đồng khoa học công bố chương trình này"
        >
          Hội đồng khoa học công bố
        </PermissionButton>,
      );
    }

    if (program.status === ProgramStatus.PUBLISHED) {
      // Published: Yêu cầu chỉnh sửa
      buttons.push(
        <PermissionButton
          key={`request-edit-${program.id}`}
          requiredPermissions={[PROGRAM_PERMISSIONS.REQUEST_EDIT]}
          size="small"
          variant="outlined"
          color="warning"
          startIcon={<EditIcon fontSize="small" />}
          onClick={(event) => {
            event.stopPropagation();
            openActionConfirm(program, ProgramWorkflowAction.REQUEST_EDIT);
          }}
          noPermissionTooltip="Bạn không có quyền yêu cầu chỉnh sửa chương trình này"
        >
          Yêu cầu chỉnh sửa
        </PermissionButton>,
      );
    }

    // Legacy logic cho các status khác (để tương thích ngược)
    if (program.status === ProgramStatus.SUBMITTED) {
      buttons.push(
        <PermissionButton
          key={`review-${program.id}`}
          requiredPermissions={[PROGRAM_PERMISSIONS.REVIEW]}
          size="small"
          variant="outlined"
          color="primary"
          startIcon={<CheckCircleIcon fontSize="small" />}
          onClick={(event) => {
            event.stopPropagation();
            openActionConfirm(program, ProgramWorkflowAction.REVIEW);
          }}
          noPermissionTooltip="Bạn không có quyền tiếp nhận chương trình này"
        >
          Tiếp nhận
        </PermissionButton>,
      );
    }

    return buttons;
  };

  const detailActionButtons = detail
    ? getActionButtons(buildReviewItemFromDetail(detail), 'detail')
    : [];

  return (
    <PermissionGuard requiredPermissions={[PROGRAM_PERMISSIONS.REVIEW, PROGRAM_PERMISSIONS.APPROVE, PROGRAM_PERMISSIONS.PUBLISH]} fallback={
      <Box sx={{ py: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Typography variant="h6" color="error">
          Bạn không có quyền truy cập trang này. Vui lòng liên hệ quản trị viên.
        </Typography>
      </Box>
    }>
      <Box sx={{ py: 4, backgroundColor: 'background.default', minHeight: '100vh' }}>
        <Container maxWidth={false} sx={{ maxWidth: '98vw', px: 1 }}>
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
            <Typography color="text.primary">Phê duyệt</Typography>
          </Breadcrumbs>

          <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', md: 'center' }} spacing={3} mb={4}>
            <Stack spacing={1}>
              <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
                Phê duyệt chương trình đào tạo
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Giám sát trạng thái phê duyệt và thực hiện các thao tác nhanh cho chương trình đào tạo.
              </Typography>
            </Stack>
            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <Button
                variant="outlined"
                color="info"
                startIcon={<HelpIcon />}
                onClick={() => setShowGuide(!showGuide)}
              >
                {showGuide ? 'Ẩn hướng dẫn' : 'Hướng dẫn phê duyệt'}
              </Button>
              <Button
                variant="outlined"
                color="primary"
                startIcon={<RefreshIcon />}
                onClick={() => {
                  fetchPrograms();
                  fetchStats();
                }}
              >
                Làm mới dữ liệu
              </Button>
            </Stack>
          </Stack>

        {/* Stats */}
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, 
          gap: 2, 
          mb: 4 
        }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ bgcolor: 'warning.main' }}>
                  <RocketLaunchIcon fontSize="small" />
                </Avatar>
                <Stack spacing={0.5}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Đang chờ xử lý
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {stats.pending}
                  </Typography>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ bgcolor: 'info.main' }}>
                  <TimelineIcon fontSize="small" />
                </Avatar>
                <Stack spacing={0.5}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Đang xem xét
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {stats.reviewing}
                  </Typography>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ bgcolor: 'success.main' }}>
                  <CheckCircleIcon fontSize="small" />
                </Avatar>
                <Stack spacing={0.5}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Đã phê duyệt
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {stats.approved}
                  </Typography>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ bgcolor: 'error.main' }}>
                  <CancelIcon fontSize="small" />
                </Avatar>
                <Stack spacing={0.5}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Bị từ chối
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {stats.rejected}
                  </Typography>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Box>

        <Paper
          elevation={0}
          sx={{
            p: 3,
            mb: 3,
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
                  Quy trình phê duyệt chương trình
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Theo dõi tiến độ xử lý hiện tại dựa trên trạng thái chương trình đang được chọn.
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
                  color={getProgramStatusColor(focusedStatus)}
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
                  const StageIcon = stageDef.Icon as typeof SchoolIcon;
                  const isReached = idx <= clampedProcessIndex;
                  const isCurrent = stageDef.stage === focusedStage;
                  return (
                    <Box key={stageDef.stage} sx={{ textAlign: 'center', minWidth: 0 }}>
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

          {/* Hướng dẫn phê duyệt */}
        <Collapse in={showGuide} timeout="auto" unmountOnExit>
          <Card sx={{ mb: 3, border: '1px solid', borderColor: 'primary.light' }}>
            <CardHeader
              avatar={<SecurityIcon color="primary" />}
              title="Hướng dẫn phê duyệt chương trình đào tạo"
              subheader="Quy trình và phân quyền theo từng cấp"
            />
            <CardContent>
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, 
                gap: 3 
              }}>
                {/* Quy trình */}
                <Box>
                  <Typography variant="h6" gutterBottom color="primary">
                    Quy trình phê duyệt
                  </Typography>
                  <Stepper orientation="vertical" sx={{ mt: 1 }}>
                    <Step>
                      <StepLabel>
                        <Typography variant="body2" fontWeight="bold">Bước 1: Khoa soạn thảo (Draft)</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Khoa (hoặc người được ủy quyền) tạo bản draft CTĐT
                        </Typography>
                      </StepLabel>
                      <Box sx={{ ml: 4, mt: 1, p: 1.5, bgcolor: 'success.50', borderRadius: 1, border: '1px solid', borderColor: 'success.200' }}>
                        <Typography variant="caption" display="block" fontWeight="bold" color="success.dark">
                          ✓ Toàn quyền CRUD
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Tự do thêm/sửa/xóa khối học phần, gán học phần (thủ công, hàng loạt, kéo thả)
                        </Typography>
                      </Box>
                    </Step>
                    <Step>
                      <StepLabel>
                        <Typography variant="body2" fontWeight="bold">Bước 2: Gửi lên Phòng Đào tạo</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Sau khi gửi, Khoa mất quyền chỉnh sửa
                        </Typography>
                      </StepLabel>
                      <Box sx={{ ml: 4, mt: 1, p: 1.5, bgcolor: 'info.50', borderRadius: 1, border: '1px solid', borderColor: 'info.200' }}>
                        <Typography variant="caption" display="block" fontWeight="bold" color="info.dark">
                          Phòng Đào tạo xem xét:
                        </Typography>
                        <Typography variant="caption" component="div" color="text.secondary">
                          • <strong>Duyệt:</strong> CTĐT có hiệu lực sử dụng ngay<br/>
                          • <strong>Từ chối:</strong> Kết thúc quy trình<br/>
                          • <strong>Yêu cầu chỉnh sửa:</strong> Khoa được quyền chỉnh sửa lại và gửi lại
                        </Typography>
                      </Box>
                    </Step>
                    <Step>
                      <StepLabel>
                        <Typography variant="body2" fontWeight="bold">Bước 3: Hội đồng/BGH công bố</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Công bố chính thức toàn hệ thống đại học
                        </Typography>
                      </StepLabel>
                      <Box sx={{ ml: 4, mt: 1, p: 1.5, bgcolor: 'warning.50', borderRadius: 1, border: '1px solid', borderColor: 'warning.200' }}>
                        <Typography variant="caption" display="block" fontWeight="bold" color="warning.dark">
                          Hội đồng đào tạo/BGH:
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Quy trình tương tự PĐT, nhưng cấp độ công bố toàn hệ thống
                        </Typography>
                      </Box>
                    </Step>
                  </Stepper>
                </Box>

                {/* Phân quyền */}
                <Box>
                  <Typography variant="h6" gutterBottom color="primary">
                    Phân quyền theo Role
                  </Typography>
                  <TableContainer component={Paper} variant="outlined" sx={{ mt: 1 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Role</TableCell>
                          <TableCell align="center">Draft & Submit</TableCell>
                          <TableCell align="center">Approve</TableCell>
                          <TableCell align="center">Reject</TableCell>
                          <TableCell align="center">Request Edit</TableCell>
                          <TableCell align="center">Science Council</TableCell>
                          <TableCell align="center">Close</TableCell>
                          <TableCell align="center">Delete</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        <TableRow>
                          <TableCell><Chip label="Giảng viên" size="small" variant="outlined" /></TableCell>
                          <TableCell align="center"><CheckCircleIcon color="success" fontSize="small" /></TableCell>
                          <TableCell align="center"><CancelIcon color="error" fontSize="small" /></TableCell>
                          <TableCell align="center"><CancelIcon color="error" fontSize="small" /></TableCell>
                          <TableCell align="center"><CancelIcon color="error" fontSize="small" /></TableCell>
                          <TableCell align="center"><CancelIcon color="error" fontSize="small" /></TableCell>
                          <TableCell align="center"><CancelIcon color="error" fontSize="small" /></TableCell>
                          <TableCell align="center"><CancelIcon color="error" fontSize="small" /></TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell><Chip label="Khoa" size="small" variant="outlined" /></TableCell>
                          <TableCell align="center"><CheckCircleIcon color="success" fontSize="small" /></TableCell>
                          <TableCell align="center"><CheckCircleIcon color="success" fontSize="small" /></TableCell>
                          <TableCell align="center"><CheckCircleIcon color="success" fontSize="small" /></TableCell>
                          <TableCell align="center"><CheckCircleIcon color="success" fontSize="small" /></TableCell>
                          <TableCell align="center"><CancelIcon color="error" fontSize="small" /></TableCell>
                          <TableCell align="center"><CancelIcon color="error" fontSize="small" /></TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell><Chip label="Phòng Đào tạo" size="small" variant="outlined" /></TableCell>
                          <TableCell align="center"><CheckCircleIcon color="success" fontSize="small" /></TableCell>
                          <TableCell align="center"><CheckCircleIcon color="success" fontSize="small" /></TableCell>
                          <TableCell align="center"><CheckCircleIcon color="success" fontSize="small" /></TableCell>
                          <TableCell align="center"><CheckCircleIcon color="success" fontSize="small" /></TableCell>
                          <TableCell align="center"><CancelIcon color="error" fontSize="small" /></TableCell>
                          <TableCell align="center"><CancelIcon color="error" fontSize="small" /></TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell><Chip label="Hội đồng KH" size="small" variant="outlined" /></TableCell>
                          <TableCell align="center"><CheckCircleIcon color="success" fontSize="small" /></TableCell>
                          <TableCell align="center"><CheckCircleIcon color="success" fontSize="small" /></TableCell>
                          <TableCell align="center"><CheckCircleIcon color="success" fontSize="small" /></TableCell>
                          <TableCell align="center"><CheckCircleIcon color="success" fontSize="small" /></TableCell>
                          <TableCell align="center"><CheckCircleIcon color="success" fontSize="small" /></TableCell>
                          <TableCell align="center"><CancelIcon color="error" fontSize="small" /></TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell><Chip label="Admin" size="small" color="primary" /></TableCell>
                          <TableCell align="center"><CheckCircleIcon color="success" fontSize="small" /></TableCell>
                          <TableCell align="center"><CheckCircleIcon color="success" fontSize="small" /></TableCell>
                          <TableCell align="center"><CheckCircleIcon color="success" fontSize="small" /></TableCell>
                          <TableCell align="center"><CheckCircleIcon color="success" fontSize="small" /></TableCell>
                          <TableCell align="center"><CheckCircleIcon color="success" fontSize="small" /></TableCell>
                          <TableCell align="center"><CheckCircleIcon color="success" fontSize="small" /></TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Typography variant="h6" gutterBottom color="primary">
                Lưu ý quan trọng
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon><CheckCircleIcon color="success" fontSize="small" /></ListItemIcon>
                  <ListItemText 
                    primary="Khoa có toàn quyền khi Draft" 
                    secondary="Ở trạng thái Draft, Khoa có thể thêm/sửa/xóa tự do mọi thành phần của CTĐT" 
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckCircleIcon color="warning" fontSize="small" /></ListItemIcon>
                  <ListItemText 
                    primary="Mất quyền chỉnh sửa sau khi gửi" 
                    secondary="Sau khi gửi lên PĐT, Khoa không thể chỉnh sửa cho đến khi được yêu cầu chỉnh sửa" 
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckCircleIcon color="info" fontSize="small" /></ListItemIcon>
                  <ListItemText 
                    primary="PĐT duyệt = Có hiệu lực ngay" 
                    secondary="Khi Phòng Đào tạo duyệt, CTĐT có thể sử dụng ngay tại cấp Khoa/Đơn vị" 
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckCircleIcon color="primary" fontSize="small" /></ListItemIcon>
                  <ListItemText 
                    primary="HĐKH công bố = Toàn hệ thống" 
                    secondary="Hội đồng khoa học công bố chính thức, áp dụng toàn hệ thống đại học" 
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckCircleIcon color="error" fontSize="small" /></ListItemIcon>
                  <ListItemText 
                    primary="Quyền xóa chỉ dành cho Admin" 
                    secondary="Đảm bảo an toàn dữ liệu, tránh xóa nhầm chương trình đã được duyệt" 
                  />
                </ListItem>
              </List>
              
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                  Tóm tắt luồng phê duyệt:
                </Typography>
                <Typography variant="body2">
                  Draft (Khoa toàn quyền) → Gửi PĐT (Khoa mất quyền) → PĐT xem xét → (Nếu duyệt) Hiệu lực tại Khoa → HĐKH xem xét → (Nếu duyệt) Công bố toàn hệ thống
                </Typography>
              </Alert>
            </CardContent>
          </Card>
        </Collapse>

        {/* Filters */}
        <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider', mb: 3 }}>
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', md: '2fr 1fr 1fr 1fr 0.5fr' }, 
            gap: 2,
            alignItems: 'center'
          }}>
            <TextField
              fullWidth
              label="Tìm kiếm theo mã hoặc tên"
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  handleSearch();
                }
              }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton edge="end" onClick={handleSearch}>
                      <SearchIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <FormControl fullWidth>
              <InputLabel id="status-filter-label">Trạng thái</InputLabel>
              <Select
                labelId="status-filter-label"
                label="Trạng thái"
                value={selectedStatus}
                onChange={(event) => setSelectedStatus(event.target.value as ProgramStatus | 'all')}
              >
                <MenuItem value="all">Tất cả</MenuItem>
                {PROGRAM_STATUSES.map((status) => (
                  <MenuItem key={status} value={status}>
                    {getProgramStatusLabel(status)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel id="stage-filter-label">Bước xử lý</InputLabel>
              <Select
                labelId="stage-filter-label"
                label="Bước xử lý"
                value={selectedStage}
                onChange={(event) => setSelectedStage(event.target.value as ProgramWorkflowStage | 'all')}
              >
                <MenuItem value="all">Tất cả</MenuItem>
                {PROGRAM_WORKFLOW_STAGES.map((stage) => (
                  <MenuItem key={stage} value={stage}>
                    {getProgramWorkflowStageLabel(stage)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel id="priority-filter-label">Độ ưu tiên</InputLabel>
              <Select
                labelId="priority-filter-label"
                label="Độ ưu tiên"
                value={selectedPriority}
                onChange={(event) => setSelectedPriority(event.target.value as ProgramPriority | 'all')}
              >
                <MenuItem value="all">Tất cả</MenuItem>
                {PROGRAM_PRIORITIES.map((priority) => (
                  <MenuItem key={priority} value={priority}>
                    {getProgramPriorityLabel(priority)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button fullWidth variant="text" color="inherit" onClick={handleResetFilters}>
              Xóa lọc
            </Button>
          </Box>
        </Paper>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
          {loading && <LinearProgress sx={{ borderRadius: 'inherit' }} />}
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Mã</TableCell>
                  <TableCell>Tên chương trình</TableCell>
                  <TableCell>Khoa phụ trách</TableCell>
                  <TableCell align="center">Trạng thái</TableCell>
                  <TableCell align="center">Bước xử lý</TableCell>
                  <TableCell align="center">Cập nhật</TableCell>
                  <TableCell align="center">Thao tác</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredPrograms.length === 0 && !loading ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                      <Typography color="text.secondary">Không có chương trình nào phù hợp.</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPrograms.map((program) => (
                    <TableRow
                      key={program.id}
                      hover
                      onClick={() => {
                        updateProcessContext({ status: program.status });
                      }}
                      sx={{ cursor: 'default' }}
                    >
                      <TableCell sx={{ fontWeight: 600 }}>{program.code}</TableCell>
                      <TableCell>
                        <Stack spacing={0.5}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                            {program.nameVi}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Phiên bản: {program.version ?? '—'}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Avatar sx={{ width: 28, height: 28, bgcolor: 'secondary.main' }}>
                            <SchoolIcon fontSize="small" />
                          </Avatar>
                          <Typography variant="body2" color="text.secondary">
                            {program.orgUnit?.name ?? 'Chưa gán đơn vị'}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={getProgramStatusLabel(program.status)}
                          color={getProgramStatusColor(program.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={getProgramWorkflowStageLabel(program.stage)}
                          color={getProgramStageChipColor(program.stage)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2" color="text.secondary">
                          {formatProgramDateTime(program.updatedAt)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap">
                          {getActionButtons(program)}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
        </Container>

      {/* Confirm Dialog */}
      <Dialog open={confirmOpen} onClose={confirmLoading ? undefined : closeActionConfirm} maxWidth="xs" fullWidth>
        <DialogTitle>
          {pendingAction ? getProgramActionCopy(pendingAction.action).title : 'Xác nhận thao tác'}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            {pendingAction ? getProgramActionCopy(pendingAction.action).description : 'Bạn có chắc muốn tiếp tục?'}
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

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onClose={closeDetailDialog} maxWidth="md" fullWidth>
        <DialogTitle>Chi tiết chương trình đào tạo</DialogTitle>
        <DialogContent dividers sx={{ minHeight: 260 }}>
          {detailLoading && <LinearProgress sx={{ mb: 2 }} />}

          {detail && (
            <Stack spacing={3}>
              <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2}>
                <Stack spacing={1}>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {detail.nameVi}
                  </Typography>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Chip
                      label={getProgramStatusLabel(detail.status)}
                      color={getProgramStatusColor(detail.status)}
                      size="small"
                    />
                    <Chip
                      label={getProgramWorkflowStageLabel(getProgramStageFromStatus(detail.status))}
                      color={getProgramStageChipColor(getProgramStageFromStatus(detail.status))}
                      size="small"
                    />
                    <Chip
                      label={`Ưu tiên: ${getProgramPriorityLabel(detail.priority)}`}
                      color={getProgramPriorityColor(detail.priority) === 'default' ? 'default' : getProgramPriorityColor(detail.priority)}
                      size="small"
                    />
                  </Stack>
                </Stack>
                <Stack spacing={0.5} alignItems={{ xs: 'flex-start', md: 'flex-end' }}>
                  <Typography variant="body2" color="text.secondary">
                    Mã chương trình: <strong>{detail.code}</strong>
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Phiên bản: <strong>{detail.version ?? '—'}</strong>
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Cập nhật: <strong>{formatProgramDateTime(detail.updatedAt)}</strong>
                  </Typography>
                </Stack>
              </Stack>

              <Stepper activeStep={computeProgramStepIndex(detail.status)} alternativeLabel>
                {PROGRAM_WORKFLOW_STAGES.map((stage) => (
                  <Step key={stage}>
                    <StepLabel>{getProgramWorkflowStageLabel(stage)}</StepLabel>
                  </Step>
                ))}
              </Stepper>

              {detail.description && (
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                    Mô tả chương trình
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {detail.description}
                  </Typography>
                </Box>
              )}

              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                  Lịch sử phê duyệt
                </Typography>
                {historyEntries.length > 0 ? (
                  <List dense disablePadding>
                    {historyEntries.map((entry, index) => {
                      const normalizedStatus = entry.status?.toString().toUpperCase() ?? ProgramStatus.DRAFT;
                      const statusLabel = getProgramStatusLabel(normalizedStatus);
                      const statusChipColor = getProgramStatusColor(normalizedStatus);

                      const renderIcon = () => {
                        const normalized = normalizedStatus;
                        if (normalized === ProgramStatus.REJECTED) return <CancelIcon color="error" fontSize="small" />;
                        if (normalized === ProgramStatus.PUBLISHED) return <RocketLaunchIcon color="primary" fontSize="small" />;
                        if (normalized === ProgramStatus.APPROVED) return <CheckCircleIcon color="success" fontSize="small" />;
                        return <TimelineIcon color="info" fontSize="small" />;
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
                                    {formatProgramDateTime(entry.timestamp)}
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
                    Chưa có lịch sử phê duyệt cho chương trình này.
                  </Typography>
                )}
              </Box>

              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} justifyContent="space-between">
                  <Stack spacing={1}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Khoa phụ trách
                    </Typography>
                    <Typography variant="body1">
                      {detail.orgUnit?.name ?? 'Chưa gán đơn vị'}
                    </Typography>
                  </Stack>
                  <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', md: 'block' } }} />
                  <Stack spacing={1}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Thống kê nhanh
                    </Typography>
                    <Stack direction="row" spacing={2}>
                      <Chip
                        icon={<DescriptionIcon fontSize="small" />}
                        label={`${detail.stats.blockCount} khối học phần`}
                        size="small"
                        variant="outlined"
                      />
                      <Chip
                        icon={<DescriptionIcon fontSize="small" />}
                        label={`${detail.stats.courseCount} học phần`}
                        size="small"
                        variant="outlined"
                      />
                    </Stack>
                  </Stack>
                </Stack>
              </Paper>
            </Stack>
      )}

        {/* history approval */}

      {!detailLoading && !detail && (
        <Typography variant="body2" color="text.secondary">
          Không tìm thấy thông tin chương trình.
        </Typography>
      )}
    </DialogContent>
    <DialogActions>
      {detailActionButtons.length > 0 && (
        <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mr: 'auto' }}>
          {detailActionButtons}
        </Stack>
      )}
      {detail && (
        <Button
          variant="outlined"
          onClick={() => {
            router.push(`/tms/programs/${detail.id}`);
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

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
      </Box>
    </PermissionGuard>
  );
}
