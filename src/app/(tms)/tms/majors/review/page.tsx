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
  MajorStatus,
  MajorWorkflowStage,
  MajorWorkflowAction,
  MAJOR_STATUSES,
  MAJOR_WORKFLOW_STAGES,
  MAJOR_PERMISSIONS,
  getMajorStatusColor,
  getMajorStatusLabel,
  getMajorWorkflowStageLabel,
  getMajorStageFromStatus,
  getMajorStageChipColor,
  getMajorActionCopy,
  formatMajorDateTime,
  computeMajorStepIndex,
} from '@/constants/majors';

interface MajorReviewItem {
  id: string;
  code: string;
  nameVi: string;
  nameEn?: string;
  status: MajorStatus;
  stage: MajorWorkflowStage;
  orgUnit?: {
    id: string;
    name: string;
  };
  updatedAt: string;
}

interface ApprovalHistoryEntry {
  id: string;
  timestamp: string;
  actor: string;
  role: string;
  action: string;
  status: MajorStatus | string;
  note?: string;
}

interface MajorStatsSummary {
  pending: number;
  reviewing: number;
  approved: number;
  rejected: number;
  total: number;
}

const DEFAULT_MAJOR_STATS: MajorStatsSummary = {
  pending: 0,
  reviewing: 0,
  approved: 0,
  rejected: 0,
  total: 0,
};

const processStages = [
  { stage: MajorWorkflowStage.DRAFT, label: 'Giảng viên soạn thảo', Icon: DescriptionIcon },
  { stage: MajorWorkflowStage.REVIEWING, label: 'Khoa gửi PĐT xem xét', Icon: SchoolIcon },
  { stage: MajorWorkflowStage.APPROVED, label: 'Phòng Đào Tạo phê duyệt', Icon: CheckCircleIcon },
  { stage: MajorWorkflowStage.PUBLISHED, label: 'Hội đồng khoa học công bố', Icon: RocketLaunchIcon },
];

export default function MajorReviewPage(): JSX.Element {
  const router = useRouter();
  const [majors, setMajors] = useState<MajorReviewItem[]>([]);
  const [stats, setStats] = useState<MajorStatsSummary>(DEFAULT_MAJOR_STATS);
  const [selectedStatus, setSelectedStatus] = useState<MajorStatus | 'all'>('all');
  const [selectedStage, setSelectedStage] = useState<MajorWorkflowStage | 'all'>('all');
  const [searchValue, setSearchValue] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState<any | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [confirmComment, setConfirmComment] = useState<string>('');
  const [pendingAction, setPendingAction] = useState<{ major: MajorReviewItem; action: MajorWorkflowAction } | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });
  const [processIndex, setProcessIndex] = useState<number>(0);
  const [focusedStatus, setFocusedStatus] = useState<MajorStatus>(MajorStatus.DRAFT);
  const [focusedStage, setFocusedStage] = useState<MajorWorkflowStage>(MajorWorkflowStage.DRAFT);
  const [historyEntries, setHistoryEntries] = useState<ApprovalHistoryEntry[]>([]);
  const [showGuide, setShowGuide] = useState(false);

  const updateProcessContext = (major?: { status: MajorStatus }) => {
    if (!major) {
      setProcessIndex(0);
      setFocusedStatus(MajorStatus.DRAFT);
      setFocusedStage(MajorWorkflowStage.DRAFT);
      return;
    }
    const stage = getMajorStageFromStatus(major.status);
    setProcessIndex(computeMajorStepIndex(major.status));
    setFocusedStatus(major.status);
    setFocusedStage(stage);
  };

  const mapApprovalActionToStatus = (action?: string): MajorStatus => {
    const normalized = (action || '').toUpperCase();
    if (normalized.includes('REQUEST') || normalized.includes('EDIT')) return MajorStatus.DRAFT;
    if (normalized.includes('APPROVE')) return MajorStatus.APPROVED;
    if (normalized.includes('REJECT')) return MajorStatus.REJECTED;
    if (normalized.includes('PUBLISH')) return MajorStatus.PUBLISHED;
    if (normalized.includes('SUBMIT') || normalized.includes('REVIEW')) return MajorStatus.REVIEWING;
    return MajorStatus.DRAFT;
  };

  const fetchStats = async () => {
    try {
      // Mock stats for now - replace with real API
      setStats({
        pending: majors.filter(m => m.status === MajorStatus.DRAFT).length,
        reviewing: majors.filter(m => m.status === MajorStatus.REVIEWING).length,
        approved: majors.filter(m => m.status === MajorStatus.APPROVED).length,
        rejected: majors.filter(m => m.status === MajorStatus.REJECTED).length,
        total: majors.length,
      });
    } catch (err) {
      console.error('Failed to fetch major stats', err);
    }
  };

  const fetchMajors = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/tms/majors');
      const result = await response.json();

      if (!response.ok || !result.success || !result.data) {
        throw new Error(result.error || 'Không thể tải danh sách ngành đào tạo');
      }

      const mapped = (result.data.items ?? []).map((item: any) => ({
        id: String(item.id),
        code: item.code,
        nameVi: item.name_vi,
        nameEn: item.name_en,
        status: item.status as MajorStatus,
        stage: getMajorStageFromStatus(item.status),
        orgUnit: item.OrgUnit ? {
          id: String(item.OrgUnit.id),
          name: item.OrgUnit.name,
        } : undefined,
        updatedAt: item.updated_at,
      }));

      setMajors(mapped);
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
    fetchMajors();
  }, []);

  useEffect(() => {
    fetchStats();
  }, [majors]);

  const filteredMajors = useMemo(() => {
    return majors.filter((major) => {
      const matchesStatus = selectedStatus === 'all' || major.status === selectedStatus;
      const matchesStage = selectedStage === 'all' || major.stage === selectedStage;
      const haystack = `${major.code} ${major.nameVi}`.toLowerCase();
      const matchesSearch = searchTerm === '' || haystack.includes(searchTerm.toLowerCase());
      return matchesStatus && matchesStage && matchesSearch;
    });
  }, [majors, searchTerm, selectedStatus, selectedStage]);

  const handleSearch = () => {
    setSearchTerm(searchValue.trim());
  };

  const handleResetFilters = () => {
    setSelectedStatus('all');
    setSelectedStage('all');
    setSearchValue('');
    setSearchTerm('');
  };

  const openActionConfirm = (major: MajorReviewItem, action: MajorWorkflowAction) => {
    setPendingAction({ major, action });
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
      const response = await fetch(`/api/tms/majors/${pendingAction.major.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: nextStatus, workflow_notes: confirmComment }),
      });

      const result = await response.json();
      if (!response.ok || !result?.success) {
        throw new Error(result?.error || 'Thao tác không thành công');
      }

      const successMessage = getMajorActionCopy(pendingAction.action)?.success || 'Thao tác thành công.';
      setSnackbar({ open: true, message: successMessage, severity: 'success' });
      
      // Fetch approval history trước khi đóng modal
      if (detail && detail.id) {
        try {
          const hRes = await fetch(`/api/tms/majors/${detail.id}/approval-history`);
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
      
      closeActionConfirm();
      closeDetailDialog(); // Tự động đóng modal chi tiết sau khi thực hiện action thành công
      fetchMajors();
      fetchStats();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể thực hiện thao tác';
      setSnackbar({ open: true, message, severity: 'error' });
    } finally {
      setConfirmLoading(false);
    }
  };

  const openDetailDialog = async (majorId: string) => {
    setDetailOpen(true);
    setDetailLoading(true);
    try {
      const response = await fetch(`/api/tms/majors/${majorId}`);
      const result = await response.json();

      if (!response.ok || !result?.success || !result?.data) {
        throw new Error(result?.error || 'Không thể tải chi tiết ngành đào tạo');
      }

      // Handle the nested data structure from API response
      const detailData = result.data?.data || result.data;
      console.log('Detail data:', detailData);
      console.log('Detail ID:', detailData?.id);
      setDetail(detailData);
      // Fetch real approval history
      try {
        const hRes = await fetch(`/api/tms/majors/${majorId}/approval-history`);
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
      const message = err instanceof Error ? err.message : 'Không thể tải chi tiết ngành đào tạo';
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
  const activeStageLabel = getMajorWorkflowStageLabel(focusedStage);
  const activeStatusLabel = getMajorStatusLabel(focusedStatus);

  const getActionButtons = (major: MajorReviewItem, context: 'table' | 'detail' = 'table') => {
    const buttons: JSX.Element[] = [];

    if (context === 'table') {
      buttons.push(
        <Tooltip key={`view-${major.id}`} title="Xem chi tiết">
          <Button
            size="small"
            variant="outlined"
            startIcon={<VisibilityIcon fontSize="small" />}
            onClick={(event) => {
              event.stopPropagation();
              openDetailDialog(major.id);
            }}
          >
            Xem
          </Button>
        </Tooltip>,
      );
      // Chỉ hiển thị nút xem ở bảng; các thao tác khác giữ trong modal chi tiết
      return buttons;
    }

    // Logic theo từng status
    if (major.status === MajorStatus.DRAFT) {
      buttons.push(
        <Button
          key={`submit-${major.id}`}
          size="small"
          variant="contained"
          color="primary"
          startIcon={<CheckCircleIcon fontSize="small" />}
          onClick={(event) => {
            event.stopPropagation();
            openActionConfirm(major, MajorWorkflowAction.SUBMIT);
          }}
        >
          Gửi xem xét
        </Button>,
      );
    }

    if (major.status === MajorStatus.REVIEWING) {
      buttons.push(
        <PermissionButton
          key={`approve-${major.id}`}
          requiredPermissions={[MAJOR_PERMISSIONS.APPROVE]}
          size="small"
          variant="contained"
          color="success"
          startIcon={<CheckCircleIcon fontSize="small" />}
          onClick={(event) => {
            event.stopPropagation();
            openActionConfirm(major, MajorWorkflowAction.APPROVE);
          }}
          noPermissionTooltip="Bạn không có quyền phê duyệt ngành đào tạo này"
        >
          Phê duyệt
        </PermissionButton>,
      );
      buttons.push(
        <PermissionButton
          key={`reject-${major.id}`}
          requiredPermissions={[MAJOR_PERMISSIONS.REJECT]}
          size="small"
          color="error"
          variant="outlined"
          startIcon={<CancelIcon fontSize="small" />}
          onClick={(event) => {
            event.stopPropagation();
            openActionConfirm(major, MajorWorkflowAction.REJECT);
          }}
          noPermissionTooltip="Bạn không có quyền từ chối ngành đào tạo này"
        >
          Từ chối
        </PermissionButton>,
      );
      buttons.push(
        <PermissionButton
          key={`request-edit-${major.id}`}
          requiredPermissions={[MAJOR_PERMISSIONS.REQUEST_EDIT]}
          size="small"
          variant="outlined"
          color="warning"
          startIcon={<EditIcon fontSize="small" />}
          onClick={(event) => {
            event.stopPropagation();
            openActionConfirm(major, MajorWorkflowAction.REQUEST_EDIT);
          }}
          noPermissionTooltip="Bạn không có quyền yêu cầu chỉnh sửa ngành đào tạo này"
        >
          Yêu cầu chỉnh sửa
        </PermissionButton>,
      );
    }

    if (major.status === MajorStatus.APPROVED) {
      buttons.push(
        <PermissionButton
          key={`request-edit-${major.id}`}
          requiredPermissions={[MAJOR_PERMISSIONS.REQUEST_EDIT]}
          size="small"
          variant="outlined"
          color="warning"
          startIcon={<EditIcon fontSize="small" />}
          onClick={(event) => {
            event.stopPropagation();
            openActionConfirm(major, MajorWorkflowAction.REQUEST_EDIT);
          }}
          noPermissionTooltip="Bạn không có quyền yêu cầu chỉnh sửa ngành đào tạo này"
        >
          Yêu cầu chỉnh sửa
        </PermissionButton>,
      );
      buttons.push(
        <PermissionButton
          key={`science-council-publish-${major.id}`}
          requiredPermissions={[MAJOR_PERMISSIONS.SCIENCE_COUNCIL_PUBLISH]}
          size="small"
          variant="contained"
          color="primary"
          startIcon={<ScienceIcon fontSize="small" />}
          onClick={(event) => {
            event.stopPropagation();
            openActionConfirm(major, MajorWorkflowAction.SCIENCE_COUNCIL_PUBLISH);
          }}
          noPermissionTooltip="Bạn không có quyền Hội đồng khoa học công bố ngành đào tạo này"
        >
          Hội đồng khoa học công bố
        </PermissionButton>,
      );
    }

    if (major.status === MajorStatus.PUBLISHED) {
      buttons.push(
        <PermissionButton
          key={`request-edit-${major.id}`}
          requiredPermissions={[MAJOR_PERMISSIONS.REQUEST_EDIT]}
          size="small"
          variant="outlined"
          color="warning"
          startIcon={<EditIcon fontSize="small" />}
          onClick={(event) => {
            event.stopPropagation();
            openActionConfirm(major, MajorWorkflowAction.REQUEST_EDIT);
          }}
          noPermissionTooltip="Bạn không có quyền yêu cầu chỉnh sửa ngành đào tạo này"
        >
          Yêu cầu chỉnh sửa
        </PermissionButton>,
      );
    }

    return buttons;
  };

  const detailActionButtons = detail && detail.id
    ? getActionButtons({
        id: String(detail.id),
        code: detail.code,
        nameVi: detail.name_vi,
        nameEn: detail.name_en,
        status: detail.status,
        stage: getMajorStageFromStatus(detail.status),
        orgUnit: detail.OrgUnit ? {
          id: String(detail.OrgUnit.id),
          name: detail.OrgUnit.name,
        } : undefined,
        updatedAt: detail.updated_at,
      }, 'detail')
    : [];

  return (
    <PermissionGuard requiredPermissions={[MAJOR_PERMISSIONS.VIEW, MAJOR_PERMISSIONS.REVIEW]} fallback={
      <Box sx={{ py: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Typography variant="h6" color="error">
          Bạn không có quyền truy cập trang này. Vui lòng liên hệ quản trị viên.
        </Typography>
      </Box>
    }>
      <Box sx={{ py: 4, backgroundColor: 'background.default', minHeight: '100vh' }}>
        <Container maxWidth={false} sx={{ maxWidth: '98vw', px: 1 }}>
          <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', md: 'center' }} spacing={3} mb={4}>
            <Stack spacing={1}>
              <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
                Phê duyệt ngành đào tạo
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Giám sát trạng thái phê duyệt và thực hiện các thao tác nhanh cho ngành đào tạo.
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
                  fetchMajors();
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
                  Quy trình phê duyệt ngành đào tạo
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Theo dõi tiến độ xử lý hiện tại dựa trên trạng thái ngành đào tạo đang được chọn.
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
                  color={getMajorStatusColor(focusedStatus)}
                  variant="outlined"
                  size="small"
                />
              </Stack>
            </Stack>

            <Box sx={{ position: 'relative', px: 1, py: 3 }}>
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
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', md: '2fr 1fr 1fr 0.5fr' }, 
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
                onChange={(event) => setSelectedStatus(event.target.value as MajorStatus | 'all')}
              >
                <MenuItem value="all">Tất cả</MenuItem>
                {MAJOR_STATUSES.map((status) => (
                  <MenuItem key={status} value={status}>
                    {getMajorStatusLabel(status)}
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
                onChange={(event) => setSelectedStage(event.target.value as MajorWorkflowStage | 'all')}
              >
                <MenuItem value="all">Tất cả</MenuItem>
                {MAJOR_WORKFLOW_STAGES.map((stage) => (
                  <MenuItem key={stage} value={stage}>
                    {getMajorWorkflowStageLabel(stage)}
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
                  <TableCell>Tên ngành đào tạo</TableCell>
                  <TableCell>Khoa phụ trách</TableCell>
                  <TableCell align="center">Trạng thái</TableCell>
                  <TableCell align="center">Bước xử lý</TableCell>
                  <TableCell align="center">Cập nhật</TableCell>
                  <TableCell align="center">Thao tác</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredMajors.length === 0 && !loading ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                      <Typography color="text.secondary">Không có ngành đào tạo nào phù hợp.</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMajors.map((major) => (
                    <TableRow
                      key={major.id}
                      hover
                      onClick={() => {
                        updateProcessContext({ status: major.status });
                      }}
                      sx={{ cursor: 'default' }}
                    >
                      <TableCell sx={{ fontWeight: 600 }}>{major.code}</TableCell>
                      <TableCell>
                        <Stack spacing={0.5}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                            {major.nameVi}
                          </Typography>
                          {major.nameEn && (
                            <Typography variant="body2" color="text.secondary">
                              {major.nameEn}
                            </Typography>
                          )}
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Avatar sx={{ width: 28, height: 28, bgcolor: 'secondary.main' }}>
                            <SchoolIcon fontSize="small" />
                          </Avatar>
                          <Typography variant="body2" color="text.secondary">
                            {major.orgUnit?.name ?? 'Chưa gán đơn vị'}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={getMajorStatusLabel(major.status)}
                          color={getMajorStatusColor(major.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={getMajorWorkflowStageLabel(major.stage)}
                          color={getMajorStageChipColor(major.stage)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2" color="text.secondary">
                          {formatMajorDateTime(major.updatedAt)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap">
                          {getActionButtons(major)}
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
          {pendingAction ? getMajorActionCopy(pendingAction.action).title : 'Xác nhận thao tác'}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            {pendingAction ? getMajorActionCopy(pendingAction.action).description : 'Bạn có chắc muốn tiếp tục?'}
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
        <DialogTitle>Chi tiết ngành đào tạo</DialogTitle>
        <DialogContent dividers sx={{ minHeight: 260 }}>
          {detailLoading && <LinearProgress sx={{ mb: 2 }} />}

          {detail && (
            <Stack spacing={3}>
              <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2}>
                <Stack spacing={1}>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {detail.name_vi}
                  </Typography>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Chip
                      label={getMajorStatusLabel(detail.status)}
                      color={getMajorStatusColor(detail.status)}
                      size="small"
                    />
                    <Chip
                      label={getMajorWorkflowStageLabel(getMajorStageFromStatus(detail.status))}
                      color={getMajorStageChipColor(getMajorStageFromStatus(detail.status))}
                      size="small"
                    />
                  </Stack>
                </Stack>
                <Stack spacing={0.5} alignItems={{ xs: 'flex-start', md: 'flex-end' }}>
                  <Typography variant="body2" color="text.secondary">
                    Mã ngành: <strong>{detail.code}</strong>
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Cập nhật: <strong>{formatMajorDateTime(detail.updated_at)}</strong>
                  </Typography>
                </Stack>
              </Stack>

              <Stepper activeStep={computeMajorStepIndex(detail.status)} alternativeLabel>
                {MAJOR_WORKFLOW_STAGES.map((stage) => (
                  <Step key={stage}>
                    <StepLabel>{getMajorWorkflowStageLabel(stage)}</StepLabel>
                  </Step>
                ))}
              </Stepper>

              {detail.description && (
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                    Mô tả ngành đào tạo
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
                      const normalizedStatus = entry.status?.toString().toUpperCase() ?? MajorStatus.DRAFT;
                      const statusLabel = getMajorStatusLabel(normalizedStatus);
                      const statusChipColor = getMajorStatusColor(normalizedStatus);

                      const renderIcon = () => {
                        const normalized = normalizedStatus;
                        if (normalized === MajorStatus.REJECTED) return <CancelIcon color="error" fontSize="small" />;
                        if (normalized === MajorStatus.PUBLISHED) return <RocketLaunchIcon color="primary" fontSize="small" />;
                        if (normalized === MajorStatus.APPROVED) return <CheckCircleIcon color="success" fontSize="small" />;
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
                                    {formatMajorDateTime(entry.timestamp)}
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
                    Chưa có lịch sử phê duyệt cho ngành đào tạo này.
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
                      {detail.OrgUnit?.name ?? 'Chưa gán đơn vị'}
                    </Typography>
                  </Stack>
                  <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', md: 'block' } }} />
                  <Stack spacing={1}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Thông tin bổ sung
                    </Typography>
                    <Stack direction="row" spacing={2}>
                      <Chip
                        icon={<DescriptionIcon fontSize="small" />}
                        label={`Cấp độ: ${detail.degree_level || '—'}`}
                        size="small"
                        variant="outlined"
                      />
                      <Chip
                        icon={<DescriptionIcon fontSize="small" />}
                        label={`Thời gian: ${detail.duration_years || '—'} năm`}
                        size="small"
                        variant="outlined"
                      />
                    </Stack>
                  </Stack>
                </Stack>
              </Paper>
            </Stack>
      )}

      {!detailLoading && !detail && (
        <Typography variant="body2" color="text.secondary">
          Không tìm thấy thông tin ngành đào tạo.
        </Typography>
      )}
    </DialogContent>
    <DialogActions>
      {detailActionButtons.length > 0 && (
        <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mr: 'auto' }}>
          {detailActionButtons}
        </Stack>
      )}
      {detail && detail.id && (
        <Button
          variant="outlined"
          onClick={() => {
            console.log('Navigating to major ID:', detail.id);
            router.push(`/tms/majors/${detail.id}`);
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
