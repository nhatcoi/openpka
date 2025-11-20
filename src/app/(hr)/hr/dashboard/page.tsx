'use client';

import { useState, useEffect } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
    Box,
    Paper,
    Typography,
    Grid,
    Card,
    CardContent,
    Chip,
    Alert,
    CircularProgress,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    Avatar,
    Divider,
    Button,
} from '@mui/material';
import {
    ExpandMore as ExpandMoreIcon,
    School as SchoolIcon,
    People as PeopleIcon,
    Work as WorkIcon,
    Business as BusinessIcon,
} from '@mui/icons-material';
import { API_ROUTES, HR_ROUTES } from '@/constants/routes';

interface OrgUnit {
    id: string;
    name: string;
    code: string | null;
    parent_id: string | null;
    type: string;
    status: string;
    level?: number;
    is_active?: boolean;
    children?: OrgUnit[];
}

interface Employee {
    id: string;
    employee_no: string | null;
    employment_type: string | null;
    status: string | null;
    user: {
        id: string;
        username: string;
        full_name: string;
        email: string | null;
    } | null;
}

interface Assignment {
    id: string;
    employee_id: string;
    org_unit_id: string;
    position_id: string | null;
    is_primary: boolean;
    assignment_type: string;
    allocation: string;
    start_date: string;
    end_date: string | null;
    employee: Employee;
    org_unit: OrgUnit;
}

interface OrgUnitStats {
    orgUnit: OrgUnit;
    totalEmployees: number;
    activeEmployees: number;
    employees: Employee[];
    children: OrgUnitStats[];
}

export default function HRDashboardPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [orgUnits, setOrgUnits] = useState<OrgUnit[]>([]);
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [orgUnitStats, setOrgUnitStats] = useState<OrgUnitStats[]>([]);
    const [orgStats, setOrgStats] = useState<{
        totalUnits: number;
        activeUnits: number;
        inactiveUnits: number;
        totalEmployees: number;
    } | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (status === 'loading') return;

        if (!session) {
            void signIn();
            return;
        }

        void fetchData();
    }, [session, status]);

    const fetchData = async () => {
        try {
            setLoading(true);

            // Use consolidated org stats API
            const response = await fetch(API_ROUTES.ORG.STATS);
            const result = await response.json();
            if (result?.success && result?.data) {
                const d = result.data;
                setOrgStats({
                    totalUnits: Number(d.totalUnits) || 0,
                    activeUnits: Number(d.activeUnits) || 0,
                    inactiveUnits: Number(d.inactiveUnits) || 0,
                    totalEmployees: Number(d.totalEmployees) || 0,
                });
            } else {
                setError('Không thể tải dữ liệu thống kê');
            }
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            setError('Lỗi khi tải dữ liệu thống kê');
        } finally {
            setLoading(false);
        }
    };

    const buildOrgUnitStats = (units: OrgUnit[], assignments: Assignment[]): OrgUnitStats[] => {
        // Create a map for quick lookup
        const unitMap = new Map<string, OrgUnit>();
        units.forEach(unit => unitMap.set(unit.id, unit));

        // Group assignments by org unit
        const assignmentsByUnit = new Map<string, Assignment[]>();
        assignments.forEach(assignment => {
            if (!assignmentsByUnit.has(assignment.org_unit_id)) {
                assignmentsByUnit.set(assignment.org_unit_id, []);
            }
            assignmentsByUnit.get(assignment.org_unit_id)!.push(assignment);
        });

        // Build hierarchical structure
        const buildStats = (unit: OrgUnit, level: number = 1): OrgUnitStats => {
            const unitAssignments = assignmentsByUnit.get(unit.id) || [];
            const employees = unitAssignments.map(a => a.employee).filter(Boolean);
            const activeEmployees = employees.filter(emp => emp.status === 'ACTIVE');

            // Find children
            const children = units.filter(u => u.parent_id === unit.id);
            const childrenStats = children.map(child => buildStats(child, level + 1));

            // Add level to unit object
            const unitWithLevel = { ...unit, level };

            return {
                orgUnit: unitWithLevel,
                totalEmployees: employees.length,
                activeEmployees: activeEmployees.length,
                employees: employees,
                children: childrenStats
            };
        };

        // Start with root units (no parent)
        const rootUnits = units.filter(unit => !unit.parent_id);
        return rootUnits.map(unit => buildStats(unit));
    };

    const getTotalStats = () => {
        if (orgStats) {
            return {
                totalEmployees: orgStats.totalEmployees,
                activeEmployees: orgStats.totalEmployees, // active assignments counted
                totalUnits: orgStats.totalUnits,
                activeUnits: orgStats.activeUnits,
            };
        }
        // Fallback to zeros
        return { totalEmployees: 0, activeEmployees: 0, totalUnits: 0, activeUnits: 0 };
    };


    const renderOrgUnitCard = (stats: OrgUnitStats, level: number = 0) => {
        const { orgUnit, totalEmployees, activeEmployees, employees, children } = stats;

        return (
            <Accordion key={orgUnit.id} sx={{ ml: level * 2 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                        <BusinessIcon color="primary" />
                        <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="h6">
                                {orgUnit.name}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                                <Chip
                                    label={`Cấp ${orgUnit.level}`}
                                    color="primary"
                                    size="small"
                                />
                                <Chip
                                    label={`${totalEmployees} giảng viên`}
                                    color="secondary"
                                    size="small"
                                />
                                <Chip
                                    label={`${activeEmployees} hoạt động`}
                                    color="success"
                                    size="small"
                                />
                            </Box>
                        </Box>
                    </Box>
                </AccordionSummary>
                <AccordionDetails>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {/* Employee List */}
                        {employees.length > 0 && (
                            <Box>
                                <Typography variant="subtitle1" gutterBottom>
                                    Danh sách giảng viên:
                                </Typography>
                                <List dense>
                                    {employees.map((employee, index) => (
                                        <ListItem key={employee.id} divider={index < employees.length - 1}>
                                            <ListItemAvatar>
                                                <Avatar sx={{ bgcolor: 'primary.main' }}>
                                                    <PeopleIcon />
                                                </Avatar>
                                            </ListItemAvatar>
                                            <ListItemText
                                                primary={employee.user?.full_name || 'N/A'}
                                                secondary={
                                                    <Box>
                                                        <Typography variant="body2" color="text.secondary">
                                                            {employee.employee_no && `Mã: ${employee.employee_no}`}
                                                        </Typography>
                                                        <Typography variant="body2" color="text.secondary">
                                                            {employee.employment_type && `Loại: ${employee.employment_type}`}
                                                        </Typography>
                                                        <Chip
                                                            label={employee.status || 'N/A'}
                                                            color={employee.status === 'ACTIVE' ? 'success' : 'default'}
                                                            size="small"
                                                            sx={{ mt: 0.5 }}
                                                        />
                                                    </Box>
                                                }
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                            </Box>
                        )}

                        {/* Children Units */}
                        {children.length > 0 && (
                            <Box>
                                <Typography variant="subtitle1" gutterBottom>
                                    Các đơn vị con:
                                </Typography>
                                {children.map(child => renderOrgUnitCard(child, level + 1))}
                            </Box>
                        )}
                    </Box>
                </AccordionDetails>
            </Accordion>
        );
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

    if (error) {
        return (
            <Alert severity="error" sx={{ mb: 2 }}>
                {error}
            </Alert>
        );
    }

    const { totalEmployees, activeEmployees, totalUnits, activeUnits } = getTotalStats();

    return (
        <Box>
            <Typography variant="h4" component="h1" gutterBottom>
                Thống kê giảng viên theo cơ cấu tổ chức
            </Typography>

            {/* Summary Cards */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <SchoolIcon color="primary" sx={{ fontSize: 40 }} />
                                <Box>
                                    <Typography variant="h4" component="div">
                                        {totalUnits}
                                    </Typography>
                                    <Typography color="text.secondary">
                                        Tổng số đơn vị
                                    </Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <BusinessIcon color="success" sx={{ fontSize: 40 }} />
                                <Box>
                                    <Typography variant="h4" component="div">
                                        {activeUnits}
                                    </Typography>
                                    <Typography color="text.secondary">
                                        Đơn vị hoạt động
                                    </Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <PeopleIcon color="secondary" sx={{ fontSize: 40 }} />
                                <Box>
                                    <Typography variant="h4" component="div">
                                        {totalEmployees}
                                    </Typography>
                                    <Typography color="text.secondary">
                                        Tổng giảng viên
                                    </Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <WorkIcon color="warning" sx={{ fontSize: 40 }} />
                                <Box>
                                    <Typography variant="h4" component="div">
                                        {activeEmployees}
                                    </Typography>
                                    <Typography color="text.secondary">
                                        Giảng viên hoạt động
                                    </Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Quick Access to Org Tree */}
            <Paper sx={{ p: 3 }}>
                <Typography variant="h5" gutterBottom>
                    Truy cập nhanh
                </Typography>
                <Divider sx={{ mb: 2 }} />

                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <Button
                        variant="contained"
                        startIcon={<BusinessIcon />}
                        onClick={() => router.push(HR_ROUTES.ORG_TREE)}
                        size="large"
                    >
                        Xem sơ đồ tổ chức
                    </Button>
                    <Button
                        variant="outlined"
                        startIcon={<PeopleIcon />}
                        onClick={() => router.push(HR_ROUTES.EMPLOYEES)}
                        size="large"
                    >
                        Quản lý nhân viên
                    </Button>
                    <Button
                        variant="outlined"
                        startIcon={<WorkIcon />}
                        onClick={() => router.push(HR_ROUTES.ASSIGNMENTS)}
                        size="large"
                    >
                        Phân công công việc
                    </Button>
                </Box>
            </Paper>
        </Box>
    );
}
