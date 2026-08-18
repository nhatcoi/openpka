'use client';

import React, { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
    Grid,
    Alert,
    Pagination,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    TextField,
    Button,
    CircularProgress
} from '@mui/material';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
    useLeaveRequests,
    LeaveRequest,
    LEAVE_TYPES,
    LEAVE_STATUS_LABELS,
    LEAVE_STATUS_COLORS
} from '@/features/hr';

export default function LeaveRequestHistoryPage() {
    const { data: session, status: authStatus } = useSession();
    const router = useRouter();

    const { data: leaveRequests = [], isLoading: loading, error: queryError } = useLeaveRequests();
    const [actionError, setActionError] = useState<string | null>(null);
    const [page, setPage] = useState(1);

    // Filters
    const [filters, setFilters] = useState({
        status: '',
        leave_type: '',
        start_date: '',
        end_date: ''
    });

    useEffect(() => {
        if (authStatus === 'loading') return;
        if (!session) {
            router.push('/auth/signin');
        }
    }, [session, authStatus, router]);

    const error = actionError || (queryError ? (queryError as Error).message : null);

    const handleFilterChange = (key: string, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPage(1); // Reset to first page when filtering
    };

    const clearFilters = () => {
        setFilters({
            status: '',
            leave_type: '',
            start_date: '',
            end_date: ''
        });
        setPage(1);
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

    const getDuration = (startDate: string, endDate: string) => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        return `${diffDays} ngày`;
    };

    const filteredLeaveRequests = leaveRequests.filter((request: LeaveRequest) => {
        if (filters.status && request.status !== filters.status) return false;
        if (filters.leave_type && request.leave_type !== filters.leave_type) return false;
        if (filters.start_date && request.start_date < filters.start_date) return false;
        if (filters.end_date && request.end_date > filters.end_date) return false;
        return true;
    });

    const pageSize = 10;
    const totalPages = Math.ceil(filteredLeaveRequests.length / pageSize) || 1;
    const paginatedRequests = filteredLeaveRequests.slice((page - 1) * pageSize, page * pageSize);

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" component="h1" gutterBottom>
                Lịch sử đơn xin nghỉ
            </Typography>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setActionError(null)}>
                    {error}
                </Alert>
            )}

            {/* Filters */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Grid container spacing={2} alignItems="center">
                        <Grid size={{ xs: 12, sm: 3 }}>
                            <FormControl fullWidth>
                                <InputLabel>Trạng thái</InputLabel>
                                <Select
                                    value={filters.status}
                                    label="Trạng thái"
                                    onChange={(e) => handleFilterChange('status', e.target.value)}
                                >
                                    <MenuItem value="">Tất cả</MenuItem>
                                    <MenuItem value="PENDING">Chờ duyệt</MenuItem>
                                    <MenuItem value="APPROVED">Đã duyệt</MenuItem>
                                    <MenuItem value="REJECTED">Từ chối</MenuItem>
                                    <MenuItem value="CANCELLED">Đã hủy</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 3 }}>
                            <FormControl fullWidth>
                                <InputLabel>Loại nghỉ</InputLabel>
                                <Select
                                    value={filters.leave_type}
                                    label="Loại nghỉ"
                                    onChange={(e) => handleFilterChange('leave_type', e.target.value)}
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
                                value={filters.start_date}
                                onChange={(e) => handleFilterChange('start_date', e.target.value)}
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 2 }}>
                            <TextField
                                fullWidth
                                label="Đến ngày"
                                type="date"
                                value={filters.end_date}
                                onChange={(e) => handleFilterChange('end_date', e.target.value)}
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 2 }}>
                            <Button
                                fullWidth
                                variant="outlined"
                                onClick={clearFilters}
                                sx={{ height: '56px' }}
                            >
                                Xóa bộ lọc
                            </Button>
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
                                <TableCell>Đơn vị</TableCell>
                                <TableCell>Loại nghỉ</TableCell>
                                <TableCell>Thời gian nghỉ</TableCell>
                                <TableCell>Số ngày</TableCell>
                                <TableCell>Trạng thái</TableCell>
                                <TableCell>Ngày tạo</TableCell>
                                <TableCell>Người duyệt cuối</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {paginatedRequests.map((request) => {
                                const employeeName = request.Employee?.User?.full_name || request.employees?.user?.full_name || 'N/A';
                                const employeeEmail = request.Employee?.User?.email || request.employees?.user?.email || '';
                                const orgUnitName = request.Employee?.OrgAssignment?.[0]?.OrgUnit?.name || request.employees?.assignments?.[0]?.org_unit?.name || 'N/A';

                                return (
                                    <TableRow key={request.id}>
                                        <TableCell>
                                            <Box>
                                                <Typography variant="body2" fontWeight="medium">
                                                    {employeeName}
                                                </Typography>
                                                {employeeEmail && (
                                                    <Typography variant="caption" color="text.secondary">
                                                        {employeeEmail}
                                                    </Typography>
                                                )}
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            {orgUnitName}
                                        </TableCell>
                                        <TableCell>{getLeaveTypeLabel(request.leave_type)}</TableCell>
                                        <TableCell>
                                            <Box>
                                                <Typography variant="body2">
                                                    {formatDate(request.start_date)}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    đến {formatDate(request.end_date)}
                                                </Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            {getDuration(request.start_date, request.end_date)}
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={LEAVE_STATUS_LABELS[request.status] || request.status}
                                                color={LEAVE_STATUS_COLORS[request.status] || 'default'}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell>{formatDate(request.created_at)}</TableCell>
                                        <TableCell>
                                            {request.status === 'PENDING' ? (
                                                'Chưa duyệt'
                                            ) : (
                                                <Box>
                                                    <Typography variant="body2">
                                                        {request.status === 'APPROVED' ? 'Đã duyệt' : 'Đã từ chối'}
                                                    </Typography>
                                                    {request.updated_at && (
                                                        <Typography variant="caption" color="text.secondary">
                                                            {formatDate(request.updated_at)}
                                                        </Typography>
                                                    )}
                                                </Box>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>

                {leaveRequests.length === 0 && (
                    <Box display="flex" justifyContent="center" alignItems="center" p={4}>
                        <Typography color="text.secondary">
                            Không có dữ liệu
                        </Typography>
                    </Box>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <Box display="flex" justifyContent="center" p={2}>
                        <Pagination
                            count={totalPages}
                            page={page}
                            onChange={(_, newPage) => setPage(newPage)}
                            color="primary"
                        />
                    </Box>
                )}
            </Card>
        </Box>
    );
}
