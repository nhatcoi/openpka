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
    Breadcrumbs,
    Link,
    Stack,
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    School as SchoolIcon,
    Person as PersonIcon,
} from '@mui/icons-material';
import { HR_ROUTES } from '@/constants/routes';
import {
    useEmployeeAcademicTitles,
    useCreateEmployeeAcademicTitle,
    useUpdateEmployeeAcademicTitle,
    useDeleteEmployeeAcademicTitle,
    useAcademicTitles,
    useEmployeeSearch,
    EmployeeAcademicTitle,
    HrSearchBar
} from '@/features/hr';

function EmployeeAcademicTitlesPageContent() {
    const { data: session, status } = useSession();
    const confirmDialog = useConfirmDialog();
    const router = useRouter();
    const searchParams = useSearchParams();

    const { data: employeeAcademicTitles = [], isLoading: recordsLoading, error: queryError } = useEmployeeAcademicTitles();
    const { data: academicTitles = [], isLoading: titlesLoading } = useAcademicTitles();
    const { employees = [], loading: employeesLoading } = useEmployeeSearch();
    const { mutateAsync: createEmployeeAcademicTitle } = useCreateEmployeeAcademicTitle();
    const { mutateAsync: updateEmployeeAcademicTitle } = useUpdateEmployeeAcademicTitle();
    const { mutateAsync: deleteEmployeeAcademicTitle } = useDeleteEmployeeAcademicTitle();

    const loading = recordsLoading || titlesLoading || employeesLoading;
    const [actionError, setActionError] = useState<string | null>(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [editingTitle, setEditingTitle] = useState<EmployeeAcademicTitle | null>(null);
    const [formData, setFormData] = useState({
        employee_id: '',
        academic_title_id: '',
        awarded_date: '',
    });
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const employeeId = searchParams.get('employee_id');
        if (employeeId) {
            setFormData(prev => ({
                ...prev,
                employee_id: employeeId
            }));
        }
    }, [searchParams]);

    useEffect(() => {
        if (status === 'loading') return;
        if (!session) {
            router.push('/auth/signin');
        }
    }, [session, status, router]);

    const error = actionError || (queryError ? (queryError as Error).message : null);

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleOpenDialog = (title?: EmployeeAcademicTitle) => {
        if (title) {
            setEditingTitle(title);
            setFormData({
                employee_id: title.employee_id,
                academic_title_id: title.academic_title_id,
                awarded_date: (title.awarded_date || title.issued_date || '').split('T')[0],
            });
        } else {
            setEditingTitle(null);
            const employeeId = searchParams.get('employee_id');
            setFormData({
                employee_id: employeeId || '',
                academic_title_id: '',
                awarded_date: '',
            });
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditingTitle(null);
        const employeeId = searchParams.get('employee_id');
        setFormData({
            employee_id: employeeId || '',
            academic_title_id: '',
            awarded_date: '',
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            setActionError(null);
            if (editingTitle) {
                await updateEmployeeAcademicTitle({ id: editingTitle.id, data: formData });
            } else {
                await createEmployeeAcademicTitle(formData);
            }
            handleCloseDialog();
        } catch (err: any) {
            setActionError(err.message || 'Lỗi khi lưu học hàm học vị');
        }
    };

    const handleDelete = async (id: string) => {
        const confirmed = await confirmDialog({
            title: 'Xóa học hàm học vị',
            message: 'Bạn có chắc chắn muốn xóa học hàm học vị này?',
            confirmText: 'Xóa',
            cancelText: 'Hủy',
            destructive: true,
        });
        if (!confirmed) {
            return;
        }

        try {
            setActionError(null);
            await deleteEmployeeAcademicTitle(id);
        } catch (err: any) {
            setActionError(err.message || 'Lỗi khi xóa học hàm học vị');
        }
    };

    const getEmployeeName = (employeeId: string) => {
        const employee = employees.find(emp => emp.id === employeeId);
        return employee ? `${employee.User?.full_name} (${employee.employee_no})` : 'N/A';
    };

    const getAcademicTitleName = (academicTitleId: string) => {
        const title = academicTitles.find(t => t.id === academicTitleId);
        return title ? `${title.title} (${title.code})` : 'N/A';
    };

    const filteredEmployee = searchParams.get('employee_id')
        ? employees.find(emp => emp.id === searchParams.get('employee_id'))
        : null;

    const filteredEmployeeAcademicTitles = useMemo(() => {
        if (!searchTerm.trim()) return employeeAcademicTitles;
        const term = searchTerm.trim().toLowerCase();
        return employeeAcademicTitles.filter((record) => {
            const values = [
                getEmployeeName(record.employee_id),
                getAcademicTitleName(record.academic_title_id),
                record.awarded_date,
            ];
            return values.some((value) => value?.toLowerCase().includes(term));
        });
    }, [employeeAcademicTitles, searchTerm]);

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <Breadcrumbs sx={{ mb: 2 }}>
                <Link color="inherit" href={HR_ROUTES.EMPLOYEES}>
                    Nhân viên
                </Link>
                {filteredEmployee && (
                    <Link color="inherit" href={HR_ROUTES.EMPLOYEES_DETAIL(filteredEmployee.id)}>
                        {filteredEmployee.User?.full_name}
                    </Link>
                )}
                <Typography color="text.primary">Học hàm học vị</Typography>
            </Breadcrumbs>

            <Stack
                direction={{ xs: 'column', md: 'row' }}
                justifyContent="space-between"
                alignItems={{ xs: 'flex-start', md: 'center' }}
                gap={2}
                mb={2}
            >
                <Box display="flex" alignItems="center" gap={2}>
                    <SchoolIcon color="primary" sx={{ fontSize: 32 }} />
                    <Box>
                        <Typography variant="h4" component="h1">
                            Học hàm học vị của nhân viên
                        </Typography>
                        {filteredEmployee && (
                            <Typography variant="subtitle1" color="text.secondary">
                                {filteredEmployee.User?.full_name} ({filteredEmployee.employee_no})
                            </Typography>
                        )}
                    </Box>
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
                    placeholder="Tìm kiếm theo nhân viên, học hàm học vị hoặc ngày được phong"
                />
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setActionError(null)}>
                    {error}
                </Alert>
            )}

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Nhân viên</TableCell>
                            <TableCell>Học hàm học vị</TableCell>
                            <TableCell>Ngày được phong</TableCell>
                            <TableCell align="center">Thao tác</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredEmployeeAcademicTitles.length > 0 ? (
                            filteredEmployeeAcademicTitles.map((title) => (
                                <TableRow key={title.id}>
                                    <TableCell>
                                        <Box display="flex" alignItems="center" gap={1}>
                                            <PersonIcon color="action" />
                                            <Typography variant="body2">
                                                {getEmployeeName(title.employee_id)}
                                            </Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={getAcademicTitleName(title.academic_title_id)}
                                            color="primary"
                                            variant="outlined"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2">
                                            {title.awarded_date || title.issued_date
                                                ? new Date(title.awarded_date || title.issued_date || '').toLocaleDateString('vi-VN')
                                                : '-'
                                            }
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
                                <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
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
                            <FormControl fullWidth required>
                                <InputLabel>Nhân viên</InputLabel>
                                <Select
                                    value={formData.employee_id}
                                    onChange={(e) => handleInputChange('employee_id', e.target.value)}
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
                                <InputLabel>Học hàm học vị</InputLabel>
                                <Select
                                    value={formData.academic_title_id}
                                    onChange={(e) => handleInputChange('academic_title_id', e.target.value)}
                                    label="Học hàm học vị"
                                >
                                    {academicTitles.map((title) => (
                                        <MenuItem key={title.id} value={title.id}>
                                            {title.title} ({title.code})
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <TextField
                                fullWidth
                                label="Ngày được phong"
                                type="date"
                                value={formData.awarded_date}
                                onChange={(e) => handleInputChange('awarded_date', e.target.value)}
                                InputLabelProps={{
                                    shrink: true,
                                }}
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

export default function EmployeeAcademicTitlesPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <EmployeeAcademicTitlesPageContent />
        </Suspense>
    );
}
