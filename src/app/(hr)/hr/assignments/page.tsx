'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
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
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Visibility as ViewIcon,
} from '@mui/icons-material';
import { HR_ROUTES, API_ROUTES } from '@/constants/routes';

// Types
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

interface Employee {
    id: string;
    name?: string;
    User?: {
        id: string;
        full_name: string;
        email?: string;
    };
    user?: {
        full_name: string;
        email?: string;
    };
}

interface OrgUnit {
    id: string;
    name: string;
}

// Helper functions
const parseOrgUnitsFromResponse = (result: any): OrgUnit[] => {
    if (!result) return [];

    // Handle paginated response format
    let unitsArray: any[] = [];
    
    if (result.success && result.data) {
        if (Array.isArray(result.data)) {
            unitsArray = result.data;
        } else if (result.data.items && Array.isArray(result.data.items)) {
            unitsArray = result.data.items;
        }
    } else if (result.items && Array.isArray(result.items)) {
        unitsArray = result.items;
    } else if (Array.isArray(result)) {
        unitsArray = result;
    }

    return unitsArray.map((unit: any) => ({
        id: unit.id,
        name: unit.name || unit.code || `Unit ${unit.id}`,
    }));
};

const formatDate = (dateString: string): string => {
    try {
        return new Date(dateString).toLocaleDateString('vi-VN');
    } catch {
        return dateString;
    }
};

const formatAllocation = (allocation: string): string => {
    try {
        return `${(parseFloat(allocation) * 100).toFixed(0)}%`;
    } catch {
        return allocation;
    }
};

export default function AssignmentsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    
    // State
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [orgUnits, setOrgUnits] = useState<OrgUnit[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>('');

    // Fetch data on mount
    useEffect(() => {
        if (status === 'loading') return;

        if (!session) {
            signIn();
            return;
        }

        void fetchAllData();
    }, [session, status]);

    // Fetch all required data
    const fetchAllData = async () => {
        try {
            setLoading(true);
            setError('');

            await Promise.all([
                fetchAssignments(),
                fetchEmployees(),
                fetchOrgUnits(),
            ]);
        } catch (err) {
            console.error('Error fetching data:', err);
            setError('Lỗi khi tải dữ liệu');
        } finally {
            setLoading(false);
        }
    };

    const fetchAssignments = async () => {
        try {
            const response = await fetch(API_ROUTES.HR.ASSIGNMENTS);
            const result = await response.json();

            if (result.success) {
                setAssignments(Array.isArray(result.data) ? result.data : []);
            } else {
                setError('Không thể tải danh sách phân công');
            }
        } catch (err) {
            console.error('Error fetching assignments:', err);
            setError('Lỗi khi tải danh sách phân công');
        }
    };

    const fetchEmployees = async () => {
        try {
            const response = await fetch(API_ROUTES.HR.EMPLOYEES);
            const result = await response.json();
            
            if (result.success) {
                setEmployees(Array.isArray(result.data) ? result.data : []);
            }
        } catch (err) {
            console.error('Error fetching employees:', err);
            // Don't set error for employees, it's not critical
        }
    };

    const fetchOrgUnits = async () => {
        try {
            const response = await fetch(API_ROUTES.ORG.UNITS);
            const result = await response.json();
            const units = parseOrgUnitsFromResponse(result);
            setOrgUnits(units);
        } catch (err) {
            console.error('Error fetching org units:', err);
            setOrgUnits([]); // Ensure it's always an array
        }
    };

    // Handlers
    const handleDelete = useCallback(async (id: string) => {
        if (!confirm('Bạn có chắc chắn muốn xóa phân công này?')) {
            return;
        }

        try {
            const response = await fetch(API_ROUTES.HR.ASSIGNMENTS_BY_ID(id), {
                method: 'DELETE',
            });

            const result = await response.json();

            if (result.success) {
                setAssignments(prev => prev.filter(assignment => assignment.id !== id));
                setError(''); // Clear any previous errors
            } else {
                setError(result.error || 'Có lỗi xảy ra khi xóa phân công');
            }
        } catch (err) {
            console.error('Error deleting assignment:', err);
            setError('Lỗi khi xóa phân công');
        }
    }, []);

    const handleView = useCallback((id: string) => {
        router.push(HR_ROUTES.ASSIGNMENTS_DETAIL(id));
    }, [router]);

    const handleEdit = useCallback((id: string) => {
        router.push(HR_ROUTES.ASSIGNMENTS_EDIT(id));
    }, [router]);

    // Helper functions
    const getEmployeeName = useCallback((assignment: Assignment): string => {
        // Priority: assignment.employee data > employees lookup
        if (assignment.employee?.user?.full_name) {
            return assignment.employee.user.full_name;
        }

        if (!Array.isArray(employees)) {
            return `Employee ${assignment.employee_id}`;
        }

        const employee = employees.find(emp => emp.id === assignment.employee_id);
        return employee?.User?.full_name || employee?.user?.full_name || employee?.name || `Employee ${assignment.employee_id}`;
    }, [employees]);

    const getOrgUnitName = useCallback((assignment: Assignment): string => {
        // Priority: assignment.org_unit data > orgUnits lookup
        if (assignment.org_unit?.name) {
            return assignment.org_unit.name;
        }

        if (!Array.isArray(orgUnits)) {
            return `Unit ${assignment.org_unit_id}`;
        }

        const orgUnit = orgUnits.find(unit => unit.id === assignment.org_unit_id);
        return orgUnit?.name || `Unit ${assignment.org_unit_id}`;
    }, [orgUnits]);

    // Computed values
    const hasAssignments = useMemo(() => assignments.length > 0, [assignments]);

    // Loading state
    if (status === 'loading' || loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    // Not authenticated
    if (!session) {
        return null;
    }

    return (
        <Box>
            {/* Header */}
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

            {/* Error message */}
            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
                    {error}
                </Alert>
            )}

            {/* Assignments table */}
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
                                <TableCell align="right">Thao tác</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {hasAssignments ? (
                                assignments.map((assignment) => (
                                    <TableRow key={assignment.id} hover>
                                        <TableCell>{getEmployeeName(assignment)}</TableCell>
                                        <TableCell>{getOrgUnitName(assignment)}</TableCell>
                                        <TableCell>
                                            <Chip
                                                label={assignment.assignment_type}
                                                color={assignment.assignment_type === 'admin' ? 'primary' : 'secondary'}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell>{formatAllocation(assignment.allocation)}</TableCell>
                                        <TableCell>
                                            <Chip
                                                label={assignment.is_primary ? 'Có' : 'Không'}
                                                color={assignment.is_primary ? 'success' : 'default'}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell>{formatDate(assignment.start_date)}</TableCell>
                                        <TableCell>
                                            {assignment.end_date ? formatDate(assignment.end_date) : '-'}
                                        </TableCell>
                                        <TableCell align="right">
                                            <IconButton
                                                size="small"
                                                onClick={() => handleView(assignment.id)}
                                                aria-label="Xem chi tiết"
                                            >
                                                <ViewIcon />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleEdit(assignment.id)}
                                                aria-label="Chỉnh sửa"
                                            >
                                                <EditIcon />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleDelete(assignment.id)}
                                                color="error"
                                                aria-label="Xóa"
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                                        <Typography variant="body2" color="text.secondary">
                                            Chưa có phân công nào
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        </Box>
    );
}
