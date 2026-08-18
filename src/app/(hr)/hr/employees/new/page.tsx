'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { useCreateEmployee } from '@/features/hr';

export default function NewEmployeePage() {
    const router = useRouter();
    const { data: session, status } = useSession();
    const { mutateAsync: createEmployee } = useCreateEmployee();
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [formData, setFormData] = useState({
        // Employee fields
        employee_no: '',
        employment_type: '',
        status: 'ACTIVE',
        hired_at: '',
        terminated_at: '',

        // User fields
        username: '',
        email: '',
        password: '',
        full_name: '',
        phone: '',
        address: '',
        dob: '',
        gender: '',
    });

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
            // Create user first
            const userResponse = await fetch(API_ROUTES.HR.USERS, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: formData.username,
                    email: formData.email,
                    password: formData.password,
                    full_name: formData.full_name,
                    phone: formData.phone,
                    address: formData.address,
                    dob: formData.dob,
                    gender: formData.gender,
                }),
            });

            const userResult = await userResponse.json();

            if (!userResult.success) {
                throw new Error(userResult.error || 'Failed to create user');
            }

            // Create employee
            await createEmployee({
                user_id: userResult.data.id,
                employee_no: formData.employee_no,
                employment_type: formData.employment_type,
                status: formData.status,
                hired_at: formData.hired_at,
                terminated_at: formData.terminated_at,
            });

            setSuccess('Tạo nhân viên mới thành công!');
            setTimeout(() => {
                router.push(HR_ROUTES.EMPLOYEES);
            }, 1500);
        } catch (error) {
            console.error('Error creating employee:', error);
            setError(error instanceof Error ? error.message : 'Lỗi khi tạo nhân viên mới');
        } finally {
            setSaving(false);
        }
    };

    if (status === 'loading') {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    if (!session) {
        return null;
    }

    return (
        <Box sx={{ p: 3 }}>
            {/* Header */}
            <Box display="flex" alignItems="center" mb={3}>
                <Button
                    startIcon={<ArrowBackIcon />}
                    onClick={() => router.push(HR_ROUTES.EMPLOYEES)}
                    sx={{ mr: 2 }}
                >
                    Quay lại
                </Button>
                <Typography variant="h4" component="h1">
                    Thêm nhân viên mới
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
                    {/* User Information Card */}
                    <Card>
                        <CardContent>
                            <Typography variant="h6" color="primary" gutterBottom>
                                Thông tin tài khoản
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <TextField
                                    fullWidth
                                    label="Username"
                                    value={formData.username}
                                    onChange={(e) => handleInputChange('username', e.target.value)}
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
                                    label="Mật khẩu"
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => handleInputChange('password', e.target.value)}
                                    required
                                />
                                <TextField
                                    fullWidth
                                    label="Họ và tên"
                                    value={formData.full_name}
                                    onChange={(e) => handleInputChange('full_name', e.target.value)}
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

                    {/* Employee Information Card */}
                    <Card>
                        <CardContent>
                            <Typography variant="h6" color="success.main" gutterBottom>
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
                </Box>

                <Box mt={3} display="flex" gap={2}>
                    <Button
                        type="submit"
                        variant="contained"
                        disabled={saving}
                        startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
                    >
                        {saving ? 'Đang tạo...' : 'Tạo nhân viên'}
                    </Button>
                    <Button
                        variant="outlined"
                        onClick={() => router.push(HR_ROUTES.EMPLOYEES)}
                    >
                        Hủy
                    </Button>
                </Box>
            </form>
        </Box>
    );
}
