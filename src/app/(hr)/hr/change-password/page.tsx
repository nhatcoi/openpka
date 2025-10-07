'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
    Box,
    Paper,
    Typography,
    TextField,
    Button,
    Alert,
    CircularProgress,
} from '@mui/material';
import { ArrowBack as ArrowBackIcon, Save as SaveIcon } from '@mui/icons-material';
import { HR_ROUTES } from '@/constants/routes';

export default function ChangePasswordPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [formData, setFormData] = useState({
        current_password: '',
        new_password: '',
        confirm_password: '',
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

        if (formData.new_password !== formData.confirm_password) {
            setError('Mật khẩu mới và xác nhận mật khẩu không khớp');
            setSaving(false);
            return;
        }

        if (formData.new_password.length < 6) {
            setError('Mật khẩu mới phải có ít nhất 6 ký tự');
            setSaving(false);
            return;
        }

        try {
            const response = await fetch('/api/auth/verify-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    current_password: formData.current_password,
                }),
            });

            const result = await response.json();

            if (!result.success) {
                setError('Mật khẩu hiện tại không đúng');
                setSaving(false);
                return;
            }

            // Update password
            const updateResponse = await fetch(`/api/hr/users/${(session?.user as { id?: string })?.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    new_password: formData.new_password,
                }),
            });

            const updateResult = await updateResponse.json();

            if (updateResult.success) {
                setSuccess('Đổi mật khẩu thành công!');
                setFormData({
                    current_password: '',
                    new_password: '',
                    confirm_password: '',
                });
            } else {
                setError(updateResult.error || 'Có lỗi xảy ra khi đổi mật khẩu');
            }
        } catch (error) {
            console.error('Error changing password:', error);
            setError('Lỗi khi đổi mật khẩu');
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
                    Đổi mật khẩu
                </Typography>
            </Box>

            <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                    Thay đổi mật khẩu
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
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField
                            fullWidth
                            label="Mật khẩu hiện tại"
                            type="password"
                            value={formData.current_password}
                            onChange={(e) => handleInputChange('current_password', e.target.value)}
                            required
                        />

                        <TextField
                            fullWidth
                            label="Mật khẩu mới"
                            type="password"
                            value={formData.new_password}
                            onChange={(e) => handleInputChange('new_password', e.target.value)}
                            required
                            helperText="Mật khẩu phải có ít nhất 6 ký tự"
                        />

                        <TextField
                            fullWidth
                            label="Xác nhận mật khẩu mới"
                            type="password"
                            value={formData.confirm_password}
                            onChange={(e) => handleInputChange('confirm_password', e.target.value)}
                            required
                        />
                    </Box>

                    <Box mt={3} display="flex" gap={2}>
                        <Button
                            type="submit"
                            variant="contained"
                            disabled={saving}
                            startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
                        >
                            {saving ? 'Đang lưu...' : 'Đổi mật khẩu'}
                        </Button>

                        <Button
                            variant="outlined"
                            onClick={() => router.back()}
                        >
                            Hủy
                        </Button>
                    </Box>
                </form>
            </Paper>
        </Box>
    );
}
