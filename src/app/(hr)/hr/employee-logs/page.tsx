'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
    Box,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Alert,
    CircularProgress,
    Chip,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Button,
    Pagination,
    Card,
    CardContent,
    Grid,
    IconButton,
    Tooltip,
    Menu,
    ListItemIcon,
    ListItemText,
} from '@mui/material';
import {
    History as HistoryIcon,
    Search as SearchIcon,
    Refresh as RefreshIcon,
    Visibility as VisibilityIcon,
    MoreVert as MoreVertIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Info as InfoIcon,
} from '@mui/icons-material';
import { HR_ROUTES, API_ROUTES } from '@/constants/routes';
import HrSearchBar from '@/components/hr/HrSearchBar';

interface Employee {
    id: string;
    employee_no: string;
    user?: {
        id: string;
        full_name: string;
    };
}

interface User {
    id: string;
    username: string;
    full_name: string;
}

interface EmployeeLog {
    id: string;
    employee_id: string;
    action: string;
    entity_type: string;
    entity_id?: string;
    field_name?: string;
    old_value?: string;
    new_value?: string;
    reason?: string;
    actor_id?: string;
    actor_role?: string;
    ip_address?: string;
    user_agent?: string;
    created_at: string;
    employees?: Employee;
    users?: User;
}

const ACTIONS = [
    'CREATE',
    'UPDATE',
    'DELETE',
    'VIEW',
    'LOGIN',
    'LOGOUT',
    'EXPORT',
    'IMPORT',
];

const ENTITY_TYPES = [
    'employee',
    'user',
    'qualification',
    'employment',
    'performance_review',
    'academic_title',
    'training',
    'org_unit',
    'assignment',
];

const ACTION_COLORS = {
    CREATE: 'success',
    UPDATE: 'warning',
    DELETE: 'error',
    VIEW: 'info',
    LOGIN: 'primary',
    LOGOUT: 'secondary',
    EXPORT: 'info',
    IMPORT: 'warning',
};

export default function EmployeeLogsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    const [logs, setLogs] = useState<EmployeeLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 50,
        total: 0,
        totalPages: 0,
    });

    const [filters, setFilters] = useState({
        employee_id: '',
        action: '',
        entity_type: '',
        actor_id: '',
        start_date: '',
        end_date: '',
    });

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [selectedLog, setSelectedLog] = useState<EmployeeLog | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (status === 'loading') return;
        if (!session) {
            router.push('/auth/signin');
            return;
        }
        fetchData();
    }, [session, status, router, pagination.page]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: pagination.page.toString(),
                limit: pagination.limit.toString(),
            });

            Object.entries(filters).forEach(([key, value]) => {
                if (value) {
                    params.append(key, value);
                }
            });

            const response = await fetch(`${API_ROUTES.HR.EMPLOYEE_LOGS}?${params}`);
            const result = await response.json();

            if (result.success) {
                setLogs(result.data);
                setPagination(prev => ({
                    ...prev,
                    total: result.pagination.total,
                    totalPages: result.pagination.totalPages,
                }));
            } else {
                setError(result.error || 'Failed to fetch employee logs');
            }
        } catch (err) {
            setError('Network error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (field: string, value: string) => {
        setFilters(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSearch = () => {
        setPagination(prev => ({ ...prev, page: 1 }));
        fetchData();
    };

    const handleReset = () => {
        setFilters({
            employee_id: '',
            action: '',
            entity_type: '',
            actor_id: '',
            start_date: '',
            end_date: '',
        });
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
        setPagination(prev => ({ ...prev, page: value }));
    };

    const formatValue = (value: string | null | undefined) => {
        if (!value) return '-';
        if (value.length > 100) {
            return value.substring(0, 100) + '...';
        }
        return value;
    };

    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, log: EmployeeLog) => {
        setAnchorEl(event.currentTarget);
        setSelectedLog(log);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        setSelectedLog(null);
    };

    const filteredLogs = useMemo(() => {
        if (!searchTerm.trim()) return logs;
        const term = searchTerm.trim().toLowerCase();
        return logs.filter((log) => {
            const values = [
                log.Employee?.User?.full_name,
                log.Employee?.employee_no,
                log.action,
                log.entity_type,
                log.User?.full_name,
                log.User?.username,
                log.reason,
                log.field_name,
                log.old_value,
                log.new_value,
                log.ip_address,
            ];
            return values.some((value) => value?.toLowerCase().includes(term));
        });
    }, [logs, searchTerm]);

    const handleViewDetails = () => {
        if (selectedLog) {
            // TODO: Implement view details functionality
            console.log('View details for log:', selectedLog.id);
        }
        handleMenuClose();
    };

    const handleEdit = () => {
        if (selectedLog) {
            // TODO: Implement edit functionality
            console.log('Edit log:', selectedLog.id);
        }
        handleMenuClose();
    };

    const handleDelete = () => {
        if (selectedLog) {
            // TODO: Implement delete functionality
            console.log('Delete log:', selectedLog.id);
        }
        handleMenuClose();
    };

    if (loading && logs.length === 0) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Box display="flex" alignItems="center" gap={2}>
                    <HistoryIcon color="primary" sx={{ fontSize: 32 }} />
                    <Typography variant="h4" component="h1">
                        Nhật ký Hoạt động Nhân viên
                    </Typography>
                </Box>
                <Button
                    variant="outlined"
                    startIcon={<RefreshIcon />}
                    onClick={fetchData}
                >
                    Làm mới
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
                    <Typography variant="h6" gutterBottom>
                        Bộ lọc
                    </Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6} md={2}>
                            <TextField
                                fullWidth
                                label="ID Nhân viên"
                                value={filters.employee_id}
                                onChange={(e) => handleFilterChange('employee_id', e.target.value)}
                                size="small"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={2}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Hành động</InputLabel>
                                <Select
                                    value={filters.action}
                                    onChange={(e) => handleFilterChange('action', e.target.value)}
                                    label="Hành động"
                                >
                                    <MenuItem value="">Tất cả</MenuItem>
                                    {ACTIONS.map((action) => (
                                        <MenuItem key={action} value={action}>
                                            {action}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6} md={2}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Loại thực thể</InputLabel>
                                <Select
                                    value={filters.entity_type}
                                    onChange={(e) => handleFilterChange('entity_type', e.target.value)}
                                    label="Loại thực thể"
                                >
                                    <MenuItem value="">Tất cả</MenuItem>
                                    {ENTITY_TYPES.map((type) => (
                                        <MenuItem key={type} value={type}>
                                            {type}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6} md={2}>
                            <TextField
                                fullWidth
                                label="ID Người thực hiện"
                                value={filters.actor_id}
                                onChange={(e) => handleFilterChange('actor_id', e.target.value)}
                                size="small"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={2}>
                            <TextField
                                fullWidth
                                label="Từ ngày"
                                type="date"
                                value={filters.start_date}
                                onChange={(e) => handleFilterChange('start_date', e.target.value)}
                                InputLabelProps={{ shrink: true }}
                                size="small"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={2}>
                            <TextField
                                fullWidth
                                label="Đến ngày"
                                type="date"
                                value={filters.end_date}
                                onChange={(e) => handleFilterChange('end_date', e.target.value)}
                                InputLabelProps={{ shrink: true }}
                                size="small"
                            />
                        </Grid>
                    </Grid>
                    <Box display="flex" gap={2} mt={2}>
                        <Button
                            variant="contained"
                            startIcon={<SearchIcon />}
                            onClick={handleSearch}
                        >
                            Tìm kiếm
                        </Button>
                        <Button
                            variant="outlined"
                            onClick={handleReset}
                        >
                            Đặt lại
                        </Button>
                    </Box>
                </CardContent>
            </Card>

            <Box sx={{ maxWidth: 420, mb: 2 }}>
                <HrSearchBar
                    value={searchTerm}
                    onChange={setSearchTerm}
                    placeholder="Tìm kiếm nhanh theo nhân viên, hành động, người thực hiện..."
                />
            </Box>

            {/* Logs Table */}
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Thời gian</TableCell>
                            <TableCell>Nhân viên</TableCell>
                            <TableCell>Hành động</TableCell>
                            <TableCell>Loại thực thể</TableCell>
                            <TableCell>Người thực hiện</TableCell>
                            <TableCell align="center">Thao tác</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredLogs.length > 0 ? (
                            filteredLogs.map((log) => (
                                <TableRow key={log.id}>
                                    <TableCell>
                                        <Typography variant="body2">
                                            {new Date(log.created_at).toLocaleString('vi-VN')}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2">
                                            {log.Employee?.User?.full_name || 'N/A'}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {log.Employee?.employee_no || log.employee_id}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={log.action}
                                            color={ACTION_COLORS[log.action as keyof typeof ACTION_COLORS] as string || 'default'}
                                            variant="outlined"
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2">
                                            {log.entity_type}
                                        </Typography>
                                        {log.entity_id && (
                                            <Typography variant="caption" color="text.secondary">
                                                ID: {log.entity_id}
                                            </Typography>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2">
                                            {log.User?.full_name || 'N/A'}
                                        </Typography>
                                        {log.User && (
                                            <Typography variant="caption" color="text.secondary">
                                                @{log.User.username}
                                            </Typography>
                                        )}
                                    </TableCell>
                                    <TableCell align="center">
                                        <IconButton
                                            size="small"
                                            onClick={(e) => handleMenuOpen(e, log)}
                                            color="primary"
                                        >
                                            <MoreVertIcon />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        {searchTerm.trim()
                                            ? 'Không tìm thấy nhật ký phù hợp'
                                            : 'Không có dữ liệu'}
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Actions Menu */}
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
            >
                <MenuItem onClick={handleViewDetails} sx={{ color: 'black' }}>
                    <ListItemIcon>
                        <VisibilityIcon fontSize="small" sx={{ color: 'black' }} />
                    </ListItemIcon>
                    <ListItemText sx={{
                        '& .MuiListItemText-primary': {
                            color: 'black !important'
                        }
                    }}>Xem chi tiết</ListItemText>
                </MenuItem>
                <MenuItem onClick={handleEdit} sx={{ color: 'black' }}>
                    <ListItemIcon>
                        <EditIcon fontSize="small" sx={{ color: 'black' }} />
                    </ListItemIcon>
                    <ListItemText sx={{
                        '& .MuiListItemText-primary': {
                            color: 'black !important'
                        }
                    }}>Chỉnh sửa</ListItemText>
                </MenuItem>
                <MenuItem onClick={handleDelete} sx={{ color: 'black' }}>
                    <ListItemIcon>
                        <DeleteIcon fontSize="small" sx={{ color: 'black' }} />
                    </ListItemIcon>
                    <ListItemText sx={{
                        '& .MuiListItemText-primary': {
                            color: 'black !important'
                        }
                    }}>Xóa</ListItemText>
                </MenuItem>
            </Menu>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
                <Box display="flex" justifyContent="center" mt={3}>
                    <Pagination
                        count={pagination.totalPages}
                        page={pagination.page}
                        onChange={handlePageChange}
                        color="primary"
                        size="large"
                    />
                </Box>
            )}

            {/* Summary */}
            <Box mt={2}>
                <Typography variant="body2" color="text.secondary">
                    Hiển thị {filteredLogs.length} / {pagination.total} bản ghi
                </Typography>
            </Box>
        </Box>
    );
}
