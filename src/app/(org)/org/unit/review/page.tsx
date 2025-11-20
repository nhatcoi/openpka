'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
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
  Typography,
  FormControl,
  InputLabel,
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
  Add as AddIcon,
  ArrowBack as ArrowBackIcon,
  Pause as PauseIcon,
  Close as CloseIcon,
  Archive as ArchiveIcon,
} from '@mui/icons-material';
import {
  ORG_UNIT_STATUSES,
  OrgUnitStatus,
  OrgUnitWorkflowStage,
  getOrgUnitStatusColor,
  getOrgUnitStatusLabel,
  getOrgUnitWorkflowStageLabel,
  getOrgUnitStageFromStatus,
  computeOrgUnitStepIndex,
} from '@/constants/org-units';
import { useSession } from 'next-auth/react';
import { API_ROUTES } from '@/constants/routes';
import { useOrgUnits, useParentUnits } from '@/features/org/api/use-org-units';
import { useOrgTypesStatuses } from '@/hooks/use-org-types-statuses';
import { convertTypesToOptions, convertStatusesToOptions } from '@/utils/org-data-converters';

interface ReviewRow {
  id: string;
  code: string;
  name: string;
  status: string;
  owner?: string;
  updatedAt?: string;
}

interface ApprovalHistoryEntry {
  id: string;
  timestamp: string;
  actor: string;
  role: string;
  action: string;
  status: string;
  note?: string;
}

interface CreateOrgUnitFormData {
  code: string;
  name: string;
  type: string;
  parent_id: string;
  description: string;
  planned_establishment_date: string;
}

const ORG_UNIT_PROCESS_STAGES = [
  { stage: OrgUnitWorkflowStage.DRAFT, label: 'Soạn thảo', Icon: DescriptionIcon },
  { stage: OrgUnitWorkflowStage.REVIEWING, label: 'Đang xem xét', Icon: SchoolIcon },
  { stage: OrgUnitWorkflowStage.APPROVED, label: 'Đã phê duyệt', Icon: CheckCircleIcon },
  { stage: OrgUnitWorkflowStage.PUBLISHED, label: 'Đã kích hoạt', Icon: RocketLaunchIcon },
];

const WORKFLOW_ACTIONS = {
  SUBMIT: 'SUBMIT',
  APPROVE: 'APPROVE',
  REJECT: 'REJECT',
  ACTIVATE: 'ACTIVATE',
  RETURN: 'RETURN',
  SUSPEND: 'SUSPEND',
  CANCEL: 'CANCEL',
  ARCHIVE: 'ARCHIVE',
} as const;

export default function OrgUnitReviewPage(): JSX.Element {
  const router = useRouter();
  const { data: session } = useSession();

  const [rows, setRows] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState<any>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState<{ row: ReviewRow; action: string } | null>(null);
  const [confirmComment, setConfirmComment] = useState('');
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });
  const [processIndex, setProcessIndex] = useState(0);
  const [focusedStatus, setFocusedStatus] = useState<OrgUnitStatus>('DRAFT');
  const [focusedStage, setFocusedStage] = useState<OrgUnitWorkflowStage>('DRAFT');
  const [historyEntries, setHistoryEntries] = useState<ApprovalHistoryEntry[]>([]);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createFormData, setCreateFormData] = useState<CreateOrgUnitFormData>({
    code: '',
    name: '',
    type: 'F',
    parent_id: '',
    description: '',
    planned_establishment_date: '',
  });
  const [createErrors, setCreateErrors] = useState<Record<string, string>>({});
  const [createLoading, setCreateLoading] = useState(false);

  const { data: parentUnitsResponse } = useParentUnits();
  const { data: typesStatusesResponse } = useOrgTypesStatuses();

  const parentUnits = useMemo(() => {
    if (!parentUnitsResponse?.data) return [];
    const items = Array.isArray(parentUnitsResponse.data) 
      ? parentUnitsResponse.data 
      : (parentUnitsResponse.data as any)?.items || [];
    return items.map((unit: any) => ({
      id: String(unit.id),
      name: unit.name || '',
      code: unit.code || '',
    }));
  }, [parentUnitsResponse]);

  const typeOptions = useMemo(() => {
    if (!typesStatusesResponse) return [];
    return convertTypesToOptions(typesStatusesResponse);
  }, [typesStatusesResponse]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch(API_ROUTES.ORG.UNITS + '?limit=200');
      const result = await response.json();
      
      let items: any[] = [];
      if (result?.success !== false) {
        if (Array.isArray(result?.data?.items)) {
          items = result.data.items;
        } else if (Array.isArray(result?.data)) {
          items = result.data;
        } else if (Array.isArray(result)) {
          items = result;
        }
      }

      const mappedItems: ReviewRow[] = items.map((item: any) => ({
        id: String(item.id),
        code: item.code ?? '—',
        name: item.name ?? 'Không xác định',
        status: item.status ?? 'DRAFT',
        owner: item.parent?.name ?? '',
        updatedAt: item.updated_at ?? item.updatedAt ?? '',
      }));

      setRows(mappedItems);
    } catch (error) {
      console.error('Failed to fetch org units:', error);
      setSnackbar({ open: true, message: 'Không thể tải danh sách đơn vị', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const matchesStatus = statusFilter === 'all' || row.status === statusFilter;
      const haystack = `${row.code} ${row.name}`.toLowerCase();
      const matchesSearch = searchTerm === '' || haystack.includes(searchTerm.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [rows, statusFilter, searchTerm]);

  const statusCounts = useMemo(() => {
    return rows.reduce<Record<string, number>>((acc, row) => {
      acc[row.status] = (acc[row.status] || 0) + 1;
      return acc;
    }, {});
  }, [rows]);

  const formatDate = (input?: string) => {
    if (!input) return '—';
    const date = new Date(input);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('vi-VN');
  };

  const updateProcessContext = (status?: string) => {
    if (!status) {
      setProcessIndex(0);
      setFocusedStatus('DRAFT');
      setFocusedStage('DRAFT');
      return;
    }

    const stage = getOrgUnitStageFromStatus(status as OrgUnitStatus);
    setProcessIndex(computeOrgUnitStepIndex(status as OrgUnitStatus));
    setFocusedStatus(status as OrgUnitStatus);
    setFocusedStage(stage);
  };

  const mapApprovalActionToStatus = (action: string): OrgUnitStatus => {
    const normalized = action.toUpperCase();
    if (normalized.includes('REQUEST') || normalized.includes('EDIT')) return 'DRAFT';
    if (normalized.includes('APPROVE')) return 'APPROVED';
    if (normalized.includes('REJECT')) return 'REJECTED';
    if (normalized.includes('PUBLISH') || normalized.includes('ACTIVATE')) return 'ACTIVE';
    if (normalized.includes('SUBMIT') || normalized.includes('REVIEW')) return 'REVIEWING';
    if (normalized.includes('SUSPEND')) return 'SUSPENDED';
    if (normalized.includes('CANCEL')) return 'DRAFT';
    if (normalized.includes('ARCHIVE')) return 'ARCHIVED';
    return 'DRAFT';
  };

  const openDetailDialog = async (row: ReviewRow) => {
    setDetailOpen(true);
    setDetailLoading(true);
    try {
      const response = await fetch(`${API_ROUTES.ORG.UNITS_BY_ID(row.id)}`);
      const result = await response.json();

      if (!response.ok || !result?.success || !result?.data) {
        throw new Error(result?.error || 'Không thể tải chi tiết');
      }

      const detailData = result.data?.data || result.data;
      if (!detailData) {
        throw new Error('Không thể tải chi tiết');
      }

      setDetail(detailData);

      // Fetch approval history
      try {
        const hRes = await fetch(`${API_ROUTES.ORG.UNITS_BY_ID(row.id)}/approval-history`);
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
      const response = await fetch(`${API_ROUTES.ORG.UNITS_BY_ID(pendingAction.row.id)}`, {
        method: 'PUT',
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

      if (!response.ok || !result?.success) {
        throw new Error(result?.error || 'Thao tác không thành công');
      }

      setSnackbar({ open: true, message: 'Thao tác thành công', severity: 'success' });

      // Refresh approval history
      if (detail && detail.id) {
        try {
          const hRes = await fetch(`${API_ROUTES.ORG.UNITS_BY_ID(String(detail.id))}/approval-history`);
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
          }
        } catch (err) {
          console.error('Failed to refresh approval history:', err);
        }
      }

      closeActionConfirm();
      fetchData();
      if (detail && detail.id === pendingAction.row.id) {
        // Refresh detail if viewing the same item
        openDetailDialog(pendingAction.row);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Thao tác không thành công';
      setSnackbar({ open: true, message, severity: 'error' });
    } finally {
      setConfirmLoading(false);
    }
  };

  const getActionButtons = (row: ReviewRow): JSX.Element[] => {
    const buttons: JSX.Element[] = [];
    const permissions = session?.user?.permissions || [];
    const hasPermission = (perm: string) => permissions.includes(perm);

    const status = row.status as OrgUnitStatus;

    // DRAFT -> Có thể chỉnh sửa và gửi xem xét
    if (status === 'DRAFT' && hasPermission('org_unit.unit.update')) {
      buttons.push(
        <Button
          key="edit"
          size="small"
          variant="outlined"
          color="primary"
          startIcon={<EditIcon />}
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/org/unit/${row.id}`);
          }}
        >
          Chỉnh sửa
        </Button>,
        <Button
          key="submit"
          size="small"
          variant="contained"
          color="primary"
          startIcon={<SchoolIcon />}
          onClick={(e) => {
            e.stopPropagation();
            openActionConfirm(row, WORKFLOW_ACTIONS.SUBMIT);
          }}
        >
          Gửi xem xét
        </Button>
      );
    }

    // REVIEWING -> Có thể phê duyệt hoặc từ chối
    if (status === 'REVIEWING' && (hasPermission('org_unit.unit.approve') || hasPermission('org_unit.unit.update'))) {
      buttons.push(
        <Button
          key="approve"
          size="small"
          variant="contained"
          color="success"
          startIcon={<CheckCircleIcon />}
          onClick={(e) => {
            e.stopPropagation();
            openActionConfirm(row, WORKFLOW_ACTIONS.APPROVE);
          }}
        >
          Phê duyệt
        </Button>,
        <Button
          key="reject"
          size="small"
          variant="contained"
          color="error"
          startIcon={<CancelIcon />}
          onClick={(e) => {
            e.stopPropagation();
            openActionConfirm(row, WORKFLOW_ACTIONS.REJECT);
          }}
        >
          Từ chối
        </Button>
      );
    }

    // REVIEWING -> Người tạo có thể hủy
    if (status === 'REVIEWING' && hasPermission('org_unit.unit.update')) {
      buttons.push(
        <Button
          key="cancel"
          size="small"
          variant="outlined"
          color="warning"
          startIcon={<CloseIcon />}
          onClick={(e) => {
            e.stopPropagation();
            openActionConfirm(row, WORKFLOW_ACTIONS.CANCEL);
          }}
        >
          Hủy yêu cầu
        </Button>
      );
    }

    // APPROVED -> Có thể kích hoạt
    if (status === 'APPROVED' && (hasPermission('org_unit.unit.activate') || hasPermission('org_unit.unit.update'))) {
      buttons.push(
        <Button
          key="activate"
          size="small"
          variant="contained"
          color="success"
          startIcon={<RocketLaunchIcon />}
          onClick={(e) => {
            e.stopPropagation();
            openActionConfirm(row, WORKFLOW_ACTIONS.ACTIVATE);
          }}
        >
          Kích hoạt
        </Button>
      );
    }

    if ((status === 'APPROVED' || status === 'REVIEWING') && hasPermission('org_unit.unit.update')) {
      buttons.push(
        <Button
          key="return"
          size="small"
          variant="outlined"
          color="warning"
          startIcon={<ArrowBackIcon />}
          onClick={(e) => {
            e.stopPropagation();
            openActionConfirm(row, WORKFLOW_ACTIONS.RETURN);
          }}
        >
          Trả về
        </Button>
      );
    }

    // APPROVED -> Người tạo có thể hủy
    if (status === 'APPROVED' && hasPermission('org_unit.unit.update')) {
      buttons.push(
        <Button
          key="cancel"
          size="small"
          variant="outlined"
          color="warning"
          startIcon={<CloseIcon />}
          onClick={(e) => {
            e.stopPropagation();
            openActionConfirm(row, WORKFLOW_ACTIONS.CANCEL);
          }}
        >
          Hủy yêu cầu
        </Button>
      );
    }

    // REJECTED -> Có thể chỉnh sửa và gửi xem xét lại
    if (status === 'REJECTED' && hasPermission('org_unit.unit.update')) {
      buttons.push(
        <Button
          key="edit"
          size="small"
          variant="outlined"
          color="primary"
          startIcon={<EditIcon />}
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/org/unit/${row.id}`);
          }}
        >
          Chỉnh sửa
        </Button>,
        <Button
          key="resubmit"
          size="small"
          variant="contained"
          color="primary"
          startIcon={<SchoolIcon />}
          onClick={(e) => {
            e.stopPropagation();
            openActionConfirm(row, WORKFLOW_ACTIONS.SUBMIT);
          }}
        >
          Gửi xem xét lại
        </Button>
      );
    }

    // ACTIVE -> Có thể tạm dừng và lưu trữ
    if (status === 'ACTIVE' && hasPermission('org_unit.unit.update')) {
      buttons.push(
        <Button
          key="suspend"
          size="small"
          variant="outlined"
          color="warning"
          startIcon={<PauseIcon />}
          onClick={(e) => {
            e.stopPropagation();
            openActionConfirm(row, WORKFLOW_ACTIONS.SUSPEND);
          }}
        >
          Tạm dừng
        </Button>,
        <Button
          key="archive"
          size="small"
          variant="outlined"
          color="default"
          startIcon={<ArchiveIcon />}
          onClick={(e) => {
            e.stopPropagation();
            openActionConfirm(row, WORKFLOW_ACTIONS.ARCHIVE);
          }}
        >
          Lưu trữ
        </Button>
      );
    }

    // SUSPENDED -> Có thể kích hoạt lại
    if (status === 'SUSPENDED' && (hasPermission('org_unit.unit.activate') || hasPermission('org_unit.unit.update'))) {
      buttons.push(
        <Button
          key="reactivate"
          size="small"
          variant="contained"
          color="success"
          startIcon={<RocketLaunchIcon />}
          onClick={(e) => {
            e.stopPropagation();
            openActionConfirm(row, WORKFLOW_ACTIONS.ACTIVATE);
          }}
        >
          Kích hoạt lại
        </Button>
      );
    }

    // INACTIVE -> Có thể kích hoạt và lưu trữ
    if (status === 'INACTIVE' && hasPermission('org_unit.unit.update')) {
      buttons.push(
        <Button
          key="activate"
          size="small"
          variant="contained"
          color="success"
          startIcon={<RocketLaunchIcon />}
          onClick={(e) => {
            e.stopPropagation();
            openActionConfirm(row, WORKFLOW_ACTIONS.ACTIVATE);
          }}
        >
          Kích hoạt
        </Button>,
        <Button
          key="archive"
          size="small"
          variant="outlined"
          color="default"
          startIcon={<ArchiveIcon />}
          onClick={(e) => {
            e.stopPropagation();
            openActionConfirm(row, WORKFLOW_ACTIONS.ARCHIVE);
          }}
        >
          Lưu trữ
        </Button>
      );
    }

    // ARCHIVED -> Không có action (chỉ xem lịch sử)
    // Không thêm action nào cho ARCHIVED

    return buttons;
  };

  const handleCreateSubmit = async () => {
    const newErrors: Record<string, string> = {};
    if (!createFormData.code.trim()) newErrors.code = 'Mã đơn vị không được để trống';
    if (!createFormData.name.trim()) newErrors.name = 'Tên đơn vị không được để trống';
    if (!createFormData.type) newErrors.type = 'Loại đơn vị không được để trống';

    setCreateErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setCreateLoading(true);
    try {
      const response = await fetch(API_ROUTES.ORG.INITIAL_UNITS, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: createFormData.code,
          name: createFormData.name,
          type: createFormData.type || null,
          parent_id: createFormData.parent_id || null,
          description: createFormData.description || null,
          planned_establishment_date: createFormData.planned_establishment_date || null,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result?.orgUnit) {
        throw new Error(result?.error || 'Không thể tạo đơn vị');
      }

      setSnackbar({ open: true, message: 'Tạo đơn vị thành công', severity: 'success' });
      setCreateDialogOpen(false);
      setCreateFormData({
        code: '',
        name: '',
        type: 'F',
        parent_id: '',
        description: '',
        planned_establishment_date: '',
      });
      setCreateErrors({});
      fetchData();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể tạo đơn vị';
      setSnackbar({ open: true, message, severity: 'error' });
    } finally {
      setCreateLoading(false);
    }
  };

  const processStages = ORG_UNIT_PROCESS_STAGES;

  return (
    <Box sx={{ py: 4, px: 3, width: '100%' }}>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Trung tâm phê duyệt
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Quản lý và phê duyệt các đơn vị tổ chức
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialogOpen(true)}
        >
          Tạo đơn vị mới
        </Button>
      </Stack>

      {/* Filters */}
      <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <TextField
            fullWidth
            placeholder="Tìm kiếm theo mã, tên đơn vị..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Trạng thái</InputLabel>
            <Select
              value={statusFilter}
              label="Trạng thái"
              onChange={(e: SelectChangeEvent) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="all">Tất cả ({rows.length})</MenuItem>
              {ORG_UNIT_STATUSES.map((status) => (
                <MenuItem key={status} value={status}>
                  {getOrgUnitStatusLabel(status)} ({statusCounts[status] || 0})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchData}
          >
            Làm mới
          </Button>
        </Stack>
      </Paper>

      {/* Table */}
      <TableContainer component={Paper} elevation={2}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>Mã</strong></TableCell>
              <TableCell><strong>Tên đơn vị</strong></TableCell>
              <TableCell><strong>Trạng thái</strong></TableCell>
              <TableCell><strong>Đơn vị chủ quản</strong></TableCell>
              <TableCell><strong>Cập nhật</strong></TableCell>
              <TableCell><strong>Thao tác</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : filteredRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    Không có dữ liệu
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredRows.map((row) => (
                <TableRow
                  key={row.id}
                  hover
                  sx={{ cursor: 'pointer' }}
                  onClick={() => openDetailDialog(row)}
                >
                  <TableCell>{row.code}</TableCell>
                  <TableCell>{row.name}</TableCell>
                  <TableCell>
                    <Chip
                      label={getOrgUnitStatusLabel(row.status as OrgUnitStatus)}
                      color={getOrgUnitStatusColor(row.status as OrgUnitStatus)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{row.owner || '—'}</TableCell>
                  <TableCell>{formatDate(row.updatedAt)}</TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1} onClick={(e) => e.stopPropagation()}>
                      <IconButton
                        size="small"
                        onClick={() => openDetailDialog(row)}
                      >
                        <VisibilityIcon />
                      </IconButton>
                      {getActionButtons(row)}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Detail Dialog */}
      <Dialog
        open={detailOpen}
        onClose={closeDetailDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { maxHeight: '90vh' },
        }}
      >
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Chi tiết đơn vị</Typography>
            <IconButton onClick={closeDetailDialog} size="small">
              <CancelIcon />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          {detailLoading ? (
            <Box sx={{ py: 4, textAlign: 'center' }}>
              <CircularProgress />
            </Box>
          ) : detail ? (
            <Stack spacing={3}>
              {/* Progress Bar */}
              <Box>
                <Typography variant="subtitle2" gutterBottom sx={{ mb: 2 }}>
                  Tiến trình phê duyệt
                </Typography>
                <Stepper activeStep={processIndex} alternativeLabel>
                  {processStages.map(({ stage, label, Icon }, idx) => (
                    <Step key={stage} completed={idx < processIndex} active={idx === processIndex}>
                      <StepLabel
                        StepIconComponent={() => (
                          <Avatar
                            sx={{
                              bgcolor: idx <= processIndex ? 'primary.main' : 'grey.300',
                              width: 40,
                              height: 40,
                            }}
                          >
                            <Icon />
                          </Avatar>
                        )}
                      >
                        {label}
                      </StepLabel>
                    </Step>
                  ))}
                </Stepper>
              </Box>

              <Divider />

              {/* Basic Info */}
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Thông tin cơ bản
                </Typography>
                <Stack spacing={1}>
                  <Typography variant="body2">
                    <strong>Mã:</strong> {detail.code || '—'}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Tên:</strong> {detail.name || '—'}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Loại:</strong> {detail.type || '—'}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Trạng thái:</strong>{' '}
                    <Chip
                      label={getOrgUnitStatusLabel(detail.status)}
                      color={getOrgUnitStatusColor(detail.status)}
                      size="small"
                    />
                  </Typography>
                  <Typography variant="body2">
                    <strong>Mô tả:</strong> {detail.description || '—'}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Đơn vị chủ quản:</strong> {detail.parent?.name || '—'}
                  </Typography>
                </Stack>
              </Box>

              <Divider />

              {/* Approval History */}
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Lịch sử phê duyệt
                </Typography>
                {historyEntries.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    Chưa có lịch sử phê duyệt.
                  </Typography>
                ) : (
                  <List>
                    {historyEntries.map((entry) => (
                      <ListItem key={entry.id}>
                        <ListItemIcon>
                          <Avatar sx={{ width: 32, height: 32 }}>
                            {entry.actor.charAt(0).toUpperCase()}
                          </Avatar>
                        </ListItemIcon>
                        <ListItemText
                          primary={entry.actor}
                          secondary={
                            <Stack spacing={0.5}>
                              <Typography variant="caption" color="text.secondary">
                                {formatDate(entry.timestamp)} - {entry.action}
                              </Typography>
                              {entry.note && (
                                <Typography variant="caption">{entry.note}</Typography>
                              )}
                            </Stack>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                )}
              </Box>

              {/* Action Buttons */}
              <Box>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  {getActionButtons({ id: String(detail.id), code: detail.code || '', name: detail.name || '', status: detail.status || 'DRAFT' })}
                </Stack>
              </Box>
            </Stack>
          ) : (
            <Typography>Không có dữ liệu</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDetailDialog}>Đóng</Button>
        </DialogActions>
      </Dialog>

      {/* Action Confirm Dialog */}
      <Dialog open={confirmOpen} onClose={closeActionConfirm} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Xác nhận thao tác</Typography>
            <IconButton onClick={closeActionConfirm} size="small" disabled={confirmLoading}>
              <CloseIcon />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <Box>
              <Typography variant="body1" gutterBottom>
                Bạn có chắc chắn muốn thực hiện thao tác này?
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Đơn vị: <strong>{pendingAction?.row.name}</strong> ({pendingAction?.row.code})
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Thao tác: <strong>{pendingAction?.action === 'SUBMIT' ? 'Gửi xem xét' : 
                  pendingAction?.action === 'APPROVE' ? 'Phê duyệt' :
                  pendingAction?.action === 'REJECT' ? 'Từ chối' :
                  pendingAction?.action === 'ACTIVATE' ? 'Kích hoạt' :
                  pendingAction?.action === 'RETURN' ? 'Trả về' :
                  pendingAction?.action === 'SUSPEND' ? 'Tạm dừng' :
                  pendingAction?.action === 'CANCEL' ? 'Hủy yêu cầu' :
                  pendingAction?.action === 'ARCHIVE' ? 'Lưu trữ' :
                  pendingAction?.action || '—'}</strong>
              </Typography>
            </Box>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Ghi chú (tùy chọn)"
              placeholder="Nhập ghi chú hoặc lý do thực hiện thao tác này..."
              value={confirmComment}
              onChange={(e) => setConfirmComment(e.target.value)}
              helperText="Ghi chú này sẽ được lưu trong lịch sử phê duyệt"
              disabled={confirmLoading}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeActionConfirm} disabled={confirmLoading}>
            Hủy
          </Button>
          <Button
            variant="contained"
            onClick={performWorkflowAction}
            disabled={confirmLoading}
          >
            {confirmLoading ? 'Đang xử lý...' : 'Xác nhận'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Tạo đơn vị mới</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Mã đơn vị *"
              value={createFormData.code}
              onChange={(e) => {
                setCreateFormData({ ...createFormData, code: e.target.value });
                if (createErrors.code) setCreateErrors({ ...createErrors, code: '' });
              }}
              error={!!createErrors.code}
              helperText={createErrors.code}
            />
            <TextField
              fullWidth
              label="Tên đơn vị *"
              value={createFormData.name}
              onChange={(e) => {
                setCreateFormData({ ...createFormData, name: e.target.value });
                if (createErrors.name) setCreateErrors({ ...createErrors, name: '' });
              }}
              error={!!createErrors.name}
              helperText={createErrors.name}
            />
            <FormControl fullWidth error={!!createErrors.type}>
              <InputLabel>Loại đơn vị *</InputLabel>
              <Select
                value={createFormData.type}
                label="Loại đơn vị *"
                onChange={(e) => {
                  setCreateFormData({ ...createFormData, type: e.target.value });
                  if (createErrors.type) setCreateErrors({ ...createErrors, type: '' });
                }}
              >
                {typeOptions.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </Select>
              {createErrors.type && (
                <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>
                  {createErrors.type}
                </Typography>
              )}
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Đơn vị chủ quản</InputLabel>
              <Select
                value={createFormData.parent_id}
                label="Đơn vị chủ quản"
                onChange={(e) => setCreateFormData({ ...createFormData, parent_id: e.target.value })}
              >
                <MenuItem value="">Không có</MenuItem>
                {parentUnits.map((unit) => (
                  <MenuItem key={unit.id} value={unit.id}>
                    {unit.code} - {unit.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Mô tả"
              value={createFormData.description}
              onChange={(e) => setCreateFormData({ ...createFormData, description: e.target.value })}
            />
            <TextField
              fullWidth
              type="date"
              label="Ngày dự kiến thành lập"
              value={createFormData.planned_establishment_date}
              onChange={(e) => setCreateFormData({ ...createFormData, planned_establishment_date: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)} disabled={createLoading}>
            Hủy
          </Button>
          <Button variant="contained" onClick={handleCreateSubmit} disabled={createLoading}>
            {createLoading ? 'Đang tạo...' : 'Tạo'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

