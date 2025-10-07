'use client';

import React, { useState, useEffect, Suspense } from 'react';
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
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    School as SchoolIcon,
    Person as PersonIcon,
} from '@mui/icons-material';
import { HR_ROUTES, API_ROUTES } from '@/constants/routes';

interface Employee {
    id: string;
    employee_no: string;
    user?: {
        id: string;
        full_name: string;
    };
}

interface AcademicTitle {
    id: string;
    code: string;
    title: string;
}

interface EmployeeAcademicTitle {
    id: string;
    employee_id: string;
    academic_title_id: string;
    awarded_date: string;
    employees?: Employee;
    academic_titles?: AcademicTitle;
}

function EmployeeAcademicTitlesPageContent() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const searchParams = useSearchParams();

    const [employeeAcademicTitles, setEmployeeAcademicTitles] = useState<EmployeeAcademicTitle[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [academicTitles, setAcademicTitles] = useState<AcademicTitle[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [editingTitle, setEditingTitle] = useState<EmployeeAcademicTitle | null>(null);
    const [formData, setFormData] = useState({
        employee_id: '',
        academic_title_id: '',
        awarded_date: '',
    });

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

            const [employeeAcademicTitlesRes, employeesRes, academicTitlesRes] = await Promise.all([
                fetch(employeeId ? `${API_ROUTES.HR.EMPLOYEE_ACADEMIC_TITLES}?employee_id=${employeeId}` : API_ROUTES.HR.EMPLOYEE_ACADEMIC_TITLES),
                fetch(API_ROUTES.HR.EMPLOYEES),
                fetch(API_ROUTES.HR.ACADEMIC_TITLES)
            ]);

            const [employeeAcademicTitlesResult, employeesResult, academicTitlesResult] = await Promise.all([
                employeeAcademicTitlesRes.json(),
                employeesRes.json(),
                academicTitlesRes.json()
            ]);

            if (employeeAcademicTitlesResult.success) {
                setEmployeeAcademicTitles(employeeAcademicTitlesResult.data);
            } else {
                setError(employeeAcademicTitlesResult.error || 'Failed to fetch employee academic titles');
            }

            if (employeesResult.success) {
                setEmployees(employeesResult.data);
            }

            if (academicTitlesResult.success) {
                setAcademicTitles(academicTitlesResult.data);
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

    const handleOpenDialog = (title?: EmployeeAcademicTitle) => {
        if (title) {
            setEditingTitle(title);
            setFormData({
                employee_id: title.employee_id,
                academic_title_id: title.academic_title_id,
                awarded_date: title.awarded_date,
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
            const url = editingTitle
                ? API_ROUTES.HR.EMPLOYEE_ACADEMIC_TITLES_BY_ID(editingTitle.id)
                : API_ROUTES.HR.EMPLOYEE_ACADEMIC_TITLES;

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
                setError(result.error || 'Failed to save employee academic title');
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
            const response = await fetch(API_ROUTES.HR.EMPLOYEE_ACADEMIC_TITLES_BY_ID(id), {
                method: 'DELETE',
            });

            const result = await response.json();

            if (result.success) {
                await fetchData();
            } else {
                setError(result.error || 'Failed to delete employee academic title');
            }
        } catch (err) {
            setError('Network error occurred');
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

            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
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
                            <TableCell>Học hàm học vị</TableCell>
                            <TableCell>Ngày được phong</TableCell>
                            <TableCell align="center">Thao tác</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {employeeAcademicTitles.map((title) => (
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
                                        {new Date(title.awarded_date).toLocaleDateString('vi-VN')}
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
                        ))}
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
