'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useConfirmDialog } from '@/components/dialogs/ConfirmDialogProvider';
import { useRouter } from 'next/navigation';
import {
    Box,
    Typography,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Alert,
    CircularProgress,
    Chip,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    School as SchoolIcon,
} from '@mui/icons-material';
import { HR_ROUTES, API_ROUTES } from '@/constants/routes';

interface Training {
    id: string;
    title: string;
    provider: string;
    start_date: string;
    end_date: string;
    training_type: string;
    description?: string;
}

const TRAINING_TYPES = [
    'technical',
    'soft_skills',
    'leadership',
    'compliance',
    'safety',
    'other'
];

const TRAINING_TYPE_LABELS = {
    technical: 'Kỹ thuật',
    soft_skills: 'Kỹ năng mềm',
    leadership: 'Lãnh đạo',
    compliance: 'Tuân thủ',
    safety: 'An toàn',
    other: 'Khác'
};

export default function TrainingsPage() {
    const { data: session, status } = useSession();
    const confirmDialog = useConfirmDialog();
    const router = useRouter();

    const [trainings, setTrainings] = useState<Training[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [editingTraining, setEditingTraining] = useState<Training | null>(null);
    const [formData, setFormData] = useState({
        title: '',
        provider: '',
        start_date: '',
        end_date: '',
        training_type: '',
        description: '',
    });

    useEffect(() => {
        if (status === 'loading') return;
        if (!session) {
            router.push('/auth/signin');
            return;
        }
        fetchData();
    }, [session, status, router]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const response = await fetch(API_ROUTES.HR.TRAININGS);
            const result = await response.json();

            if (result.success) {
                setTrainings(result.data);
            } else {
                setError(result.error || 'Failed to fetch trainings');
            }
        } catch (err) {
            setError('Network error occurred');
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

    const handleOpenDialog = (training?: Training) => {
        if (training) {
            setEditingTraining(training);
            setFormData({
                title: training.title,
                provider: training.provider,
                start_date: training.start_date,
                end_date: training.end_date,
                training_type: training.training_type,
                description: training.description || '',
            });
        } else {
            setEditingTraining(null);
            setFormData({
                title: '',
                provider: '',
                start_date: '',
                end_date: '',
                training_type: '',
                description: '',
            });
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditingTraining(null);
        setFormData({
            title: '',
            provider: '',
            start_date: '',
            end_date: '',
            training_type: '',
            description: '',
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const url = editingTraining
                ? API_ROUTES.HR.TRAININGS_BY_ID(editingTraining.id)
                : API_ROUTES.HR.TRAININGS;

            const method = editingTraining ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const result = await response.json();

            if (result.success) {
                await fetchData();
                handleCloseDialog();
            } else {
                setError(result.error || 'Failed to save training');
            }
        } catch (err) {
            setError('Network error occurred');
        }
    };

    const handleDelete = async (id: string) => {
        const confirmed = await confirmDialog({
            title: 'Xóa khóa đào tạo',
            message: 'Bạn có chắc chắn muốn xóa khóa đào tạo này?',
            confirmText: 'Xóa',
            cancelText: 'Hủy',
            destructive: true,
        });
        if (!confirmed) {
            return;
        }

        try {
            const response = await fetch(API_ROUTES.HR.TRAININGS_BY_ID(id), {
                method: 'DELETE',
            });

            const result = await response.json();

            if (result.success) {
                await fetchData();
            } else {
                setError(result.error || 'Failed to delete training');
            }
        } catch (err) {
            setError('Network error occurred');
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
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Box display="flex" alignItems="center" gap={2}>
                    <SchoolIcon color="primary" sx={{ fontSize: 32 }} />
                    <Typography variant="h4" component="h1">
                        Quản lý Khóa Đào tạo
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenDialog()}
                >
                    Thêm khóa đào tạo
                </Button>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Tên khóa đào tạo</TableCell>
                            <TableCell>Nhà cung cấp</TableCell>
                            <TableCell>Loại đào tạo</TableCell>
                            <TableCell>Ngày bắt đầu</TableCell>
                            <TableCell>Ngày kết thúc</TableCell>
                            <TableCell align="center">Thao tác</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {trainings.map((training) => (
                            <TableRow key={training.id}>
                                <TableCell>
                                    <Typography variant="body1" fontWeight="medium">
                                        {training.title}
                                    </Typography>
                                    {training.description && (
                                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                            {training.description.length > 100
                                                ? `${training.description.substring(0, 100)}...`
                                                : training.description
                                            }
                                        </Typography>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <Typography variant="body2">
                                        {training.provider}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        label={TRAINING_TYPE_LABELS[training.training_type as keyof typeof TRAINING_TYPE_LABELS] || training.training_type}
                                        color="primary"
                                        variant="outlined"
                                        size="small"
                                    />
                                </TableCell>
                                <TableCell>
                                    <Typography variant="body2">
                                        {new Date(training.start_date).toLocaleDateString('vi-VN')}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Typography variant="body2">
                                        {new Date(training.end_date).toLocaleDateString('vi-VN')}
                                    </Typography>
                                </TableCell>
                                <TableCell align="center">
                                    <IconButton
                                        size="small"
                                        color="primary"
                                        onClick={() => handleOpenDialog(training)}
                                        title="Chỉnh sửa"
                                    >
                                        <EditIcon />
                                    </IconButton>
                                    <IconButton
                                        size="small"
                                        color="error"
                                        onClick={() => handleDelete(training.id)}
                                        title="Xóa"
                                    >
                                        <DeleteIcon />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
                <DialogTitle>
                    {editingTraining ? 'Chỉnh sửa khóa đào tạo' : 'Thêm khóa đào tạo mới'}
                </DialogTitle>
                <form onSubmit={handleSubmit}>
                    <DialogContent>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
                            <TextField
                                fullWidth
                                label="Tên khóa đào tạo"
                                value={formData.title}
                                onChange={(e) => handleInputChange('title', e.target.value)}
                                placeholder="VD: Khóa đào tạo React.js"
                                required
                            />

                            <TextField
                                fullWidth
                                label="Nhà cung cấp"
                                value={formData.provider}
                                onChange={(e) => handleInputChange('provider', e.target.value)}
                                placeholder="VD: Công ty ABC, Trường Đại học XYZ"
                                required
                            />

                            <FormControl fullWidth required>
                                <InputLabel>Loại đào tạo</InputLabel>
                                <Select
                                    value={formData.training_type}
                                    onChange={(e) => handleInputChange('training_type', e.target.value)}
                                    label="Loại đào tạo"
                                >
                                    {TRAINING_TYPES.map((type) => (
                                        <MenuItem key={type} value={type}>
                                            {TRAINING_TYPE_LABELS[type as keyof typeof TRAINING_TYPE_LABELS]}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <Box display="flex" gap={2}>
                                <TextField
                                    fullWidth
                                    label="Ngày bắt đầu"
                                    type="date"
                                    value={formData.start_date}
                                    onChange={(e) => handleInputChange('start_date', e.target.value)}
                                    InputLabelProps={{
                                        shrink: true,
                                    }}
                                    required
                                />

                                <TextField
                                    fullWidth
                                    label="Ngày kết thúc"
                                    type="date"
                                    value={formData.end_date}
                                    onChange={(e) => handleInputChange('end_date', e.target.value)}
                                    InputLabelProps={{
                                        shrink: true,
                                    }}
                                    required
                                />
                            </Box>

                            <TextField
                                fullWidth
                                label="Mô tả"
                                multiline
                                rows={3}
                                value={formData.description}
                                onChange={(e) => handleInputChange('description', e.target.value)}
                                placeholder="Mô tả chi tiết về khóa đào tạo..."
                            />
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseDialog}>
                            Hủy
                        </Button>
                        <Button type="submit" variant="contained">
                            {editingTraining ? 'Cập nhật' : 'Thêm mới'}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>
        </Box>
    );
}
