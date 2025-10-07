'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signIn } from 'next-auth/react';
import {
    Box,
    Paper,
    Typography,
    TextField,
    Button,
    Grid,
    Alert,
    CircularProgress,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
} from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { HR_ROUTES } from '@/constants/routes';

interface UserProfile {
    id: string;
    username: string;
    email: string;
    full_name: string;
    phone: string;
    address: string;
    dob: string;
    gender: string;
}

export default function ProfilePage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [profile, setProfile] = useState<UserProfile | null>(null);

    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        phone: '',
        address: '',
        dob: '',
        gender: '',
    });

    useEffect(() => {
        if (status === 'loading') return;

        if (!session) {
            signIn();
            return;
        }

        fetchProfile();
    }, [session, status]);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/hr/me');
            const result = await response.json();

            if (result.success && result.data) {
                const user = result.data.User;
                setProfile(user);
                setFormData({
                    full_name: user.full_name || '',
                    email: user.email || '',
                    phone: user.phone || '',
                    address: user.address || '',
                    dob: user.dob ? user.dob.split('T')[0] : '',
                    gender: user.gender || '',
                });
            } else {
                setError(result.error || 'Không thể tải thông tin cá nhân');
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
            setError('Lỗi khi tải thông tin cá nhân');
        } finally {
            setLoading(false);
        }
    };

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
            if (!session?.user?.id) {
                setError('Không tìm thấy thông tin người dùng');
                return;
            }

            const response = await fetch(`/api/hr/users/${(session.user as { id?: string }).id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const result = await response.json();

            if (result.success) {
                setSuccess('Cập nhật thông tin thành công!');
                // Refresh profile data
                await fetchProfile();
            } else {
                setError(result.error || 'Có lỗi xảy ra khi cập nhật thông tin');
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            setError('Lỗi khi cập nhật thông tin');
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

    return (
        <Box>
            <Box display="flex" alignItems="center" mb={3}>
                <Button
                    startIcon={<ArrowBackIcon />}
                    onClick={() => router.back()}
                    sx={{ mr: 2 }}
                >
                    Quay lại
                </Button>
                <Typography variant="h4" component="h1">
                    Thông tin cá nhân
                </Typography>
            </Box>

            <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                    Chỉnh sửa thông tin cá nhân
                </Typography>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                {success && (
                    <Alert severity="success" sx={{ mb: 2 }}>
                        {success}
                    </Alert>
                )}

                <form onSubmit={handleSubmit}>
                    <Box display="flex" flexDirection="column" gap={3}>
                        <Box display="flex" flexDirection="column" gap={3}>
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

                        <Box display="flex" gap={2}>
                            <Button
                                type="submit"
                                variant="contained"
                                disabled={saving}
                                startIcon={saving ? <CircularProgress size={20} /> : null}
                            >
                                {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                            </Button>
                        </Box>
                    </Box>
                </form>
            </Paper>
        </Box>
    );
}
