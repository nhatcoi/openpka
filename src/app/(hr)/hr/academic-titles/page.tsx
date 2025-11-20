'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
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
    Stack,
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    School as SchoolIcon,
} from '@mui/icons-material';
import { HR_ROUTES, API_ROUTES } from '@/constants/routes';
import HrSearchBar from '@/components/hr/HrSearchBar';

interface AcademicTitle {
    id: string;
    code: string;
    title: string;
}

export default function AcademicTitlesPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    const [academicTitles, setAcademicTitles] = useState<AcademicTitle[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [editingTitle, setEditingTitle] = useState<AcademicTitle | null>(null);
    const [formData, setFormData] = useState({
        code: '',
        title: '',
    });
    const [searchTerm, setSearchTerm] = useState('');

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
            const response = await fetch(API_ROUTES.HR.ACADEMIC_TITLES);
            const result = await response.json();

            if (result.success) {
                setAcademicTitles(result.data);
            } else {
                setError(result.error || 'Failed to fetch academic titles');
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

    const handleOpenDialog = (title?: AcademicTitle) => {
        if (title) {
            setEditingTitle(title);
            setFormData({
                code: title.code,
                title: title.title,
            });
        } else {
            setEditingTitle(null);
            setFormData({
                code: '',
                title: '',
            });
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditingTitle(null);
        setFormData({
            code: '',
            title: '',
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const url = editingTitle
                ? API_ROUTES.HR.ACADEMIC_TITLES_BY_ID(editingTitle.id)
                : API_ROUTES.HR.ACADEMIC_TITLES;

            const method = editingTitle ? 'PUT' : 'POST';

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
                setError(result.error || 'Failed to save academic title');
            }
        } catch (err) {
            setError('Network error occurred');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Bạn có chắc chắn muốn xóa học hàm học vị này?')) {
            return;
        }

        try {
            const response = await fetch(API_ROUTES.HR.ACADEMIC_TITLES_BY_ID(id), {
                method: 'DELETE',
            });

            const result = await response.json();

            if (result.success) {
                await fetchData();
            } else {
                setError(result.error || 'Failed to delete academic title');
            }
        } catch (err) {
            setError('Network error occurred');
        }
    };

    const filteredAcademicTitles = useMemo(() => {
        if (!searchTerm.trim()) return academicTitles;
        const term = searchTerm.trim().toLowerCase();
        return academicTitles.filter((title) =>
            [title.code, title.title].some((value) => value?.toLowerCase().includes(term))
        );
    }, [academicTitles, searchTerm]);

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <Stack
                direction={{ xs: 'column', md: 'row' }}
                justifyContent="space-between"
                alignItems={{ xs: 'flex-start', md: 'center' }}
                gap={2}
                mb={2}
            >
                <Box display="flex" alignItems="center" gap={2}>
                    <SchoolIcon color="primary" sx={{ fontSize: 32 }} />
                    <Typography variant="h4" component="h1">
                        Quản lý Học hàm Học vị
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenDialog()}
                >
                    Thêm học hàm học vị
                </Button>
            </Stack>

            <Box sx={{ maxWidth: 420, mb: 3 }}>
                <HrSearchBar
                    value={searchTerm}
                    onChange={setSearchTerm}
                    placeholder="Tìm kiếm theo mã hoặc tên học hàm học vị"
                />
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
                            <TableCell>Mã</TableCell>
                            <TableCell>Tên học hàm học vị</TableCell>
                            <TableCell align="center">Thao tác</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredAcademicTitles.length > 0 ? (
                            filteredAcademicTitles.map((title) => (
                                <TableRow key={title.id}>
                                    <TableCell>
                                        <Chip label={title.code} color="primary" variant="outlined" />
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body1" fontWeight="medium">
                                            {title.title}
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="center">
                                        <IconButton
                                            size="small"
                                            color="primary"
                                            onClick={() => handleOpenDialog(title)}
                                            title="Chỉnh sửa"
                                        >
                                            <EditIcon />
                                        </IconButton>
                                        <IconButton
                                            size="small"
                                            color="error"
                                            onClick={() => handleDelete(title.id)}
                                            title="Xóa"
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={3} align="center" sx={{ py: 4 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        {searchTerm.trim()
                                            ? 'Không tìm thấy học hàm học vị phù hợp'
                                            : 'Chưa có học hàm học vị nào'}
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
                <DialogTitle>
                    {editingTitle ? 'Chỉnh sửa học hàm học vị' : 'Thêm học hàm học vị mới'}
                </DialogTitle>
                <form onSubmit={handleSubmit}>
                    <DialogContent>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
                            <TextField
                                fullWidth
                                label="Mã học hàm học vị"
                                value={formData.code}
                                onChange={(e) => handleInputChange('code', e.target.value)}
                                placeholder="VD: GS, PGS, TS, ThS"
                                required
                            />

                            <TextField
                                fullWidth
                                label="Tên học hàm học vị"
                                value={formData.title}
                                onChange={(e) => handleInputChange('title', e.target.value)}
                                placeholder="VD: Giáo sư, Phó Giáo sư, Tiến sĩ, Thạc sĩ"
                                required
                            />
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseDialog}>
                            Hủy
                        </Button>
                        <Button type="submit" variant="contained">
                            {editingTitle ? 'Cập nhật' : 'Thêm mới'}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>
        </Box>
    );
}
