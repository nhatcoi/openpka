'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useConfirmDialog } from '@/components/dialogs/confirm-dialog-provider';
import { useRouter, useSearchParams } from 'next/navigation';
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
    Autocomplete,
    Stack,
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    School as SchoolIcon,
    Person as PersonIcon
} from '@mui/icons-material';
import { HR_ROUTES } from '@/constants/routes';
import {
    useEmployeeQualifications,
    useCreateEmployeeQualification,
    useUpdateEmployeeQualification,
    useDeleteEmployeeQualification,
    useQualifications,
    useEmployeeSearch,
    EmployeeQualification,
    HrSearchBar
} from '@/features/hr';

function EmployeeQualificationsPageContent() {
    const { data: session, status } = useSession();
    const confirmDialog = useConfirmDialog();
    const router = useRouter();
    const searchParams = useSearchParams();

    const { data: employeeQualifications = [], isLoading: recordsLoading, error: queryError } = useEmployeeQualifications();
    const { data: qualifications = [], isLoading: qualificationsLoading } = useQualifications();
    const { employees = [], loading: employeesLoading } = useEmployeeSearch();
    const { mutateAsync: createEmployeeQualification } = useCreateEmployeeQualification();
    const { mutateAsync: updateEmployeeQualification } = useUpdateEmployeeQualification();
    const { mutateAsync: deleteEmployeeQualification } = useDeleteEmployeeQualification();

    const loading = recordsLoading || qualificationsLoading || employeesLoading;
    const [actionError, setActionError] = useState<string | null>(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [editingRecord, setEditingRecord] = useState<EmployeeQualification | null>(null);
    const [formData, setFormData] = useState({
        employee_id: '',
        qualification_id: '',
        major_field: '',
        institution: '',
        awarded_date: ''
    });
    const [saving, setSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (status === 'loading') return;
        if (!session) {
            router.push('/auth/signin');
        }
    }, [session, status, router]);

    useEffect(() => {
        // Check for employee_id in URL params and pre-fill form data
        const employeeId = searchParams.get('employee_id');
        if (employeeId) {
            setFormData(prev => ({
                ...prev,
                employee_id: employeeId
            }));
        }
    }, [searchParams]);

    const error = actionError || (queryError ? (queryError as Error).message : null);

    const handleOpenDialog = (record?: EmployeeQualification) => {
        if (record) {
            setEditingRecord(record);
            setFormData({
                employee_id: record.employee_id,
                qualification_id: record.qualification_id,
                major_field: record.major_field || record.field_of_study || '',
                institution: record.institution || record.issued_by || '',
                awarded_date: (record.awarded_date || record.issued_date || '').split('T')[0]
            });
        } else {
            setEditingRecord(null);
            setFormData({
                employee_id: searchParams.get('employee_id') || '',
                qualification_id: '',
                major_field: '',
                institution: '',
                awarded_date: ''
            });
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditingRecord(null);
        setFormData({
            employee_id: searchParams.get('employee_id') || '',
            qualification_id: '',
            major_field: '',
            institution: '',
            awarded_date: ''
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.employee_id || !formData.qualification_id || !formData.major_field || !formData.institution || !formData.awarded_date) {
            setActionError('Vui lòng điền đầy đủ thông tin');
            return;
        }

        try {
            setSaving(true);
            setActionError(null);
            if (editingRecord) {
                await updateEmployeeQualification({ id: editingRecord.id, data: formData });
            } else {
                await createEmployeeQualification(formData);
            }
            handleCloseDialog();
        } catch (err: any) {
            setActionError(err.message || 'Lỗi khi lưu thông tin');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        const confirmed = await confirmDialog({
            title: 'Xóa thông tin bằng cấp',
            message: 'Bạn có chắc chắn muốn xóa thông tin bằng cấp này?',
            confirmText: 'Xóa',
            cancelText: 'Hủy',
            destructive: true,
        });
        if (!confirmed) {
            return;
        }

        try {
            setActionError(null);
            await deleteEmployeeQualification(id);
        } catch (err: any) {
            setActionError(err.message || 'Lỗi khi xóa thông tin');
        }
    };

    const filteredEmployeeQualifications = useMemo(() => {
        if (!searchTerm.trim()) return employeeQualifications;
        const term = searchTerm.trim().toLowerCase();
        return employeeQualifications.filter((record) => {
            const values = [
                record.Employee?.User?.full_name,
                record.Employee?.employee_no,
                record.Qualification?.title,
                record.Qualification?.code,
                record.major_field,
                record.institution,
            ];
            return values.some((value) => value?.toLowerCase().includes(term));
        });
    }, [employeeQualifications, searchTerm]);

    if (status === 'loading' || loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
                <Typography variant="h6" sx={{ ml: 2 }}>
                    Đang tải danh sách bằng cấp nhân viên...
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
                    <PersonIcon sx={{ mr: 2, fontSize: 32, color: 'primary.main' }} />
                    <Box>
                        <Typography variant="h4" component="h1">
                            Bằng cấp Nhân viên
                        </Typography>
                        {(() => {
                            const employeeId = searchParams.get('employee_id');
                            if (employeeId) {
                                const employee = employees.find(emp => emp.id === employeeId);
                                return (
                                    <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
                                        Lịch sử bằng cấp của: <strong>{employee?.User?.full_name || 'N/A'}</strong>
                                    </Typography>
                                );
                            }
                            return null;
                        })()}
                    </Box>
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
                    placeholder="Tìm kiếm theo nhân viên, bằng cấp, chuyên ngành hoặc tổ chức cấp"
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
                                <TableCell><strong>Nhân viên</strong></TableCell>
                                <TableCell><strong>Bằng cấp</strong></TableCell>
                                <TableCell><strong>Chuyên ngành</strong></TableCell>
                                <TableCell><strong>Tổ chức cấp</strong></TableCell>
                                <TableCell><strong>Ngày cấp</strong></TableCell>
                                <TableCell><strong>Hành động</strong></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredEmployeeQualifications.length > 0 ? (
                                filteredEmployeeQualifications.map((record) => (
                                    <TableRow key={record.id} hover>
                                        <TableCell>
                                            <Box>
                                                <Typography variant="body2" fontWeight="medium">
                                                    {record.Employee?.User?.full_name || 'N/A'}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {record.Employee?.employee_no || 'N/A'}
                                                </Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={record.Qualification?.title || 'N/A'}
                                                color="primary"
                                                variant="outlined"
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">
                                                {record.major_field || record.field_of_study || '-'}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">
                                                {record.institution || record.issued_by || '-'}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">
                                                {record.awarded_date || record.issued_date
                                                    ? new Date(record.awarded_date || record.issued_date || '').toLocaleDateString('vi-VN')
                                                    : '-'
                                                }
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', gap: 1 }}>
                                                <IconButton
                                                    size="small"
                                                    color="primary"
                                                    onClick={() => handleOpenDialog(record)}
                                                >
                                                    <EditIcon />
                                                </IconButton>
                                                <IconButton
                                                    size="small"
                                                    color="error"
                                                    onClick={() => handleDelete(record.id)}
                                                >
                                                    <DeleteIcon />
                                                </IconButton>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                                        <Typography variant="body2" color="text.secondary">
                                            {searchTerm.trim()
                                                ? 'Không tìm thấy bằng cấp nhân viên phù hợp'
                                                : 'Chưa có bằng cấp nhân viên nào'}
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            {/* Dialog thêm/sửa bằng cấp nhân viên */}
            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
                <form onSubmit={handleSubmit}>
                    <DialogTitle>
                        {editingRecord ? 'Sửa bằng cấp nhân viên' : 'Thêm bằng cấp nhân viên'}
                    </DialogTitle>
                    <DialogContent>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                            <FormControl fullWidth required>
                                <InputLabel>Nhân viên</InputLabel>
                                <Select
                                    value={formData.employee_id}
                                    onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                                    label="Nhân viên"
                                >
                                    {employees.map((employee) => (
                                        <MenuItem key={employee.id} value={employee.id}>
                                            {employee.User?.full_name} ({employee.employee_no})
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <FormControl fullWidth required>
                                <InputLabel>Bằng cấp</InputLabel>
                                <Select
                                    value={formData.qualification_id}
                                    onChange={(e) => setFormData({ ...formData, qualification_id: e.target.value })}
                                    label="Bằng cấp"
                                >
                                    {qualifications.map((qualification) => (
                                        <MenuItem key={qualification.id} value={qualification.id}>
                                            {qualification.title} ({qualification.code})
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <TextField
                                fullWidth
                                label="Chuyên ngành"
                                value={formData.major_field}
                                onChange={(e) => setFormData({ ...formData, major_field: e.target.value })}
                                required
                                placeholder="VD: Công nghệ thông tin, Quản trị kinh doanh"
                            />

                            <TextField
                                fullWidth
                                label="Tổ chức cấp bằng"
                                value={formData.institution}
                                onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                                required
                                placeholder="VD: Đại học Bách Khoa, Harvard University"
                            />

                            <TextField
                                fullWidth
                                label="Ngày cấp bằng"
                                type="date"
                                value={formData.awarded_date}
                                onChange={(e) => setFormData({ ...formData, awarded_date: e.target.value })}
                                required
                                InputLabelProps={{ shrink: true }}
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
                            {saving ? 'Đang lưu...' : (editingRecord ? 'Cập nhật' : 'Thêm mới')}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>
        </Box>
    );
}


export default function EmployeeQualificationsPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <EmployeeQualificationsPageContent />
        </Suspense>
    );
}