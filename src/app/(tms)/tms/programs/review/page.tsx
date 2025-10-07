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
} from '@mui/icons-material';
import { PermissionGuard } from '@/components/auth/permission-guard';
import {
  ProgramPriority,
  ProgramStatus,
  PROGRAM_STATUSES,
  PROGRAM_PRIORITIES,
  ProgramWorkflowStage,
  PROGRAM_WORKFLOW_STAGES,
  PROGRAM_PERMISSIONS,
  getProgramStatusColor,
  getProgramStatusLabel,
  getProgramPriorityColor,
  getProgramPriorityLabel,
  getProgramWorkflowStageLabel,
  getProgramStageFromStatus,
  normalizeProgramPriority,
} from '@/constants/programs';
import type { ProgramWorkflowAction } from '@/lib/api/schemas/program';
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

const defaultStats: ProgramStatsSummary = {
  pending: 0,
  reviewing: 0,
  approved: 0,
  rejected: 0,
  total: 0,
};

const stageChipColor: Record<ProgramWorkflowStage, 'default' | 'info' | 'success' | 'warning'> = {
  [ProgramWorkflowStage.DRAFT]: 'default',
  [ProgramWorkflowStage.REVIEWING]: 'info',
  [ProgramWorkflowStage.APPROVED]: 'success',
  [ProgramWorkflowStage.PUBLISHED]: 'success',
};

const actionCopy: Record<ProgramWorkflowAction, { title: string; description: string; success?: string }> = {
  submit: {
    title: 'Gửi phê duyệt',
    description: 'Bạn muốn gửi chương trình đào tạo này vào quy trình phê duyệt?',
    success: 'Đã gửi chương trình vào quy trình phê duyệt.',
  },
  review: {
    title: 'Tiếp nhận chương trình',
    description: 'Bạn xác nhận tiếp nhận và chuyển chương trình sang trạng thái Đang xem xét?',
    success: 'Đã chuyển sang trạng thái Đang xem xét.',
  },
  approve: {
    title: 'Phê duyệt chương trình',
    description: 'Bạn muốn phê duyệt chương trình đào tạo này?',
    success: 'Chương trình đã được phê duyệt.',
  },
  reject: {
    title: 'Từ chối chương trình',
    description: 'Bạn muốn từ chối chương trình đào tạo này?',
    success: 'Đã từ chối chương trình.',
  },
  publish: {
    title: 'Xuất bản chương trình',
    description: 'Bạn muốn xuất bản chương trình đào tạo này?',
    success: 'Chương trình đã được xuất bản.',
  },
};

const formatDateTime = (value?: string | null): string => {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString('vi-VN');
  } catch {
    return value;
  }
};

const computeStepIndex = (status: ProgramStatus): number => {
  const stage = getProgramStageFromStatus(status);
  const index = PROGRAM_WORKFLOW_STAGES.indexOf(stage);
  return index >= 0 ? index : 0;
};

const processStages = [
  { stage: ProgramWorkflowStage.DRAFT, label: 'Trưởng bộ môn', Icon: DescriptionIcon },
  { stage: ProgramWorkflowStage.REVIEWING, label: 'Phòng đào tạo', Icon: SchoolIcon },
  { stage: ProgramWorkflowStage.APPROVED, label: 'Ban phê duyệt', Icon: CheckCircleIcon },
  { stage: ProgramWorkflowStage.PUBLISHED, label: 'Hội đồng khoa học', Icon: RocketLaunchIcon },
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
  const [stats, setStats] = useState<ProgramStatsSummary>(defaultStats);
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
  const [pendingAction, setPendingAction] = useState<{ program: ProgramReviewItem; action: ProgramWorkflowAction } | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });
  const [processIndex, setProcessIndex] = useState<number>(0);
  const [focusedStatus, setFocusedStatus] = useState<ProgramStatus>(ProgramStatus.DRAFT);
  const [focusedStage, setFocusedStage] = useState<ProgramWorkflowStage>(ProgramWorkflowStage.DRAFT);
  const [historyDatasets, setHistoryDatasets] = useState<ApprovalHistoryDataset[]>([]);
  const [historyEntries, setHistoryEntries] = useState<ApprovalHistoryEntry[]>([]);

  const updateProcessContext = (program?: { status: ProgramStatus }) => {
    if (!program) {
      setProcessIndex(0);
      setFocusedStatus(ProgramStatus.DRAFT);
      setFocusedStage(ProgramWorkflowStage.DRAFT);
      return;
    }
    const stage = getProgramStageFromStatus(program.status);
    setProcessIndex(computeStepIndex(program.status));
    setFocusedStatus(program.status);
    setFocusedStage(stage);
  };

  const resolveHistoryEntries = (programId: string): ApprovalHistoryEntry[] => {
    const entries =
      historyDatasets.find((dataset) => dataset.programId.toString() === programId.toString())?.entries ?? [];
    return [...entries]
      .map((entry) => ({ ...entry }))
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/tms/programs/stats');
      const result = await response.json();
      if (response.ok && result?.success) {
        setStats(result.data ?? defaultStats);
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
    const loadHistorySamples = async () => {
      try {
        const response = await fetch('/review/data.json');
        if (!response.ok) throw new Error('Failed to load approval history sample data');
        const data = (await response.json()) as { histories?: ApprovalHistoryDataset[] };
        setHistoryDatasets(data.histories ?? []);
      } catch (err) {
        console.error('Failed to load approval history samples', err);
        setHistoryDatasets([]);
      }
    };
    loadHistorySamples();
  }, []);

  useEffect(() => {
    if (detail) {
      setHistoryEntries(resolveHistoryEntries(detail.id));
    }
  }, [historyDatasets, detail?.id]);

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
  };

  const performWorkflowAction = async () => {
    if (!pendingAction) return;

    try {
      setConfirmLoading(true);
      const response = await fetch(`/api/tms/programs/${pendingAction.program.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ workflow_action: pendingAction.action }),
      });

      const result = await response.json();
      if (!response.ok || !result?.success) {
        throw new Error(result?.error || 'Thao tác không thành công');
      }

      const successMessage = actionCopy[pendingAction.action]?.success || 'Thao tác thành công.';
      setSnackbar({ open: true, message: successMessage, severity: 'success' });
      closeActionConfirm();
      fetchPrograms();
      fetchStats();
      if (detail) {
        setHistoryEntries(resolveHistoryEntries(detail.id));
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
      setHistoryEntries(resolveHistoryEntries(detailData.id));
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
    }

    if (program.status === ProgramStatus.DRAFT || program.status === ProgramStatus.SUBMITTED) {
      buttons.push(
        <PermissionGuard key={`review-${program.id}`} requiredPermissions={[PROGRAM_PERMISSIONS.REVIEW]}>
          <Button
            size="small"
            variant="outlined"
            color="primary"
            startIcon={<CheckCircleIcon fontSize="small" />}
            onClick={(event) => {
              event.stopPropagation();
              openActionConfirm(program, 'review');
            }}
          >
            Tiếp nhận
          </Button>
        </PermissionGuard>,
      );
    }

    if (program.status === ProgramStatus.REVIEWING) {
      buttons.push(
        <PermissionGuard key={`approve-${program.id}`} requiredPermissions={[PROGRAM_PERMISSIONS.APPROVE]}>
          <Button
            size="small"
            variant="contained"
            color="success"
            startIcon={<CheckCircleIcon fontSize="small" />}
            onClick={(event) => {
              event.stopPropagation();
              openActionConfirm(program, 'approve');
            }}
          >
            Phê duyệt
          </Button>
        </PermissionGuard>,
      );
      buttons.push(
        <PermissionGuard key={`reject-${program.id}`} requiredPermissions={[PROGRAM_PERMISSIONS.REJECT]}>
          <Button
            size="small"
            color="error"
            variant="outlined"
            startIcon={<CancelIcon fontSize="small" />}
            onClick={(event) => {
              event.stopPropagation();
              openActionConfirm(program, 'reject');
            }}
          >
            Từ chối
          </Button>
        </PermissionGuard>,
      );
    }

    if (program.status === ProgramStatus.APPROVED) {
      buttons.push(
        <PermissionGuard key={`publish-${program.id}`} requiredPermissions={[PROGRAM_PERMISSIONS.PUBLISH]}>
          <Button
            size="small"
            variant="contained"
            color="primary"
            startIcon={<RocketLaunchIcon fontSize="small" />}
            onClick={(event) => {
              event.stopPropagation();
              openActionConfirm(program, 'publish');
            }}
          >
            Xuất bản
          </Button>
        </PermissionGuard>,
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
        <Container maxWidth="xl">
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
        <Grid container spacing={2} mb={4}>
          <Grid item xs={12} md={3}>
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
          </Grid>
          <Grid item xs={12} md={3}>
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
          </Grid>
          <Grid item xs={12} md={3}>
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
          </Grid>
          <Grid item xs={12} md={3}>
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
          </Grid>
        </Grid>

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

        {/* Filters */}
        <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider', mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
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
            </Grid>
            <Grid item xs={12} md={2.5}>
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
            </Grid>
            <Grid item xs={12} md={2.5}>
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
            </Grid>
            <Grid item xs={12} md={2.5}>
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
            </Grid>
            <Grid item xs={12} md={1}>
              <Button fullWidth variant="text" color="inherit" onClick={handleResetFilters}>
                Xóa lọc
              </Button>
            </Grid>
          </Grid>
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
                  <TableCell align="center">Số tín chỉ</TableCell>
                  <TableCell align="center">Cập nhật</TableCell>
                  <TableCell align="center">Thao tác</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredPrograms.length === 0 && !loading ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
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
                          color={stageChipColor[program.stage]}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {program.totalCredits}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2" color="text.secondary">
                          {formatDateTime(program.updatedAt)}
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
          {pendingAction ? actionCopy[pendingAction.action].title : 'Xác nhận thao tác'}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            {pendingAction ? actionCopy[pendingAction.action].description : 'Bạn có chắc muốn tiếp tục?'}
          </Typography>
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
                      color={stageChipColor[getProgramStageFromStatus(detail.status)]}
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
                    Cập nhật: <strong>{formatDateTime(detail.updatedAt)}</strong>
                  </Typography>
                </Stack>
              </Stack>

              <Stepper activeStep={computeStepIndex(detail.status)} alternativeLabel>
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
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
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
                                    {formatDateTime(entry.timestamp)}
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
