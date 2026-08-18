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
    Link as LinkIcon,
} from '@mui/icons-material';
import { HR_ROUTES } from '@/constants/routes';
import {
    useEmployeeTrainings,
    useCreateEmployeeTraining,
    useUpdateEmployeeTraining,
    useDeleteEmployeeTraining,
    useTrainings,
    useEmployeeSearch,
    TRAINING_STATUS,
    TRAINING_STATUS_LABELS,
    TRAINING_STATUS_COLORS,
    EmployeeTraining,
    HrSearchBar
} from '@/features/hr';

function EmployeeTrainingsPageContent() {
    const { data: session, status } = useSession();
    const confirmDialog = useConfirmDialog();
    const router = useRouter();
    const searchParams = useSearchParams();

    const { data: employeeTrainings = [], isLoading: trainingsLoading, error: queryError } = useEmployeeTrainings();
    const { employees = [], loading: employeesLoading } = useEmployeeSearch();
    const { data: trainings = [], isLoading: mainTrainingsLoading } = useTrainings();
    const { mutateAsync: createEmployeeTraining } = useCreateEmployeeTraining();
    const { mutateAsync: updateEmployeeTraining } = useUpdateEmployeeTraining();
    const { mutateAsync: deleteEmployeeTraining } = useDeleteEmployeeTraining();

    const loading = trainingsLoading || employeesLoading || mainTrainingsLoading;
    const [actionError, setActionError] = useState<string | null>(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [editingTraining, setEditingTraining] = useState<EmployeeTraining | null>(null);
    const [formData, setFormData] = useState({
        employee_id: '',
        training_id: '',
        status: '',
        completion_date: '',
        certificate_url: '',
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

    const handleOpenDialog = (training?: EmployeeTraining) => {
        if (training) {
            setEditingTraining(training);
            setFormData({
                employee_id: training.employee_id,
                training_id: training.training_id,
                status: training.status,
                completion_date: training.completion_date || '',
                certificate_url: training.certificate_url || '',
            });
        } else {
            setEditingTraining(null);
            const employeeId = searchParams.get('employee_id');
            setFormData({
                employee_id: employeeId || '',
                training_id: '',
                status: '',
                completion_date: '',
                certificate_url: '',
            });
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditingTraining(null);
        const employeeId = searchParams.get('employee_id');
        setFormData({
            employee_id: employeeId || '',
            training_id: '',
            status: '',
            completion_date: '',
            certificate_url: '',
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            setActionError(null);
            if (editingTraining) {
                await updateEmployeeTraining({ id: editingTraining.id, data: formData });
            } else {
                await createEmployeeTraining(formData);
            }
            handleCloseDialog();
        } catch (err: any) {
            setActionError(err.message || 'Lỗi khi lưu thông tin đào tạo');
        }
    };

    const handleDelete = async (id: string) => {
        const confirmed = await confirmDialog({
            title: 'Xóa đào tạo',
            message: 'Bạn có chắc chắn muốn xóa đào tạo này?',
            confirmText: 'Xóa',
            cancelText: 'Hủy',
            destructive: true,
        });
        if (!confirmed) {
            return;
        }

        try {
            setActionError(null);
            await deleteEmployeeTraining(id);
        } catch (err: any) {
            setActionError(err.message || 'Lỗi khi xóa đào tạo');
        }
    };

    const getEmployeeName = (employeeId: string) => {
        const employee = employees.find(emp => emp.id === employeeId);
        return employee ? `${employee.User?.full_name} (${employee.employee_no})` : 'N/A';
    };

    const getTrainingName = (trainingId: string) => {
        const training = trainings.find(t => t.id === trainingId);
        return training ? training.title : 'N/A';
    };

    const filteredEmployee = searchParams.get('employee_id')
        ? employees.find(emp => emp.id === searchParams.get('employee_id'))
        : null;

    const filteredEmployeeTrainings = useMemo(() => {
        if (!searchTerm.trim()) return employeeTrainings;
        const term = searchTerm.trim().toLowerCase();
        return employeeTrainings.filter((training) => {
            const values = [
                getEmployeeName(training.employee_id),
                getTrainingName(training.training_id),
                TRAINING_STATUS_LABELS[training.status as keyof typeof TRAINING_STATUS_LABELS] || training.status,
                training.certificate_url,
            ];
            return values.some((value) => value?.toLowerCase().includes(term));
        });
    }, [employeeTrainings, searchTerm]);

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
                <Typography color="text.primary">Đào tạo</Typography>
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
                            Đào tạo của nhân viên
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
                    Thêm đào tạo
                </Button>
            </Stack>

            <Box sx={{ maxWidth: 420, mb: 3 }}>
                <HrSearchBar
                    value={searchTerm}
                    onChange={setSearchTerm}
                    placeholder="Tìm kiếm theo nhân viên, khóa đào tạo hoặc trạng thái"
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
                            <TableCell>Khóa đào tạo</TableCell>
                            <TableCell>Trạng thái</TableCell>
                            <TableCell>Ngày hoàn thành</TableCell>
                            <TableCell>Chứng chỉ</TableCell>
                            <TableCell align="center">Thao tác</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredEmployeeTrainings.length > 0 ? (
                            filteredEmployeeTrainings.map((training) => (
                                <TableRow key={training.id}>
                                    <TableCell>
                                        <Box display="flex" alignItems="center" gap={1}>
                                            <PersonIcon color="action" />
                                            <Typography variant="body2">
                                                {getEmployeeName(training.employee_id)}
                                            </Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" fontWeight="medium">
                                            {getTrainingName(training.training_id)}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={TRAINING_STATUS_LABELS[training.status as keyof typeof TRAINING_STATUS_LABELS] || training.status}
                                            color={TRAINING_STATUS_COLORS[training.status as keyof typeof TRAINING_STATUS_COLORS] || 'default'}
                                            variant="outlined"
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2">
                                            {training.completion_date
                                                ? new Date(training.completion_date).toLocaleDateString('vi-VN')
                                                : '-'
                                            }
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        {training.certificate_url ? (
                                            <IconButton
                                                size="small"
                                                color="primary"
                                                onClick={() => window.open(training.certificate_url || '', '_blank')}
                                                title="Xem chứng chỉ"
                                            >
                                                <LinkIcon />
                                            </IconButton>
                                        ) : (
                                            <Typography variant="body2" color="text.secondary">
                                                -
                                            </Typography>
                                        )}
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
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        {searchTerm.trim()
                                            ? 'Không tìm thấy đào tạo nhân viên phù hợp'
                                            : 'Chưa có đào tạo nhân viên nào'}
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
                <DialogTitle>
                    {editingTraining ? 'Chỉnh sửa đào tạo' : 'Thêm đào tạo mới'}
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
                                <InputLabel>Khóa đào tạo</InputLabel>
                                <Select
                                    value={formData.training_id}
                                    onChange={(e) => handleInputChange('training_id', e.target.value)}
                                    label="Khóa đào tạo"
                                >
                                    {trainings.map((training) => (
                                        <MenuItem key={training.id} value={training.id}>
                                            {training.title} - {training.provider}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <FormControl fullWidth required>
                                <InputLabel>Trạng thái</InputLabel>
                                <Select
                                    value={formData.status}
                                    onChange={(e) => handleInputChange('status', e.target.value)}
                                    label="Trạng thái"
                                >
                                    {TRAINING_STATUS.map((status) => (
                                        <MenuItem key={status} value={status}>
                                            {TRAINING_STATUS_LABELS[status as keyof typeof TRAINING_STATUS_LABELS]}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <TextField
                                fullWidth
                                label="Ngày hoàn thành"
                                type="date"
                                value={formData.completion_date}
                                onChange={(e) => handleInputChange('completion_date', e.target.value)}
                                InputLabelProps={{
                                    shrink: true,
                                }}
                            />

                            <TextField
                                fullWidth
                                label="URL chứng chỉ"
                                value={formData.certificate_url}
                                onChange={(e) => handleInputChange('certificate_url', e.target.value)}
                                placeholder="https://example.com/certificate.pdf"
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


export default function EmployeeTrainingsPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <EmployeeTrainingsPageContent />
        </Suspense>
    );
}