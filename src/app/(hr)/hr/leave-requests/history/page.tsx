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
        assignments: Array<{
            org_unit: {
                name: string;
            };
            job_positions: {
                title: string;
            };
        }>;
    };
}

const LEAVE_TYPES = [
    { value: 'ANNUAL', label: 'Nghỉ phép năm' },
    { value: 'SICK', label: 'Nghỉ ốm' },
    { value: 'PERSONAL', label: 'Nghỉ cá nhân' },
    { value: 'MATERNITY', label: 'Nghỉ thai sản' },
    { value: 'PATERNITY', label: 'Nghỉ thai sản (nam)' },
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

export default function LeaveRequestHistoryPage() {
    const { data: session } = useSession();
    const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Filters
    const [filters, setFilters] = useState({
        status: '',
        leave_type: '',
        start_date: '',
        end_date: ''
    });

    useEffect(() => {
        fetchLeaveRequestHistory();
    }, [page, filters]);

    const fetchLeaveRequestHistory = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '10'
            });

            Object.entries(filters).forEach(([key, value]) => {
                if (value) params.append(key, value);
            });

            const response = await fetch(`/api/hr/leave-requests?${params}`);
            if (!response.ok) {
                throw new Error('Failed to fetch leave request history');
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

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('vi-VN');
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
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {/* Filters */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} sm={3}>
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
                        <Grid item xs={12} sm={3}>
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
                        <Grid item xs={12} sm={2}>
                            <TextField
                                fullWidth
                                label="Từ ngày"
                                type="date"
                                value={filters.start_date}
                                onChange={(e) => handleFilterChange('start_date', e.target.value)}
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={2}>
                            <TextField
                                fullWidth
                                label="Đến ngày"
                                type="date"
                                value={filters.end_date}
                                onChange={(e) => handleFilterChange('end_date', e.target.value)}
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={2}>
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
                            {leaveRequests.map((request) => {
                                return (
                                    <TableRow key={request.id}>
                                        <TableCell>
                                            <Box>
                                                <Typography variant="body2" fontWeight="medium">
                                                    {request.Employee.User.full_name}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {request.Employee.User.email}
                                                </Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            {request.Employee.OrgAssignment[0]?.OrgUnit.name || 'N/A'}
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
                                                label={STATUS_LABELS[request.status as keyof typeof STATUS_LABELS]}
                                                color={STATUS_COLORS[request.status as keyof typeof STATUS_COLORS]}
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
                                                    <Typography variant="caption" color="text.secondary">
                                                        {formatDate(request.updated_at)}
                                                    </Typography>
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
