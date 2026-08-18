'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
    Box,
    Paper,
    Typography,
    Button,
    Grid,
    Card,
    CardContent,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Alert,
    CircularProgress,
} from '@mui/material';
import {
    ArrowBack as ArrowBackIcon,
    Save as SaveIcon,
} from '@mui/icons-material';
import { HR_ROUTES, API_ROUTES } from '@/constants/routes';
import { useEmployee, useUpdateEmployee } from '@/features/hr';

export default function EditEmployeePage() {
    const params = useParams();
    const router = useRouter();
    const { data: session, status } = useSession();
    const employeeId = params?.id as string;
    const { data: employee, isLoading: loading, error: queryError } = useEmployee(employeeId);
    const { mutateAsync: updateEmployee } = useUpdateEmployee();

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [formData, setFormData] = useState({
        employee_no: '',
        employment_type: '',
        status: 'ACTIVE',
        hired_at: '',
        terminated_at: '',
        full_name: '',
        email: '',
        phone: '',
        address: '',
        dob: '',
        gender: '',
        new_password: ''
    });

    useEffect(() => {
        if (status === 'loading') return;
        if (!session) {
            router.push('/auth/signin');
        }
    }, [session, status, router]);

    useEffect(() => {
        if (employee) {
            setFormData({
                employee_no: employee.employee_no || '',
                employment_type: employee.employment_type || '',
                status: employee.status || 'ACTIVE',
                hired_at: employee.hired_at ? employee.hired_at.split('T')[0] : '',
                terminated_at: employee.terminated_at ? employee.terminated_at.split('T')[0] : '',
                full_name: employee.User?.full_name || '',
                email: employee.User?.email || '',
                phone: employee.User?.phone || '',
                address: employee.User?.address || '',
                dob: employee.User?.dob ? employee.User.dob.split('T')[0] : '',
                gender: employee.User?.gender || '',
                new_password: ''
            });
        }
    }, [employee]);

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        setSuccess('');

        try {
            // Update employee data
            const employeeResponse = await fetch(API_ROUTES.HR.EMPLOYEES_BY_ID(params.id as string), {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    employee_no: formData.employee_no,
                    employment_type: formData.employment_type,
                    status: formData.status,
                    hired_at: formData.hired_at,
                    terminated_at: formData.terminated_at,
                }),
            });

            const employeeResult = await employeeResponse.json();

            if (!employeeResult.success) {
                throw new Error(employeeResult.error || 'Failed to update employee');
            }

            // Update user data if there are changes or new password
            if (formData.new_password ||
                formData.full_name !== employee?.User?.full_name ||
                formData.email !== employee?.User?.email ||
                formData.phone !== employee?.User?.phone ||
                formData.address !== employee?.User?.address ||
                formData.dob !== (employee?.User?.dob ? employee.User.dob.split('T')[0] : '') ||
                formData.gender !== employee?.User?.gender) {

                const userResponse = await fetch(API_ROUTES.HR.USERS_BY_ID(employee?.User?.id || ''), {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        full_name: formData.full_name,
                        email: formData.email,
                        phone: formData.phone,
                        address: formData.address,
                        dob: formData.dob,
                        gender: formData.gender,
                        new_password: formData.new_password || undefined,
                    }),
                });

                const userResult = await userResponse.json();

                if (!userResult.success) {
                    throw new Error(userResult.error || 'Failed to update user info');
                }
            }

            setSuccess('Cập nhật thông tin nhân viên thành công!');
            setTimeout(() => {
                router.push(HR_ROUTES.EMPLOYEES_DETAIL(params.id as string));
            }, 1500);
        } catch (error) {
            console.error('Error updating employee:', error);
            setError(error instanceof Error ? error.message : 'Lỗi khi cập nhật thông tin nhân viên');
        } finally {
            setSaving(false);
        }
    };

    if (status === 'loading' || loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    if (!session) {
        return null;
    }

    if (!employee) {
        return (
            <Alert severity="warning" sx={{ mb: 2 }}>
                Không tìm thấy nhân viên
            </Alert>
        );
    }

    return (
        <Box>
            <Box display="flex" alignItems="center" mb={3}>
                <Button
                    startIcon={<ArrowBackIcon />}
                    onClick={() => router.push(HR_ROUTES.EMPLOYEES_DETAIL(params.id as string))}
                    sx={{ mr: 2 }}
                >
                    Quay lại
                </Button>
                <Typography variant="h4" component="h1">
                    Chỉnh sửa nhân viên
                </Typography>
            </Box>

            {success && (
                <Alert severity="success" sx={{ mb: 2 }}>
                    {success}
                </Alert>
            )}

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            <form onSubmit={handleSubmit}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {/* Employee Information Card */}
                    <Card>
                        <CardContent>
                            <Typography variant="h6" color="primary" gutterBottom>
                                Thông tin nhân viên
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <TextField
                                    fullWidth
                                    label="Mã nhân viên"
                                    value={formData.employee_no}
                                    onChange={(e) => handleInputChange('employee_no', e.target.value)}
                                />
                                <FormControl fullWidth>
                                    <InputLabel>Loại nhân viên</InputLabel>
                                    <Select
                                        value={formData.employment_type}
                                        onChange={(e) => handleInputChange('employment_type', e.target.value)}
                                        label="Loại nhân viên"
                                    >
                                        <MenuItem value="full-time">Full-time</MenuItem>
                                        <MenuItem value="part-time">Part-time</MenuItem>
                                        <MenuItem value="contract">Contract</MenuItem>
                                        <MenuItem value="intern">Intern</MenuItem>
                                    </Select>
                                </FormControl>
                                <FormControl fullWidth>
                                    <InputLabel>Trạng thái</InputLabel>
                                    <Select
                                        value={formData.status}
                                        onChange={(e) => handleInputChange('status', e.target.value)}
                                        label="Trạng thái"
                                    >
                                        <MenuItem value="ACTIVE">Active</MenuItem>
                                        <MenuItem value="INACTIVE">Inactive</MenuItem>
                                        <MenuItem value="TERMINATED">Terminated</MenuItem>
                                    </Select>
                                </FormControl>
                                <TextField
                                    fullWidth
                                    label="Ngày tuyển dụng"
                                    type="date"
                                    value={formData.hired_at}
                                    onChange={(e) => handleInputChange('hired_at', e.target.value)}
                                    InputLabelProps={{ shrink: true }}
                                />
                                <TextField
                                    fullWidth
                                    label="Ngày nghỉ việc"
                                    type="date"
                                    value={formData.terminated_at}
                                    onChange={(e) => handleInputChange('terminated_at', e.target.value)}
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Box>
                        </CardContent>
                    </Card>

                    {/* User Information Card */}
                    <Card>
                        <CardContent>
                            <Typography variant="h6" color="success.main" gutterBottom>
                                Thông tin người dùng
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <TextField
                                    fullWidth
                                    label="Họ và tên"
                                    value={formData.full_name}
                                    onChange={(e) => handleInputChange('full_name', e.target.value)}
                                    required
                                />
                                <TextField
                                    fullWidth
                                    label="Email"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => handleInputChange('email', e.target.value)}
                                    required
                                />
                                <TextField
                                    fullWidth
                                    label="Số điện thoại"
                                    value={formData.phone}
                                    onChange={(e) => handleInputChange('phone', e.target.value)}
                                />
                                <TextField
                                    fullWidth
                                    label="Ngày sinh"
                                    type="date"
                                    value={formData.dob}
                                    onChange={(e) => handleInputChange('dob', e.target.value)}
                                    InputLabelProps={{ shrink: true }}
                                />
                                <FormControl fullWidth>
                                    <InputLabel>Giới tính</InputLabel>
                                    <Select
                                        value={formData.gender}
                                        onChange={(e) => handleInputChange('gender', e.target.value)}
                                        label="Giới tính"
                                    >
                                        <MenuItem value="male">Nam</MenuItem>
                                        <MenuItem value="female">Nữ</MenuItem>
                                        <MenuItem value="other">Khác</MenuItem>
                                    </Select>
                                </FormControl>
                                <TextField
                                    fullWidth
                                    label="Địa chỉ"
                                    multiline
                                    rows={3}
                                    value={formData.address}
                                    onChange={(e) => handleInputChange('address', e.target.value)}
                                />
                            </Box>
                        </CardContent>
                    </Card>

                    {/* Password Reset Card */}
                    <Card>
                        <CardContent>
                            <Typography variant="h6" color="warning.main" gutterBottom>
                                Đặt lại mật khẩu
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <TextField
                                    fullWidth
                                    label="Mật khẩu mới"
                                    type="password"
                                    value={formData.new_password}
                                    onChange={(e) => handleInputChange('new_password', e.target.value)}
                                    helperText="Để trống nếu không muốn thay đổi mật khẩu"
                                />
                            </Box>
                        </CardContent>
                    </Card>
                </Box>

                <Box mt={3} display="flex" gap={2}>
                    <Button
                        type="submit"
                        variant="contained"
                        disabled={saving}
                        startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
                    >
                        {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                    </Button>
                    <Button
                        variant="outlined"
                        onClick={() => router.push(HR_ROUTES.EMPLOYEES_DETAIL(params.id as string))}
                    >
                        Hủy
                    </Button>
                </Box>
            </form>
        </Box>
    );
}