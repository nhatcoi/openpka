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
    Accordion,
    AccordionSummary,
    AccordionDetails,
    CircularProgress
} from '@mui/material';
import {
    ExpandMore as ExpandMoreIcon,
    Person as PersonIcon,
    Work as WorkIcon,
    School as SchoolIcon,
    Assignment as AssignmentIcon
} from '@mui/icons-material';
import { useSession } from 'next-auth/react';

interface EmployeeLog {
    id: string;
    action: string;
    entity_type: string;
    entity_id?: string;
    field_name?: string;
    old_value?: string;
    new_value?: string;
    reason?: string;
    actor_role?: string;
    created_at: string;
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
    users?: {
        id: string;
        full_name: string;
    };
}

const ACTION_COLORS = {
    CREATE: 'success',
    UPDATE: 'info',
    DELETE: 'error',
    ASSIGN: 'warning',
    REMOVE: 'default'
} as const;

const ACTION_LABELS = {
    CREATE: 'Tạo mới',
    UPDATE: 'Cập nhật',
    DELETE: 'Xóa',
    ASSIGN: 'Gán',
    REMOVE: 'Gỡ bỏ'
} as const;

const ENTITY_TYPE_LABELS = {
    employee: 'Nhân viên',
    org_assignment: 'Phân công tổ chức',
    employee_qualification: 'Bằng cấp',
    employee_training: 'Đào tạo',
    employee_academic_title: 'Học hàm',
    performance_review: 'Đánh giá hiệu suất',
    leave_request: 'Đơn xin nghỉ'
} as const;

const ENTITY_TYPE_ICONS = {
    employee: <PersonIcon />,
    org_assignment: <WorkIcon />,
    employee_qualification: <SchoolIcon />,
    employee_training: <SchoolIcon />,
    employee_academic_title: <SchoolIcon />,
    performance_review: <AssignmentIcon />,
    leave_request: <AssignmentIcon />
} as const;

export default function EmployeeChangesHistoryPage() {
    const { data: session } = useSession();
    const [employeeLogs, setEmployeeLogs] = useState<EmployeeLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Filters
    const [filters, setFilters] = useState({
        action: '',
        entity_type: '',
        start_date: '',
        end_date: ''
    });

    useEffect(() => {
        fetchEmployeeChangesHistory();
    }, [page, filters]);

    const fetchEmployeeChangesHistory = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '10'
            });

            Object.entries(filters).forEach(([key, value]) => {
                if (value) params.append(key, value);
            });

            const response = await fetch(`/api/hr/employee-changes/history?${params}`);
            if (!response.ok) {
                throw new Error('Failed to fetch employee changes history');
            }

            const data = await response.json();
            setEmployeeLogs(data.data);
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
            action: '',
            entity_type: '',
            start_date: '',
            end_date: ''
        });
        setPage(1);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getActionLabel = (action: string) => {
        return ACTION_LABELS[action as keyof typeof ACTION_LABELS] || action;
    };

    const getEntityTypeLabel = (entityType: string) => {
        return ENTITY_TYPE_LABELS[entityType as keyof typeof ENTITY_TYPE_LABELS] || entityType;
    };

    const getEntityTypeIcon = (entityType: string) => {
        return ENTITY_TYPE_ICONS[entityType as keyof typeof ENTITY_TYPE_ICONS] || <AssignmentIcon />;
    };

    const formatFieldValue = (value: string | null) => {
        if (!value) return 'N/A';
        try {
            // Try to parse as JSON for complex values
            const parsed = JSON.parse(value);
            return typeof parsed === 'object' ? JSON.stringify(parsed, null, 2) : parsed;
        } catch {
            return value;
        }
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
                Lịch sử sửa đổi thông tin nhân viên
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
                                <InputLabel>Hành động</InputLabel>
                                <Select
                                    value={filters.action}
                                    label="Hành động"
                                    onChange={(e) => handleFilterChange('action', e.target.value)}
                                >
                                    <MenuItem value="">Tất cả</MenuItem>
                                    <MenuItem value="CREATE">Tạo mới</MenuItem>
                                    <MenuItem value="UPDATE">Cập nhật</MenuItem>
                                    <MenuItem value="DELETE">Xóa</MenuItem>
                                    <MenuItem value="ASSIGN">Gán</MenuItem>
                                    <MenuItem value="REMOVE">Gỡ bỏ</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={3}>
                            <FormControl fullWidth>
                                <InputLabel>Loại thực thể</InputLabel>
                                <Select
                                    value={filters.entity_type}
                                    label="Loại thực thể"
                                    onChange={(e) => handleFilterChange('entity_type', e.target.value)}
                                >
                                    <MenuItem value="">Tất cả</MenuItem>
                                    {Object.entries(ENTITY_TYPE_LABELS).map(([key, label]) => (
                                        <MenuItem key={key} value={key}>
                                            {label}
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
                                <TableCell>Hành động</TableCell>
                                <TableCell>Loại thực thể</TableCell>
                                <TableCell>Thời gian</TableCell>
                                <TableCell>Người thực hiện</TableCell>
                                <TableCell>Chi tiết</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {employeeLogs.map((log) => (
                                <TableRow key={log.id}>
                                    <TableCell>
                                        <Box>
                                            <Typography variant="body2" fontWeight="medium">
                                                {log.Employee.User.full_name}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {log.Employee.User.email}
                                            </Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        {log.Employee.OrgAssignment[0]?.OrgUnit.name || 'N/A'}
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={getActionLabel(log.action)}
                                            color={ACTION_COLORS[log.action as keyof typeof ACTION_COLORS]}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Box display="flex" alignItems="center" gap={1}>
                                            {getEntityTypeIcon(log.entity_type)}
                                            <Typography variant="body2">
                                                {getEntityTypeLabel(log.entity_type)}
                                            </Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2">
                                            {formatDate(log.created_at)}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Box>
                                            <Typography variant="body2">
                                                {log.User?.full_name || 'System'}
                                            </Typography>
                                            {log.actor_role && (
                                                <Typography variant="caption" color="text.secondary">
                                                    {log.actor_role}
                                                </Typography>
                                            )}
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Accordion>
                                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                                <Typography variant="body2">Xem chi tiết</Typography>
                                            </AccordionSummary>
                                            <AccordionDetails>
                                                <Grid container spacing={2}>
                                                    {log.field_name && (
                                                        <Grid item xs={12}>
                                                            <Typography variant="subtitle2">Trường:</Typography>
                                                            <Typography variant="body2">{log.field_name}</Typography>
                                                        </Grid>
                                                    )}
                                                    {log.old_value && (
                                                        <Grid item xs={6}>
                                                            <Typography variant="subtitle2">Giá trị cũ:</Typography>
                                                            <Typography
                                                                variant="body2"
                                                                sx={{
                                                                    bgcolor: 'error.light',
                                                                    p: 1,
                                                                    borderRadius: 1,
                                                                    fontFamily: 'monospace',
                                                                    fontSize: '0.875rem'
                                                                }}
                                                            >
                                                                {formatFieldValue(log.old_value)}
                                                            </Typography>
                                                        </Grid>
                                                    )}
                                                    {log.new_value && (
                                                        <Grid item xs={6}>
                                                            <Typography variant="subtitle2">Giá trị mới:</Typography>
                                                            <Typography
                                                                variant="body2"
                                                                sx={{
                                                                    bgcolor: 'success.light',
                                                                    p: 1,
                                                                    borderRadius: 1,
                                                                    fontFamily: 'monospace',
                                                                    fontSize: '0.875rem'
                                                                }}
                                                            >
                                                                {formatFieldValue(log.new_value)}
                                                            </Typography>
                                                        </Grid>
                                                    )}
                                                    {log.reason && (
                                                        <Grid item xs={12}>
                                                            <Typography variant="subtitle2">Lý do:</Typography>
                                                            <Typography variant="body2">{log.reason}</Typography>
                                                        </Grid>
                                                    )}
                                                </Grid>
                                            </AccordionDetails>
                                        </Accordion>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>

                {employeeLogs.length === 0 && (
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
