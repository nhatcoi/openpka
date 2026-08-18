'use client';

import React, { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    MenuItem,
    Grid,
    Alert,
    Pagination,
    FormControl,
    InputLabel,
    Select,
    Fab
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Visibility as ViewIcon,
    CheckCircle as ApproveIcon,
    Cancel as RejectIcon
} from '@mui/icons-material';
import { useSession } from 'next-auth/react';
import { useConfirmDialog } from '@/components/dialogs/confirm-dialog-provider';
import { useRouter } from 'next/navigation';
import {
    useLeaveRequests,
    useCreateLeaveRequest,
    useApproveLeaveRequest,
    useDeleteLeaveRequest,
    LeaveRequest,
    LEAVE_TYPES,
    LEAVE_STATUS_LABELS,
    LEAVE_STATUS_COLORS
} from '@/features/hr';

export default function LeaveRequestsPage() {
    const { data: session, status: authStatus } = useSession();
    const confirmDialog = useConfirmDialog();
    const router = useRouter();

    const { data: leaveRequests = [], isLoading: loading, error: queryError } = useLeaveRequests();
    const { mutateAsync: createLeaveRequest } = useCreateLeaveRequest();
    const { mutateAsync: approveLeaveRequest } = useApproveLeaveRequest();
    const { mutateAsync: deleteLeaveRequest } = useDeleteLeaveRequest();

    const [actionError, setActionError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState('');
    const [leaveTypeFilter, setLeaveTypeFilter] = useState('');
    const [startDateFilter, setStartDateFilter] = useState('');
    const [endDateFilter, setEndDateFilter] = useState('');

    // Dialog states
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [viewDialogOpen, setViewDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [approveDialogOpen, setApproveDialogOpen] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);

    // Form states
    const [formData, setFormData] = useState({
        leave_type: '',
        start_date: '',
        end_date: '',
        reason: ''
    });
    const [approveData, setApproveData] = useState({
        action: 'APPROVED',
        comment: ''
    });

    useEffect(() => {
        if (authStatus === 'loading') return;
        if (!session) {
            router.push('/auth/signin');
        }
    }, [session, authStatus, router]);

    const error = actionError || (queryError ? (queryError as Error).message : null);

    const handleCreateRequest = async () => {
        try {
            setActionError(null);
            await createLeaveRequest(formData as any);
            setCreateDialogOpen(false);
            setFormData({ leave_type: '', start_date: '', end_date: '', reason: '' });
        } catch (err: any) {
            setActionError(err.message || 'Lỗi khi tạo đơn xin nghỉ');
        }
    };

    const handleApproveRequest = async () => {
        if (!selectedRequest) return;

        try {
            setActionError(null);
            await approveLeaveRequest({
                id: selectedRequest.id,
                action: approveData.action,
                comment: approveData.comment
            });
            setApproveDialogOpen(false);
            setApproveData({ action: 'APPROVED', comment: '' });
        } catch (err: any) {
            setActionError(err.message || 'Lỗi khi duyệt đơn xin nghỉ');
        }
    };

    const handleDeleteRequest = async (id: string) => {
        const confirmed = await confirmDialog({
            title: 'Xóa đơn xin nghỉ',
            message: 'Bạn có chắc chắn muốn xóa đơn xin nghỉ này?',
            confirmText: 'Xóa',
            cancelText: 'Hủy',
            destructive: true,
        });
        if (!confirmed) return;

        try {
            setActionError(null);
            await deleteLeaveRequest(id);
        } catch (err: any) {
            setActionError(err.message || 'Lỗi khi xóa đơn xin nghỉ');
        }
    };

    const openViewDialog = (request: LeaveRequest) => {
        setSelectedRequest(request);
        setViewDialogOpen(true);
    };

    const openEditDialog = (request: LeaveRequest) => {
        setSelectedRequest(request);
        setFormData({
            leave_type: request.leave_type,
            start_date: request.start_date.split('T')[0],
            end_date: request.end_date.split('T')[0],
            reason: request.reason || ''
        });
        setEditDialogOpen(true);
    };

    const openApproveDialog = (request: LeaveRequest) => {
        setSelectedRequest(request);
        setApproveDialogOpen(true);
    };

    const formatDate = (dateString?: string | null) => {
        if (!dateString) return '-';
        try {
            return new Date(dateString).toLocaleDateString('vi-VN');
        } catch {
            return String(dateString);
        }
    };

    const getLeaveTypeLabel = (type: string) => {
        return LEAVE_TYPES.find(t => t.value === type)?.label || type;
    };

    const filteredLeaveRequests = leaveRequests.filter((request: LeaveRequest) => {
        if (statusFilter && request.status !== statusFilter) return false;
        if (leaveTypeFilter && request.leave_type !== leaveTypeFilter) return false;
        if (startDateFilter && request.start_date < startDateFilter) return false;
        if (endDateFilter && request.end_date > endDateFilter) return false;
        return true;
    });

    const pageSize = 10;
    const totalPages = Math.ceil(filteredLeaveRequests.length / pageSize) || 1;
    const paginatedRequests = filteredLeaveRequests.slice((page - 1) * pageSize, page * pageSize);

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <Typography>Đang tải...</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h4" component="h1">
                    Đơn xin nghỉ
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setCreateDialogOpen(true)}
                >
                    Tạo đơn xin nghỉ
                </Button>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setActionError(null)}>
                    {error}
                </Alert>
            )}

            {/* Filters */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Grid container spacing={2} alignItems="center">
                        <Grid size={{ xs: 12, sm: 4 }}>
                            <FormControl fullWidth>
                                <InputLabel>Trạng thái</InputLabel>
                                <Select
                                    value={statusFilter}
                                    label="Trạng thái"
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                >
                                    <MenuItem value="">Tất cả</MenuItem>
                                    <MenuItem value="PENDING">Chờ duyệt</MenuItem>
                                    <MenuItem value="APPROVED">Đã duyệt</MenuItem>
                                    <MenuItem value="REJECTED">Từ chối</MenuItem>
                                    <MenuItem value="CANCELLED">Đã hủy</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                            <FormControl fullWidth>
                                <InputLabel>Loại nghỉ</InputLabel>
                                <Select
                                    value={leaveTypeFilter}
                                    label="Loại nghỉ"
                                    onChange={(e) => setLeaveTypeFilter(e.target.value)}
                                >
                                    <MenuItem value="">Tất cả</MenuItem>
                                    {LEAVE_TYPES.map((type) => (
                                        <MenuItem key={type.value} value={type.value}>
                                            {type.label}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 2 }}>
                            <TextField
                                fullWidth
                                label="Từ ngày"
                                type="date"
                                value={startDateFilter}
                                onChange={(e) => setStartDateFilter(e.target.value)}
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 2 }}>
                            <TextField
                                fullWidth
                                label="Đến ngày"
                                type="date"
                                value={endDateFilter}
                                onChange={(e) => setEndDateFilter(e.target.value)}
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>

            {/* Table */}
            <Card>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Nhân viên</TableCell>
                                <TableCell>Loại nghỉ</TableCell>
                                <TableCell>Ngày bắt đầu</TableCell>
                                <TableCell>Ngày kết thúc</TableCell>
                                <TableCell>Trạng thái</TableCell>
                                <TableCell>Ngày tạo</TableCell>
                                <TableCell>Thao tác</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {leaveRequests.map((request) => (
                                <TableRow key={request.id}>
                                    <TableCell>{request.Employee?.User?.full_name || request.employees?.user?.full_name || 'N/A'}</TableCell>
                                    <TableCell>{getLeaveTypeLabel(request.leave_type)}</TableCell>
                                    <TableCell>{formatDate(request.start_date)}</TableCell>
                                    <TableCell>{formatDate(request.end_date)}</TableCell>
                                    <TableCell>
                                        <Chip
                                            label={LEAVE_STATUS_LABELS[request.status] || request.status}
                                            color={LEAVE_STATUS_COLORS[request.status] || 'default'}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell>{request.created_at ? formatDate(request.created_at) : '-'}</TableCell>
                                    <TableCell>
                                        <IconButton
                                            size="small"
                                            onClick={() => openViewDialog(request)}
                                            title="Xem chi tiết"
                                        >
                                            <ViewIcon />
                                        </IconButton>
                                        {request.status === 'PENDING' && (
                                            <>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => openEditDialog(request)}
                                                    title="Chỉnh sửa"
                                                >
                                                    <EditIcon />
                                                </IconButton>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => openApproveDialog(request)}
                                                    title="Duyệt"
                                                >
                                                    <ApproveIcon />
                                                </IconButton>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleDeleteRequest(request.id)}
                                                    title="Xóa"
                                                >
                                                    <DeleteIcon />
                                                </IconButton>
                                            </>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* Pagination */}
                <Box display="flex" justifyContent="center" p={2}>
                    <Pagination
                        count={totalPages}
                        page={page}
                        onChange={(_, newPage) => setPage(newPage)}
                        color="primary"
                    />
                </Box>
            </Card>

            {/* Create Dialog */}
            <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Tạo đơn xin nghỉ mới</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                        <FormControl fullWidth>
                            <InputLabel>Loại nghỉ</InputLabel>
                            <Select
                                value={formData.leave_type}
                                label="Loại nghỉ"
                                onChange={(e) => setFormData({ ...formData, leave_type: e.target.value })}
                            >
                                {LEAVE_TYPES.map((type) => (
                                    <MenuItem key={type.value} value={type.value}>
                                        {type.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <TextField
                            fullWidth
                            label="Ngày bắt đầu"
                            type="date"
                            value={formData.start_date}
                            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                            InputLabelProps={{ shrink: true }}
                        />

                        <TextField
                            fullWidth
                            label="Ngày kết thúc"
                            type="date"
                            value={formData.end_date}
                            onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                            InputLabelProps={{ shrink: true }}
                        />

                        <TextField
                            fullWidth
                            label="Lý do"
                            multiline
                            rows={3}
                            value={formData.reason}
                            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setCreateDialogOpen(false)}>Hủy</Button>
                    <Button onClick={handleCreateRequest} variant="contained">
                        Tạo đơn
                    </Button>
                </DialogActions>
            </Dialog>

            {/* View Dialog */}
            <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>Chi tiết đơn xin nghỉ</DialogTitle>
                <DialogContent>
                    {selectedRequest && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                            <Box>
                                <Typography variant="subtitle2">Nhân viên:</Typography>
                                <Typography>{selectedRequest.Employee.User.full_name}</Typography>
                            </Box>
                            <Box>
                                <Typography variant="subtitle2">Loại nghỉ:</Typography>
                                <Typography>{getLeaveTypeLabel(selectedRequest.leave_type)}</Typography>
                            </Box>
                            <Box>
                                <Typography variant="subtitle2">Ngày bắt đầu:</Typography>
                                <Typography>{formatDate(selectedRequest.start_date)}</Typography>
                            </Box>
                            <Box>
                                <Typography variant="subtitle2">Ngày kết thúc:</Typography>
                                <Typography>{formatDate(selectedRequest.end_date)}</Typography>
                            </Box>
                            <Box>
                                <Typography variant="subtitle2">Trạng thái:</Typography>
                                <Chip
                                    label={LEAVE_STATUS_LABELS[selectedRequest.status] || selectedRequest.status}
                                    color={LEAVE_STATUS_COLORS[selectedRequest.status] || 'default'}
                                    size="small"
                                />
                            </Box>
                            <Box>
                                <Typography variant="subtitle2">Ngày tạo:</Typography>
                                <Typography>{selectedRequest.created_at ? formatDate(selectedRequest.created_at) : '-'}</Typography>
                            </Box>
                            {selectedRequest.reason && (
                                <Box>
                                    <Typography variant="subtitle2">Lý do:</Typography>
                                    <Typography>{selectedRequest.reason}</Typography>
                                </Box>
                            )}
                            <Box>
                                <Typography variant="subtitle2">Lịch sử:</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Lịch sử chi tiết có thể xem trong trang "Lịch sử sửa đổi"
                                </Typography>
                            </Box>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setViewDialogOpen(false)}>Đóng</Button>
                </DialogActions>
            </Dialog>

            {/* Approve Dialog */}
            <Dialog open={approveDialogOpen} onClose={() => setApproveDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Duyệt đơn xin nghỉ</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                        <FormControl fullWidth>
                            <InputLabel>Hành động</InputLabel>
                            <Select
                                value={approveData.action}
                                label="Hành động"
                                onChange={(e) => setApproveData({ ...approveData, action: e.target.value })}
                            >
                                <MenuItem value="APPROVED">Duyệt</MenuItem>
                                <MenuItem value="REJECTED">Từ chối</MenuItem>
                            </Select>
                        </FormControl>

                        <TextField
                            fullWidth
                            label="Nhận xét"
                            multiline
                            rows={3}
                            value={approveData.comment}
                            onChange={(e) => setApproveData({ ...approveData, comment: e.target.value })}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setApproveDialogOpen(false)}>Hủy</Button>
                    <Button onClick={handleApproveRequest} variant="contained">
                        Xác nhận
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
