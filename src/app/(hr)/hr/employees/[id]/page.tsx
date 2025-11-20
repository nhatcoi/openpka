'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useConfirmDialog } from '@/components/dialogs/ConfirmDialogProvider';
import {
    Box,
    Paper,
    Typography,
    Button,
    Grid,
    Card,
    CardContent,
    Chip,
    Alert,
    CircularProgress,
    Divider,
    IconButton,
} from '@mui/material';
import {
    ArrowBack as ArrowBackIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Work as WorkIcon,
    School as SchoolIcon,
    Assessment as AssessmentIcon,
} from '@mui/icons-material';
import { HR_ROUTES, API_ROUTES } from '@/constants/routes';

interface Employee {
    id: string;
    employee_no: string | null;
    employment_type: string | null;
    status: string | null;
    hired_at: string | null;
    terminated_at: string | null;
    user: {
        id: string;
        username: string;
        email: string | null;
        full_name: string;
        dob: string | null;
        gender: string | null;
        phone: string | null;
        address: string | null;
    } | null;
    assignments: {
        id: string;
        org_unit_id: string;
        position_id: string | null;
        is_primary: boolean;
        assignment_type: string;
        start_date: string;
        end_date: string | null;
        allocation: string | null;
        org_unit: {
            id: string;
            name: string;
            type: string;
            description: string | null;
        } | null;
        job_positions: {
            id: string;
            title: string;
            code: string;
            grade: string | null;
        } | null;
    }[];
    employments?: {
        id: string;
        contract_no: string;
        contract_type: string;
        start_date: string;
        end_date: string | null;
        fte: number;
        salary_band: string;
    }[];
}

export default function EmployeeDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { data: session, status } = useSession();
    const confirmDialog = useConfirmDialog();
    const [employee, setEmployee] = useState<Employee | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (status === 'loading') return;

        if (!session) {
            router.push('/auth/signin');
            return;
        }

        if (params.id) {
            fetchEmployee(params.id as string);
        }
    }, [session, status, params.id, router]);

    const fetchEmployee = async (employeeId: string) => {
        try {
            setLoading(true);
            const response = await fetch(API_ROUTES.HR.EMPLOYEES_BY_ID(employeeId));
            const result = await response.json();

            if (result.success) {
                setEmployee(result.data);
            } else {
                setError('Không thể tải thông tin nhân viên');
            }
        } catch (error) {
            console.error('Error fetching employee:', error);
            setError('Lỗi khi tải thông tin nhân viên');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!employee) return;

        const confirmed = await confirmDialog({
            title: 'Xóa nhân viên',
            message: `Bạn có chắc chắn muốn xóa nhân viên ${employee.User?.full_name}?`,
            confirmText: 'Xóa',
            cancelText: 'Hủy',
            destructive: true,
        });
        if (!confirmed) return;

        try {
            const response = await fetch(API_ROUTES.HR.EMPLOYEES_BY_ID(employee.id), {
                method: 'DELETE',
            });

            const result = await response.json();

            if (result.success) {
                router.push(HR_ROUTES.EMPLOYEES);
            } else {
                setError(result.error || 'Không thể xóa nhân viên');
            }
        } catch (error) {
            console.error('Error deleting employee:', error);
            setError('Lỗi khi xóa nhân viên');
        }
    };

    if (status === 'loading' || loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
                <Typography variant="h6" sx={{ ml: 2 }}>
                    Đang tải thông tin nhân viên...
                </Typography>
            </Box>
        );
    }

    if (!session) {
        return null;
    }

    if (error) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error">{error}</Alert>
            </Box>
        );
    }

    if (!employee) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="warning">
                    Không tìm thấy nhân viên
                </Alert>
            </Box>
        );
    }

    const primaryAssignment = employee.OrgAssignment?.find(a => a.is_primary);

    return (
        <Box sx={{ p: 3 }}>
            {/* Header */}
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
                <Box display="flex" alignItems="center">
                    <Button
                        startIcon={<ArrowBackIcon />}
                        onClick={() => router.push(HR_ROUTES.EMPLOYEES)}
                        sx={{ mr: 2 }}
                    >
                        Quay lại
                    </Button>
                    <Typography variant="h4" component="h1">
                        Chi tiết nhân viên
                    </Typography>
                </Box>
                <Box display="flex" gap={1}>
                    <Button
                        variant="contained"
                        startIcon={<EditIcon />}
                        onClick={() => router.push(`${HR_ROUTES.EMPLOYEES}/${employee.id}/edit`)}
                    >
                        Chỉnh sửa
                    </Button>
                    <Button
                        variant="outlined"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={handleDelete}
                    >
                        Xóa
                    </Button>
                </Box>
            </Box>

            <Grid container spacing={3}>
                {/* Thông tin cơ bản */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" color="primary" gutterBottom>
                                Thông tin cơ bản
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <Box>
                                    <Typography variant="body2" color="text.secondary">
                                        Mã nhân viên
                                    </Typography>
                                    <Typography variant="body1" fontWeight="medium">
                                        {employee.employee_no || 'N/A'}
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography variant="body2" color="text.secondary">
                                        Họ và tên
                                    </Typography>
                                    <Typography variant="body1" fontWeight="medium">
                                        {employee.User?.full_name || 'N/A'}
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography variant="body2" color="text.secondary">
                                        Username
                                    </Typography>
                                    <Typography variant="body1">
                                        {employee.User?.username || 'N/A'}
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography variant="body2" color="text.secondary">
                                        Email
                                    </Typography>
                                    <Typography variant="body1">
                                        {employee.User?.email || 'N/A'}
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography variant="body2" color="text.secondary">
                                        Số điện thoại
                                    </Typography>
                                    <Typography variant="body1">
                                        {employee.User?.phone || 'N/A'}
                                    </Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Thông tin nhân viên */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" color="success.main" gutterBottom>
                                Thông tin nhân viên
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <Box>
                                    <Typography variant="body2" color="text.secondary">
                                        Loại nhân viên
                                    </Typography>
                                    <Chip
                                        label={employee.employment_type || 'N/A'}
                                        size="small"
                                        color="primary"
                                        variant="outlined"
                                    />
                                </Box>
                                <Box>
                                    <Typography variant="body2" color="text.secondary">
                                        Trạng thái
                                    </Typography>
                                    <Chip
                                        label={employee.status || 'N/A'}
                                        size="small"
                                        color={employee.status === 'ACTIVE' ? 'success' : 'default'}
                                        variant="filled"
                                    />
                                </Box>
                                <Box>
                                    <Typography variant="body2" color="text.secondary">
                                        Ngày tuyển dụng
                                    </Typography>
                                    <Typography variant="body1">
                                        {employee.hired_at ? new Date(employee.hired_at).toLocaleDateString('vi-VN') : 'N/A'}
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography variant="body2" color="text.secondary">
                                        Ngày nghỉ việc
                                    </Typography>
                                    <Typography variant="body1">
                                        {employee.terminated_at ? new Date(employee.terminated_at).toLocaleDateString('vi-VN') : 'N/A'}
                                    </Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Thông tin cá nhân */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" color="info.main" gutterBottom>
                                Thông tin cá nhân
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <Box>
                                    <Typography variant="body2" color="text.secondary">
                                        Ngày sinh
                                    </Typography>
                                    <Typography variant="body1">
                                        {employee.User?.dob ? new Date(employee.User.dob).toLocaleDateString('vi-VN') : 'N/A'}
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography variant="body2" color="text.secondary">
                                        Giới tính
                                    </Typography>
                                    <Typography variant="body1">
                                        {employee.User?.gender || 'N/A'}
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography variant="body2" color="text.secondary">
                                        Địa chỉ
                                    </Typography>
                                    <Typography variant="body1">
                                        {employee.User?.address || 'N/A'}
                                    </Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Thông tin công việc */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" color="warning.main" gutterBottom>
                                Thông tin công việc
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <Box>
                                    <Typography variant="body2" color="text.secondary">
                                        Đơn vị
                                    </Typography>
                                    <Typography variant="body1" fontWeight="medium">
                                        {primaryAssignment?.OrgUnit?.name || 'N/A'}
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography variant="body2" color="text.secondary">
                                        Chức vụ
                                    </Typography>
                                    <Typography variant="body1">
                                        {primaryAssignment?.JobPosition?.title || 'N/A'}
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography variant="body2" color="text.secondary">
                                        Loại phân công
                                    </Typography>
                                    <Typography variant="body1">
                                        {primaryAssignment?.assignment_type || 'N/A'}
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography variant="body2" color="text.secondary">
                                        Tỷ lệ phân bổ
                                    </Typography>
                                    <Typography variant="body1">
                                        {primaryAssignment?.allocation || 'N/A'}
                                    </Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Hợp đồng lao động */}
                <Grid item xs={12}>
                    <Card>
                        <CardContent>
                            <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                                <Typography variant="h6" color="secondary.main">
                                    Hợp đồng lao động
                                </Typography>
                                <Button
                                    variant="outlined"
                                    startIcon={<WorkIcon />}
                                    onClick={() => router.push(`${HR_ROUTES.EMPLOYMENTS}?employee_id=${employee.id}`)}
                                >
                                    Xem lịch sử hợp đồng
                                </Button>
                            </Box>
                            {employee.employments && employee.employments.length > 0 ? (
                                <Box>
                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                        Hợp đồng hiện tại
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                        <Chip
                                            label={`${employee.employments[0].contract_no} - ${employee.employments[0].contract_type}`}
                                            color="primary"
                                            variant="outlined"
                                        />
                                        <Chip
                                            label={`FTE: ${employee.employments[0].fte}`}
                                            color="secondary"
                                            variant="outlined"
                                        />
                                        <Chip
                                            label={`Bậc lương: ${employee.employments[0].salary_band}`}
                                            color="info"
                                            variant="outlined"
                                        />
                                    </Box>
                                </Box>
                            ) : (
                                <Typography variant="body2" color="text.secondary">
                                    Chưa có hợp đồng lao động
                                </Typography>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                {/* Đánh giá hiệu suất */}
                <Grid item xs={12}>
                    <Card>
                        <CardContent>
                            <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                                <Typography variant="h6" color="warning.main">
                                    Đánh giá hiệu suất
                                </Typography>
                                <Button
                                    variant="outlined"
                                    startIcon={<AssessmentIcon />}
                                    onClick={() => router.push(`${HR_ROUTES.PERFORMANCE_REVIEWS}?employee_id=${employee.id}`)}
                                >
                                    Xem lịch sử đánh giá
                                </Button>
                            </Box>
                            <Typography variant="body2" color="text.secondary">
                                Xem và quản lý đánh giá hiệu suất của nhân viên
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Học hàm học vị */}
                <Grid item xs={12}>
                    <Card>
                        <CardContent>
                            <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                                <Typography variant="h6" color="info.main">
                                    Học hàm học vị
                                </Typography>
                                <Button
                                    variant="outlined"
                                    startIcon={<SchoolIcon />}
                                    onClick={() => router.push(`${HR_ROUTES.EMPLOYEE_ACADEMIC_TITLES}?employee_id=${employee.id}`)}
                                >
                                    Xem học hàm học vị
                                </Button>
                            </Box>
                            <Typography variant="body2" color="text.secondary">
                                Xem và quản lý học hàm học vị của nhân viên
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Đào tạo */}
                <Grid item xs={12}>
                    <Card>
                        <CardContent>
                            <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                                <Typography variant="h6" color="success.main">
                                    Đào tạo
                                </Typography>
                                <Button
                                    variant="outlined"
                                    startIcon={<SchoolIcon />}
                                    onClick={() => router.push(`${HR_ROUTES.EMPLOYEE_TRAININGS}?employee_id=${employee.id}`)}
                                >
                                    Xem đào tạo
                                </Button>
                            </Box>
                            <Typography variant="body2" color="text.secondary">
                                Xem và quản lý đào tạo của nhân viên
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Bằng cấp */}
                <Grid item xs={12}>
                    <Card>
                        <CardContent>
                            <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                                <Typography variant="h6" color="success.main">
                                    Bằng cấp
                                </Typography>
                                <Button
                                    variant="outlined"
                                    startIcon={<SchoolIcon />}
                                    onClick={() => router.push(`${HR_ROUTES.EMPLOYEE_QUALIFICATIONS}?employee_id=${employee.id}`)}
                                >
                                    Xem bằng cấp
                                </Button>
                            </Box>
                            <Typography variant="body2" color="text.secondary">
                                Nhấn &quot;Xem bằng cấp&quot; để xem chi tiết các bằng cấp của nhân viên
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
}
