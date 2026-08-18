'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signIn } from 'next-auth/react';
import {
    Box,
    Paper,
    Typography,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    IconButton,
    Alert,
    CircularProgress,
    Stack,
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Visibility as ViewIcon,
} from '@mui/icons-material';
import { useConfirmDialog } from '@/components/dialogs/confirm-dialog-provider';
import { HR_ROUTES } from '@/constants/routes';
import {
    useAssignments,
    useDeleteAssignment,
    Assignment,
    HrSearchBar
} from '@/features/hr';

const formatDate = (dateString: string): string => {
    try {
        return new Date(dateString).toLocaleDateString('vi-VN');
    } catch {
        return dateString;
    }
};

const formatAllocation = (allocation: string | number): string => {
    try {
        const val = typeof allocation === 'number' ? allocation : parseFloat(allocation);
        return isNaN(val) ? String(allocation) : `${(val * 100).toFixed(0)}%`;
    } catch {
        return String(allocation);
    }
};

export default function AssignmentsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const confirmDialog = useConfirmDialog();

    const { data: assignments = [], isLoading: loading, error: queryError } = useAssignments();
    const { mutateAsync: deleteAssignment } = useDeleteAssignment();

    const [actionError, setActionError] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (status === 'loading') return;
        if (!session) {
            router.push('/auth/signin');
        }
    }, [session, status, router]);

    const error = actionError || (queryError ? (queryError as Error).message : '');

    // Handlers
    const handleDelete = useCallback(async (id: string) => {
        const confirmed = await confirmDialog({
            title: 'Xóa phân công',
            message: 'Bạn có chắc chắn muốn xóa phân công này?',
            confirmText: 'Xóa',
            cancelText: 'Hủy',
            destructive: true,
        });
        if (!confirmed) {
            return;
        }

        try {
            setActionError('');
            await deleteAssignment(id);
        } catch (err: any) {
            setActionError(err.message || 'Lỗi khi xóa phân công');
        }
    }, [confirmDialog, deleteAssignment]);

    const handleView = useCallback((id: string) => {
        router.push(HR_ROUTES.ASSIGNMENTS_DETAIL(id));
    }, [router]);

    const handleEdit = useCallback((id: string) => {
        router.push(HR_ROUTES.ASSIGNMENTS_EDIT(id));
    }, [router]);

    const getEmployeeName = useCallback((assignment: Assignment): string => {
        if (assignment.Employee?.User?.full_name) return assignment.Employee.User.full_name;
        if (assignment.employee?.user?.full_name) return assignment.employee.user.full_name;
        return `Employee ${assignment.employee_id}`;
    }, []);

    const getOrgUnitName = useCallback((assignment: Assignment): string => {
        if (assignment.OrgUnit?.name) return assignment.OrgUnit.name;
        if (assignment.org_unit?.name) return assignment.org_unit.name;
        return `Unit ${assignment.org_unit_id}`;
    }, []);

    // Computed values
    const filteredAssignments = useMemo(() => {
        if (!searchTerm.trim()) {
            return assignments;
        }
        const term = searchTerm.trim().toLowerCase();
        return (assignments as Assignment[]).filter((assignment: Assignment) => {
            const values = [
                getEmployeeName(assignment),
                getOrgUnitName(assignment),
                assignment.assignment_type,
                formatAllocation(assignment.allocation),
                formatDate(assignment.start_date),
                assignment.end_date ? formatDate(assignment.end_date) : '',
            ];
            return values.some((value) => value?.toLowerCase().includes(term));
        });
    }, [assignments, searchTerm, getEmployeeName, getOrgUnitName]);

    const hasAssignments = useMemo(() => assignments.length > 0, [assignments]);

    // Loading state
    if (status === 'loading' || loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    // Not authenticated
    if (!session) {
        return null;
    }

    return (
        <Box>
            {/* Header */}
            <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={2} mb={2}>
                <Typography variant="h4" component="h1">
                    Quản lý phân công
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => router.push(HR_ROUTES.ASSIGNMENTS_NEW)}
                >
                    Thêm phân công
                </Button>
            </Stack>

            <Box sx={{ maxWidth: 420, mb: 3 }}>
                <HrSearchBar
                    value={searchTerm}
                    onChange={setSearchTerm}
                    placeholder="Tìm kiếm theo nhân viên, đơn vị, loại phân công..."
                />
            </Box>

            {/* Error message */}
            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setActionError('')}>
                    {error}
                </Alert>
            )}

            {/* Assignments table */}
            <Paper>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Nhân viên</TableCell>
                                <TableCell>Đơn vị</TableCell>
                                <TableCell>Loại phân công</TableCell>
                                <TableCell>Tỷ lệ</TableCell>
                                <TableCell>Chính</TableCell>
                                <TableCell>Ngày bắt đầu</TableCell>
                                <TableCell>Ngày kết thúc</TableCell>
                                <TableCell align="right">Thao tác</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredAssignments.length > 0 ? (
                                (filteredAssignments as Assignment[]).map((assignment: Assignment) => (
                                    <TableRow key={assignment.id} hover>
                                        <TableCell>{getEmployeeName(assignment)}</TableCell>
                                        <TableCell>{getOrgUnitName(assignment)}</TableCell>
                                        <TableCell>
                                            <Chip
                                                label={assignment.assignment_type}
                                                color={assignment.assignment_type === 'admin' ? 'primary' : 'secondary'}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell>{formatAllocation(assignment.allocation)}</TableCell>
                                        <TableCell>
                                            <Chip
                                                label={assignment.is_primary ? 'Có' : 'Không'}
                                                color={assignment.is_primary ? 'success' : 'default'}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell>{formatDate(assignment.start_date)}</TableCell>
                                        <TableCell>
                                            {assignment.end_date ? formatDate(assignment.end_date) : '-'}
                                        </TableCell>
                                        <TableCell align="right">
                                            <IconButton
                                                size="small"
                                                onClick={() => handleView(assignment.id)}
                                                aria-label="Xem chi tiết"
                                            >
                                                <ViewIcon />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleEdit(assignment.id)}
                                                aria-label="Chỉnh sửa"
                                            >
                                                <EditIcon />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleDelete(assignment.id)}
                                                color="error"
                                                aria-label="Xóa"
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                                        <Typography variant="body2" color="text.secondary">
                                            {searchTerm.trim() ? 'Không tìm thấy phân công phù hợp' : 'Chưa có phân công nào'}
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        </Box>
    );
}
