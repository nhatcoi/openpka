'use client';

import { useState, useEffect } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useConfirmDialog } from '@/components/dialogs/confirm-dialog-provider';
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
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Visibility as ViewIcon,
    Work as WorkIcon,
    Assessment as AssessmentIcon,
    School as SchoolIcon,
} from '@mui/icons-material';
import { HR_ROUTES } from '@/constants/routes';
import { useEmployees, useDeleteEmployee, HrSearchBar } from '@/features/hr';

export default function EmployeesPage() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const confirmDialog = useConfirmDialog()
    const { data: employees = [], isLoading: loading, error: queryError } = useEmployees();
    const { mutateAsync: deleteEmployee } = useDeleteEmployee();
    const [actionError, setActionError] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState('')

    useEffect(() => {
        if (status === 'loading') return

        if (!session) {
            void signIn()
        }
    }, [session, status])

    const error = actionError || (queryError ? (queryError as Error).message : '')

    const handleDeleteEmployee = async (employeeId: string, employeeName: string) => {
        const confirmed = await confirmDialog({
            title: 'Xóa nhân viên',
            message: `Bạn có chắc chắn muốn xóa nhân viên ${employeeName}?`,
            confirmText: 'Xóa',
            cancelText: 'Hủy',
            destructive: true,
        });
        if (!confirmed) return;

        try {
            setActionLoading(`delete-${employeeId}`);
            setActionError(null);
            await deleteEmployee(employeeId);
        } catch (err: any) {
            console.error('Error deleting employee:', err);
            setActionError(err.message || 'Lỗi khi xóa nhân viên');
        } finally {
            setActionLoading(null);
        }
    };

    if (status === 'loading' || loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
                <Typography variant="h6" sx={{ ml: 2 }}>
                    Đang tải danh sách nhân viên...
                </Typography>
            </Box>
        )
    }

    if (error) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <Alert severity="error" sx={{ maxWidth: 600 }}>
                    {error}
                </Alert>
            </Box>
        )
    }

    if (!session) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <Typography variant="h6">
                    Đang chuyển hướng đến trang đăng nhập...
                </Typography>
            </Box>
        )
    }

    const normalizeString = (value: string | null | undefined) =>
        value ? value.toLowerCase() : ''

    const filteredEmployees = employees.filter((employee) => {
        if (!searchTerm.trim()) {
            return true
        }

        const term = searchTerm.trim().toLowerCase()

        return [
            employee.employee_no,
            employee.User?.full_name,
            employee.User?.username,
            employee.User?.email,
            employee.User?.phone,
            employee.OrgAssignment?.find((assignment) => assignment.is_primary)?.OrgUnit?.name ?? ''
        ]
            .map(normalizeString)
            .some((value) => value.includes(term))
    })

    return (
        <Box sx={{ p: 3 }}>
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', md: 'row' },
                    justifyContent: 'space-between',
                    alignItems: { xs: 'flex-start', md: 'center' },
                    gap: 2,
                    mb: 2
                }}
            >
                <Typography variant="h4" component="h1" fontWeight="bold">
                    Danh sách nhân viên
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => router.push(HR_ROUTES.EMPLOYEES_NEW)}
                    sx={{
                        whiteSpace: 'nowrap',
                        bgcolor: 'primary.main',
                        '&:hover': { bgcolor: 'primary.dark' }
                    }}
                >
                    Thêm nhân viên
                </Button>
            </Box>
            <Box sx={{ maxWidth: 420, mb: 3 }}>
                <HrSearchBar
                    value={searchTerm}
                    onChange={setSearchTerm}
                    placeholder="Tìm kiếm theo mã, họ tên, email, số điện thoại hoặc đơn vị"
                />
            </Box>

            <Paper sx={{ width: '100%', overflow: 'hidden' }}>
                <TableContainer>
                    <Table stickyHeader>
                        <TableHead>
                            <TableRow>
                                <TableCell><strong>Mã NV</strong></TableCell>
                                <TableCell><strong>Họ tên</strong></TableCell>
                                <TableCell><strong>Username</strong></TableCell>
                                <TableCell><strong>Email</strong></TableCell>
                                <TableCell><strong>Số điện thoại</strong></TableCell>
                                <TableCell><strong>Loại NV</strong></TableCell>
                                <TableCell><strong>Đơn vị</strong></TableCell>
                                <TableCell><strong>Chức vụ</strong></TableCell>
                                <TableCell><strong>Hợp đồng</strong></TableCell>
                                <TableCell><strong>Trạng thái</strong></TableCell>
                                <TableCell><strong>Ngày tuyển</strong></TableCell>
                                <TableCell><strong>Hành động</strong></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredEmployees.map((employee) => {
                                const primaryAssignment = employee.OrgAssignment?.find(a => a.is_primary);
                                return (
                                    <TableRow key={employee.id} hover>
                                        <TableCell>{employee.employee_no || 'N/A'}</TableCell>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight="medium">
                                                {employee.User?.full_name || 'N/A'}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>{employee.User?.username || 'N/A'}</TableCell>
                                        <TableCell>{employee.User?.email || 'N/A'}</TableCell>
                                        <TableCell>{employee.User?.phone || 'N/A'}</TableCell>
                                        <TableCell>
                                            <Chip
                                                label={employee.employment_type || 'N/A'}
                                                size="small"
                                                color="primary"
                                                variant="outlined"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" color="text.secondary">
                                                {primaryAssignment?.OrgUnit?.name || 'N/A'}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" color="text.secondary">
                                                {primaryAssignment?.JobPosition?.title || 'N/A'}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            {employee.employments && employee.employments.length > 0 ? (
                                                <Box>
                                                    <Typography variant="body2" fontWeight="medium">
                                                        {employee.employments[0].contract_no}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {employee.employments[0].contract_type} - {employee.employments[0].salary_band}
                                                    </Typography>
                                                </Box>
                                            ) : (
                                                <Typography variant="body2" color="text.secondary">
                                                    Chưa có hợp đồng
                                                </Typography>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={employee.status || 'N/A'}
                                                size="small"
                                                color={employee.status === 'ACTIVE' ? 'success' : 'default'}
                                                variant="filled"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            {employee.hired_at ? new Date(employee.hired_at).toLocaleDateString('vi-VN') : 'N/A'}
                                        </TableCell>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', gap: 1 }}>
                                                <IconButton
                                                    size="small"
                                                    color="primary"
                                                    onClick={() => {
                                                        setActionLoading(`view-${employee.id}`);
                                                        router.push(`${HR_ROUTES.EMPLOYEES}/${employee.id}`);
                                                    }}
                                                    disabled={actionLoading === `view-${employee.id}`}
                                                    title="Xem chi tiết"
                                                >
                                                    {actionLoading === `view-${employee.id}` ? (
                                                        <CircularProgress size={16} />
                                                    ) : (
                                                        <ViewIcon />
                                                    )}
                                                </IconButton>
                                                <IconButton
                                                    size="small"
                                                    color="secondary"
                                                    onClick={() => {
                                                        setActionLoading(`employment-${employee.id}`);
                                                        router.push(`${HR_ROUTES.EMPLOYMENTS}?employee_id=${employee.id}`);
                                                    }}
                                                    disabled={actionLoading === `employment-${employee.id}`}
                                                    title="Xem lịch sử hợp đồng"
                                                >
                                                    {actionLoading === `employment-${employee.id}` ? (
                                                        <CircularProgress size={16} />
                                                    ) : (
                                                        <WorkIcon />
                                                    )}
                                                </IconButton>
                                                <IconButton
                                                    size="small"
                                                    color="secondary"
                                                    onClick={() => {
                                                        setActionLoading(`edit-${employee.id}`);
                                                        router.push(`${HR_ROUTES.EMPLOYEES}/${employee.id}/edit`);
                                                    }}
                                                    disabled={actionLoading === `edit-${employee.id}`}
                                                    title="Chỉnh sửa"
                                                >
                                                    {actionLoading === `edit-${employee.id}` ? (
                                                        <CircularProgress size={16} />
                                                    ) : (
                                                        <EditIcon />
                                                    )}
                                                </IconButton>
                                                <IconButton
                                                    size="small"
                                                    color="info"
                                                    onClick={() => router.push(`${HR_ROUTES.PERFORMANCE_REVIEWS}?employee_id=${employee.id}`)}
                                                    title="Xem đánh giá"
                                                >
                                                    <AssessmentIcon />
                                                </IconButton>
                                                <IconButton
                                                    size="small"
                                                    color="secondary"
                                                    onClick={() => router.push(`${HR_ROUTES.EMPLOYEE_ACADEMIC_TITLES}?employee_id=${employee.id}`)}
                                                    title="Xem học hàm học vị"
                                                >
                                                    <SchoolIcon />
                                                </IconButton>
                                                <IconButton
                                                    size="small"
                                                    color="success"
                                                    onClick={() => router.push(`${HR_ROUTES.EMPLOYEE_TRAININGS}?employee_id=${employee.id}`)}
                                                    title="Xem đào tạo"
                                                >
                                                    <SchoolIcon />
                                                </IconButton>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            {filteredEmployees.length === 0 && !loading && (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="h6" color="text.secondary">
                        {searchTerm.trim()
                            ? 'Không tìm thấy nhân viên phù hợp'
                            : 'Chưa có nhân viên nào'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        {searchTerm.trim()
                            ? 'Thử từ khoá khác hoặc kiểm tra lại thông tin tìm kiếm'
                            : 'Nhấn "Thêm nhân viên" để bắt đầu'}
                    </Typography>
                </Box>
            )}
        </Box>
    )
}