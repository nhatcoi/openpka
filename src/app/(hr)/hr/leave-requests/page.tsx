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
import { useRouter } from 'next/navigation';

interface LeaveRequest {
    id: string;
    leave_type: string;
    start_date: string;
    end_date: string;
    status: string;
    reason?: string;
    created_at: string;
    updated_at: string;
    employees: {
        user: {
            id: string;
            full_name: string;
            email: string;
        };
    };
}

const LEAVE_TYPES = [
    { value: 'ANNUAL', label: 'Nghỉ phép năm' },
    { value: 'SICK', label: 'Nghỉ ốm' },
    { value: 'PERSONAL', label: 'Nghỉ cá nhân' },
    { value: 'MATERNITY', label: 'Nghỉ thai sản' },
    // { value: 'PATERNITY', label: 'Nghỉ thai sản (nam)' },
    { value: 'STUDY', label: 'Nghỉ học tập' },
    { value: 'EMERGENCY', label: 'Nghỉ khẩn cấp' }
];

const STATUS_COLORS = {
    PENDING: 'warning',
    APPROVED: 'success',
    REJECTED: 'error',
    CANCELLED: 'default'
} as const;

const STATUS_LABELS = {
    PENDING: 'Chờ duyệt',
    APPROVED: 'Đã duyệt',
    REJECTED: 'Từ chối',
    CANCELLED: 'Đã hủy'
} as const;

export default function LeaveRequestsPage() {
    const { data: session } = useSession();
    const router = useRouter();
    const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
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
        fetchLeaveRequests();
    }, [page, statusFilter, leaveTypeFilter, startDateFilter, endDateFilter]);

    const fetchLeaveRequests = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '10'
            });

            if (statusFilter) params.append('status', statusFilter);
            if (leaveTypeFilter) params.append('leave_type', leaveTypeFilter);
            if (startDateFilter) params.append('start_date', startDateFilter);
            if (endDateFilter) params.append('end_date', endDateFilter);

            const response = await fetch(`/api/hr/leave-requests?${params}`);
            if (!response.ok) {
                throw new Error('Failed to fetch leave requests');
            }

            const data = await response.json();
            setLeaveRequests(data.data);
            setTotalPages(data.pagination.totalPages);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateRequest = async () => {
        try {
            const response = await fetch('/api/hr/leave-requests', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                throw new Error('Failed to create leave request');
            }

            setCreateDialogOpen(false);
            setFormData({ leave_type: '', start_date: '', end_date: '', reason: '' });
            fetchLeaveRequests();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        }
    };

    const handleApproveRequest = async () => {
        if (!selectedRequest) return;

        try {
            const response = await fetch(`/api/hr/leave-requests/${selectedRequest.id}/approve`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(approveData),
            });

            if (!response.ok) {
                throw new Error('Failed to approve/reject request');
            }

            setApproveDialogOpen(false);
            setApproveData({ action: 'APPROVED', comment: '' });
            fetchLeaveRequests();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        }
    };

    const handleDeleteRequest = async (id: string) => {
        if (!confirm('Bạn có chắc chắn muốn xóa đơn xin nghỉ này?')) return;

        try {
            const response = await fetch(`/api/hr/leave-requests/${id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Failed to delete leave request');
            }

            fetchLeaveRequests();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
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

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('vi-VN');
    };

    const getLeaveTypeLabel = (type: string) => {
        return LEAVE_TYPES.find(t => t.value === type)?.label || type;
    };

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
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {/* Filters */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} sm={4}>
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
                        <Grid item xs={12} sm={4}>
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
                        <Grid item xs={12} sm={2}>
                            <TextField
                                fullWidth
                                label="Từ ngày"
                                type="date"
                                value={startDateFilter}
                                onChange={(e) => setStartDateFilter(e.target.value)}
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={2}>
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
                                    <TableCell>{request.Employee.User.full_name}</TableCell>
                                    <TableCell>{getLeaveTypeLabel(request.leave_type)}</TableCell>
                                    <TableCell>{formatDate(request.start_date)}</TableCell>
                                    <TableCell>{formatDate(request.end_date)}</TableCell>
                                    <TableCell>
                                        <Chip
                                            label={STATUS_LABELS[request.status as keyof typeof STATUS_LABELS]}
                                            color={STATUS_COLORS[request.status as keyof typeof STATUS_COLORS]}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell>{formatDate(request.created_at)}</TableCell>
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
                                    label={STATUS_LABELS[selectedRequest.status as keyof typeof STATUS_LABELS]}
                                    color={STATUS_COLORS[selectedRequest.status as keyof typeof STATUS_COLORS]}
                                    size="small"
                                />
                            </Box>
                            <Box>
                                <Typography variant="subtitle2">Ngày tạo:</Typography>
                                <Typography>{formatDate(selectedRequest.created_at)}</Typography>
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
