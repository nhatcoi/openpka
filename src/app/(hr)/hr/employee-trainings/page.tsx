'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useSession } from 'next-auth/react';
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
import { HR_ROUTES, API_ROUTES } from '@/constants/routes';
import HrSearchBar from '@/components/hr/HrSearchBar';

interface Employee {
    id: string;
    employee_no: string;
    user?: {
        id: string;
        full_name: string;
    };
}

interface Training {
    id: string;
    title: string;
    provider: string;
    start_date: string;
    end_date: string;
    training_type: string;
    description?: string;
}

interface EmployeeTraining {
    id: string;
    employee_id: string;
    training_id: string;
    status: string;
    completion_date?: string;
    certificate_url?: string;
    employees?: Employee;
    trainings?: Training;
}

const TRAINING_STATUS = [
    'enrolled',
    'in_progress',
    'completed',
    'cancelled',
    'failed'
];

const TRAINING_STATUS_LABELS = {
    enrolled: 'Đã đăng ký',
    in_progress: 'Đang tham gia',
    completed: 'Hoàn thành',
    cancelled: 'Đã hủy',
    failed: 'Không đạt'
};

const TRAINING_STATUS_COLORS = {
    enrolled: 'default',
    in_progress: 'warning',
    completed: 'success',
    cancelled: 'error',
    failed: 'error'
};

function EmployeeTrainingsPageContent() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const searchParams = useSearchParams();

    const [employeeTrainings, setEmployeeTrainings] = useState<EmployeeTraining[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [trainings, setTrainings] = useState<Training[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
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
            return;
        }
        fetchData();
    }, [session, status, router, searchParams]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const employeeId = searchParams.get('employee_id');

            const [employeeTrainingsRes, employeesRes, trainingsRes] = await Promise.all([
                fetch(employeeId ? `${API_ROUTES.HR.EMPLOYEE_TRAININGS}?employee_id=${employeeId}` : API_ROUTES.HR.EMPLOYEE_TRAININGS),
                fetch(API_ROUTES.HR.EMPLOYEES),
                fetch(API_ROUTES.HR.TRAININGS)
            ]);

            const [employeeTrainingsResult, employeesResult, trainingsResult] = await Promise.all([
                employeeTrainingsRes.json(),
                employeesRes.json(),
                trainingsRes.json()
            ]);

            if (employeeTrainingsResult.success) {
                setEmployeeTrainings(employeeTrainingsResult.data);
            } else {
                setError(employeeTrainingsResult.error || 'Failed to fetch employee trainings');
            }

            if (employeesResult.success) {
                setEmployees(employeesResult.data);
            }

            if (trainingsResult.success) {
                setTrainings(trainingsResult.data);
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
            const url = editingTraining
                ? API_ROUTES.HR.EMPLOYEE_TRAININGS_BY_ID(editingTraining.id)
                : API_ROUTES.HR.EMPLOYEE_TRAININGS;

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
                setError(result.error || 'Failed to save employee training');
            }
        } catch (err) {
            setError('Network error occurred');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Bạn có chắc chắn muốn xóa đào tạo này?')) {
            return;
        }

        try {
            const response = await fetch(API_ROUTES.HR.EMPLOYEE_TRAININGS_BY_ID(id), {
                method: 'DELETE',
            });

            const result = await response.json();

            if (result.success) {
                await fetchData();
            } else {
                setError(result.error || 'Failed to delete employee training');
            }
        } catch (err) {
            setError('Network error occurred');
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
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
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
                                            color={TRAINING_STATUS_COLORS[training.status as keyof typeof TRAINING_STATUS_COLORS] as string}
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
                                                onClick={() => window.open(training.certificate_url, '_blank')}
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