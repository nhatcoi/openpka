'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useConfirmDialog } from '@/components/dialogs/confirm-dialog-provider';
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
    School as SchoolIcon
} from '@mui/icons-material';
import {
    useQualifications,
    useCreateQualification,
    useUpdateQualification,
    useDeleteQualification,
    Qualification,
    HrSearchBar
} from '@/features/hr';

export default function QualificationsPage() {
    const { data: session, status } = useSession();
    const confirmDialog = useConfirmDialog();
    const router = useRouter();

    const { data: qualifications = [], isLoading: loading, error: queryError } = useQualifications();
    const { mutateAsync: createQualification } = useCreateQualification();
    const { mutateAsync: updateQualification } = useUpdateQualification();
    const { mutateAsync: deleteQualification } = useDeleteQualification();

    const [actionError, setActionError] = useState<string | null>(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [editingQualification, setEditingQualification] = useState<Qualification | null>(null);
    const [formData, setFormData] = useState({
        code: '',
        title: ''
    });
    const [saving, setSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (status === 'loading') return;
        if (!session) {
            router.push('/auth/signin');
        }
    }, [session, status, router]);

    const error = actionError || (queryError ? (queryError as Error).message : null);

    const handleOpenDialog = (qualification?: Qualification) => {
        if (qualification) {
            setEditingQualification(qualification);
            setFormData({
                code: qualification.code,
                title: qualification.title
            });
        } else {
            setEditingQualification(null);
            setFormData({
                code: '',
                title: ''
            });
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditingQualification(null);
        setFormData({
            code: '',
            title: ''
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.code || !formData.title) {
            setActionError('Vui lòng điền đầy đủ thông tin');
            return;
        }

        try {
            setSaving(true);
            setActionError(null);
            if (editingQualification) {
                await updateQualification({ id: editingQualification.id, data: formData });
            } else {
                await createQualification(formData);
            }
            handleCloseDialog();
        } catch (err: any) {
            setActionError(err.message || 'Lỗi khi lưu bằng cấp');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        const confirmed = await confirmDialog({
            title: 'Xóa bằng cấp',
            message: 'Bạn có chắc chắn muốn xóa bằng cấp này?',
            confirmText: 'Xóa',
            cancelText: 'Hủy',
            destructive: true,
        });
        if (!confirmed) {
            return;
        }

        try {
            setActionError(null);
            await deleteQualification(id);
        } catch (err: any) {
            setActionError(err.message || 'Lỗi khi xóa bằng cấp');
        }
    };

    const filteredQualifications = useMemo(() => {
        if (!searchTerm.trim()) return qualifications;
        const term = searchTerm.trim().toLowerCase();
        return qualifications.filter((qualification) =>
            [qualification.code, qualification.title].some((value) =>
                value?.toLowerCase().includes(term)
            )
        );
    }, [qualifications, searchTerm]);

    if (status === 'loading' || loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
                <Typography variant="h6" sx={{ ml: 2 }}>
                    Đang tải danh sách bằng cấp...
                </Typography>
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
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <SchoolIcon sx={{ mr: 2, fontSize: 32, color: 'primary.main' }} />
                    <Typography variant="h4" component="h1">
                        Quản lý Bằng cấp
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenDialog()}
                >
                    Thêm bằng cấp
                </Button>
            </Stack>

            <Box sx={{ maxWidth: 420, mb: 3 }}>
                <HrSearchBar
                    value={searchTerm}
                    onChange={setSearchTerm}
                    placeholder="Tìm kiếm theo mã hoặc tên bằng cấp"
                />
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setActionError(null)}>
                    {error}
                </Alert>
            )}

            <Paper sx={{ width: '100%', overflow: 'hidden' }}>
                <TableContainer>
                    <Table stickyHeader>
                        <TableHead>
                            <TableRow>
                                <TableCell><strong>Mã bằng cấp</strong></TableCell>
                                <TableCell><strong>Tên bằng cấp</strong></TableCell>
                                <TableCell><strong>Hành động</strong></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredQualifications.length > 0 ? (
                                filteredQualifications.map((qualification) => (
                                    <TableRow key={qualification.id} hover>
                                        <TableCell>
                                            <Chip
                                                label={qualification.code}
                                                color="primary"
                                                variant="outlined"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body1" fontWeight="medium">
                                                {qualification.title}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', gap: 1 }}>
                                                <IconButton
                                                    size="small"
                                                    color="primary"
                                                    onClick={() => handleOpenDialog(qualification)}
                                                >
                                                    <EditIcon />
                                                </IconButton>
                                                <IconButton
                                                    size="small"
                                                    color="error"
                                                    onClick={() => handleDelete(qualification.id)}
                                                >
                                                    <DeleteIcon />
                                                </IconButton>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={3} align="center" sx={{ py: 4 }}>
                                        <Typography variant="body2" color="text.secondary">
                                            {searchTerm.trim()
                                                ? 'Không tìm thấy bằng cấp phù hợp'
                                                : 'Chưa có bằng cấp nào'}
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            {/* Dialog thêm/sửa bằng cấp */}
            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <form onSubmit={handleSubmit}>
                    <DialogTitle>
                        {editingQualification ? 'Sửa bằng cấp' : 'Thêm bằng cấp mới'}
                    </DialogTitle>
                    <DialogContent>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                            <TextField
                                fullWidth
                                label="Mã bằng cấp"
                                value={formData.code}
                                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                required
                                placeholder="VD: BSC, MSC, PHD"
                            />
                            <TextField
                                fullWidth
                                label="Tên bằng cấp"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                required
                                placeholder="VD: Cử nhân, Thạc sĩ, Tiến sĩ"
                            />
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseDialog} disabled={saving}>
                            Hủy
                        </Button>
                        <Button
                            type="submit"
                            variant="contained"
                            disabled={saving}
                            startIcon={saving ? <CircularProgress size={20} /> : null}
                        >
                            {saving ? 'Đang lưu...' : (editingQualification ? 'Cập nhật' : 'Thêm mới')}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>
        </Box>
    );
}
