'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signIn } from 'next-auth/react';
import {
    Box,
    Paper,
    Typography,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    IconButton,
    Alert,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Grid,
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Visibility as ViewIcon,
} from '@mui/icons-material';
import { HR_ROUTES, API_ROUTES } from '@/constants/routes';

interface Assignment {
    id: string;
    employee_id: string;
    org_unit_id: string;
    position_id?: string;
    is_primary: boolean;
    assignment_type: string;
    allocation: string;
    start_date: string;
    end_date?: string;
    employee?: {
        id: string;
        employee_no?: string;
        user?: {
            full_name: string;
            email?: string;
        };
    };
    org_unit?: {
        id: string;
        name: string;
        code: string;
    };
}

export default function AssignmentsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [employees, setEmployees] = useState<{ id: string; name: string }[]>([]);
    const [orgUnits, setOrgUnits] = useState<{ id: string; name: string }[]>([]);

    useEffect(() => {
        if (status === 'loading') return;

        if (!session) {
            signIn();
            return;
        }

        fetchAssignments();
        fetchEmployees();
        fetchOrgUnits();
    }, [session, status]);

    const fetchAssignments = async () => {
        try {
            setLoading(true);
            const response = await fetch(API_ROUTES.HR.ASSIGNMENTS);
            const result = await response.json();

            if (result.success) {
                setAssignments(result.data);
            } else {
                setError('Không thể tải danh sách phân công');
            }
        } catch (error) {
            console.error('Error fetching assignments:', error);
            setError('Lỗi khi tải danh sách phân công');
        } finally {
            setLoading(false);
        }
    };

    const fetchEmployees = async () => {
        try {
            const response = await fetch(API_ROUTES.HR.EMPLOYEES);
            const result = await response.json();
            if (result.success) {
                setEmployees(result.data);
            }
        } catch (error) {
            console.error('Error fetching employees:', error);
        }
    };

    const fetchOrgUnits = async () => {
        try {
            const response = await fetch(API_ROUTES.ORG.UNITS);
            const result = await response.json();
            if (result.success) {
                setOrgUnits(result.data);
            }
        } catch (error) {
            console.error('Error fetching org units:', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Bạn có chắc chắn muốn xóa phân công này?')) {
            return;
        }

        try {
            const response = await fetch(API_ROUTES.HR.ASSIGNMENTS_BY_ID(id), {
                method: 'DELETE',
            });

            const result = await response.json();

            if (result.success) {
                setAssignments(assignments.filter(assignment => assignment.id !== id));
            } else {
                setError(result.error || 'Có lỗi xảy ra khi xóa phân công');
            }
        } catch (error) {
            console.error('Error deleting assignment:', error);
            setError('Lỗi khi xóa phân công');
        }
    };

    const getEmployeeName = (employeeId: string) => {
        const employee = employees.find(emp => emp.id === employeeId);
        return employee?.user?.full_name || `Employee ${employeeId}`;
    };

    const getOrgUnitName = (orgUnitId: string) => {
        const orgUnit = orgUnits.find(unit => unit.id === orgUnitId);
        return orgUnit?.name || `Unit ${orgUnitId}`;
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('vi-VN');
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
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h4" component="h1">
                    Quản lý phân công
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => router.push(HR_ROUTES.ASSIGNMENTS_NEW)}
                >
                    Thêm phân công
                </Button>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            <Paper>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Nhân viên</TableCell>
                                <TableCell>Đơn vị</TableCell>
                                <TableCell>Loại phân công</TableCell>
                                <TableCell>Tỷ lệ</TableCell>
                                <TableCell>Chính</TableCell>
                                <TableCell>Ngày bắt đầu</TableCell>
                                <TableCell>Ngày kết thúc</TableCell>
                                <TableCell>Thao tác</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {assignments.map((assignment) => (
                                <TableRow key={assignment.id}>
                                    <TableCell>
                                        {getEmployeeName(assignment.employee_id)}
                                    </TableCell>
                                    <TableCell>
                                        {getOrgUnitName(assignment.org_unit_id)}
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={assignment.assignment_type}
                                            color={assignment.assignment_type === 'admin' ? 'primary' : 'secondary'}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        {(parseFloat(assignment.allocation) * 100).toFixed(0)}%
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={assignment.is_primary ? 'Có' : 'Không'}
                                            color={assignment.is_primary ? 'success' : 'default'}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        {formatDate(assignment.start_date)}
                                    </TableCell>
                                    <TableCell>
                                        {assignment.end_date ? formatDate(assignment.end_date) : '-'}
                                    </TableCell>
                                    <TableCell>
                                        <IconButton
                                            size="small"
                                            onClick={() => router.push(HR_ROUTES.ASSIGNMENTS_DETAIL(assignment.id))}
                                        >
                                            <ViewIcon />
                                        </IconButton>
                                        <IconButton
                                            size="small"
                                            onClick={() => router.push(HR_ROUTES.ASSIGNMENTS_EDIT(assignment.id))}
                                        >
                                            <EditIcon />
                                        </IconButton>
                                        <IconButton
                                            size="small"
                                            onClick={() => handleDelete(assignment.id)}
                                            color="error"
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        </Box>
    );
}
