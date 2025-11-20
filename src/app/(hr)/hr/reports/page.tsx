'use client';

import { useState, useEffect } from 'react';
import { useSession, signIn } from 'next-auth/react';
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
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Button,
} from '@mui/material';
import {
    School as SchoolIcon,
    People as PeopleIcon,
    Work as WorkIcon,
    Business as BusinessIcon,
    Assessment as AssessmentIcon,
    Download as DownloadIcon,
} from '@mui/icons-material';
import { API_ROUTES } from '@/constants/routes';

interface OrgUnit {
    id: string;
    name: string;
    code: string | null;
    parent_id: string | null;
    level?: number | null;
    type?: string | null;
    status?: string | null;
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
    employee?: Employee | null;
    org_unit?: OrgUnit | null;
}

interface ReportData {
    orgUnit: OrgUnit;
    totalEmployees: number;
    activeEmployees: number;
    inactiveEmployees: number;
    fullTimeEmployees: number;
    partTimeEmployees: number;
    contractEmployees: number;
    internEmployees: number;
    employees: Employee[];
}

export default function ReportsPage() {
    const { data: session, status } = useSession();
    const [orgUnits, setOrgUnits] = useState<OrgUnit[]>([]);
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [reportData, setReportData] = useState<ReportData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedLevel, setSelectedLevel] = useState<number | 'all'>('all');

    useEffect(() => {
        if (status === 'loading') return;

        if (!session) {
            void signIn();
            return;
        }

        void fetchData();
    }, [session, status]);

    const extractItems = <T = unknown>(payload: any): T[] => {
        if (!payload) return [];
        if (Array.isArray(payload)) return payload;
        if (Array.isArray(payload?.data)) return payload.data;
        if (Array.isArray(payload?.items)) return payload.items;
        if (Array.isArray(payload?.data?.items)) return payload.data.items;
        return [];
    };

    const normalizeOrgUnit = (unitData: any): OrgUnit => ({
        id: unitData?.id?.toString() ?? '',
        name: unitData?.name ?? '',
        code: unitData?.code ?? null,
        parent_id: unitData?.parent_id?.toString() ?? null,
        level: typeof unitData?.level === 'number'
            ? unitData.level
            : unitData?.level
            ? Number(unitData.level) || null
            : unitData?.hierarchy_level ?? null,
        type: unitData?.type ?? null,
        status: unitData?.status ?? null,
    });

    const normalizeEmploymentTypeValue = (type?: string | null) => {
        if (!type) return '';
        return type.toLowerCase().replace(/[_\s]/g, '-');
    };

    const normalizeEmployee = (employeeData: any): Employee | null => {
        if (!employeeData) return null;
        return {
            id: employeeData?.id?.toString() ?? '',
            employee_no: employeeData?.employee_no ?? null,
            employment_type: normalizeEmploymentTypeValue(employeeData?.employment_type),
            status: employeeData?.status ?? null,
            user: employeeData?.user || employeeData?.User
                ? {
                      id: (employeeData?.user || employeeData?.User)?.id?.toString() ?? '',
                      username: (employeeData?.user || employeeData?.User)?.username ?? '',
                      full_name: (employeeData?.user || employeeData?.User)?.full_name ?? '',
                      email: (employeeData?.user || employeeData?.User)?.email ?? null,
                  }
                : null,
        };
    };

    const normalizeAssignment = (assignmentData: any): Assignment => {
        const employee = normalizeEmployee(assignmentData?.employee || assignmentData?.Employee);
        const orgUnitRaw = assignmentData?.org_unit || assignmentData?.OrgUnit;
        return {
            id: assignmentData?.id?.toString() ?? '',
            employee_id: assignmentData?.employee_id?.toString() ?? employee?.id ?? '',
            org_unit_id: assignmentData?.org_unit_id?.toString() ?? orgUnitRaw?.id?.toString() ?? '',
            position_id: assignmentData?.position_id
                ? assignmentData.position_id.toString()
                : assignmentData?.JobPosition?.id?.toString() ?? null,
            is_primary: Boolean(assignmentData?.is_primary),
            assignment_type: assignmentData?.assignment_type ?? '',
            allocation:
                typeof assignmentData?.allocation === 'number'
                    ? assignmentData.allocation.toString()
                    : assignmentData?.allocation ?? '0',
            start_date: assignmentData?.start_date ?? '',
            end_date: assignmentData?.end_date ?? null,
            employee,
            org_unit: orgUnitRaw ? normalizeOrgUnit(orgUnitRaw) : null,
        };
    };

    const getUnitLevelLabel = (unit: OrgUnit) => {
        if (unit.level) return `Cấp ${unit.level}`;
        if (unit.type) return unit.type;
        return 'Chưa xác định';
    };

    const fetchData = async () => {
        try {
            setLoading(true);

            const [orgUnitsResponse, assignmentsResponse] = await Promise.all([
                fetch(API_ROUTES.ORG.UNITS),
                fetch(API_ROUTES.HR.ASSIGNMENTS)
            ]);

            const [orgUnitsResult, assignmentsResult] = await Promise.all([
                orgUnitsResponse.json(),
                assignmentsResponse.json()
            ]);

            const orgDataRaw = extractItems<any>(orgUnitsResult).map(normalizeOrgUnit);
            const assignmentsDataRaw = extractItems<any>(assignmentsResult).map(normalizeAssignment);

            if (orgDataRaw.length && assignmentsDataRaw.length) {
                setOrgUnits(orgDataRaw);
                setAssignments(assignmentsDataRaw);

                const reports = buildReportData(orgDataRaw, assignmentsDataRaw);
                setReportData(reports);
            } else {
                setError('Không thể tải dữ liệu báo cáo');
            }
        } catch (error) {
            console.error('Error fetching report data:', error);
            setError('Lỗi khi tải dữ liệu báo cáo');
        } finally {
            setLoading(false);
        }
    };

    const buildReportData = (units: OrgUnit[], assignments: Assignment[]): ReportData[] => {
        const assignmentsByUnit = new Map<string, Assignment[]>();
        assignments.forEach(assignment => {
            if (!assignmentsByUnit.has(assignment.org_unit_id)) {
                assignmentsByUnit.set(assignment.org_unit_id, []);
            }
            assignmentsByUnit.get(assignment.org_unit_id)!.push(assignment);
        });

        return units.map(unit => {
            const unitAssignments = assignmentsByUnit.get(unit.id) || [];
            const employees = unitAssignments.map(a => a.employee).filter(Boolean);

            const activeEmployees = employees.filter(emp => emp.status === 'ACTIVE').length;
            const inactiveEmployees = employees.filter(emp => emp.status !== 'ACTIVE').length;

            const fullTimeEmployees = employees.filter(emp => emp.employment_type === 'full-time').length;
            const partTimeEmployees = employees.filter(emp => emp.employment_type === 'part-time').length;
            const contractEmployees = employees.filter(emp => emp.employment_type === 'contract').length;
            const internEmployees = employees.filter(emp => emp.employment_type === 'intern').length;

            return {
                orgUnit: unit,
                totalEmployees: employees.length,
                activeEmployees,
                inactiveEmployees,
                fullTimeEmployees,
                partTimeEmployees,
                contractEmployees,
                internEmployees,
                employees
            };
        });
    };

    const getFilteredData = () => {
        if (selectedLevel === 'all') {
            return reportData;
        }
        return reportData.filter(data => data.orgUnit.level === selectedLevel);
    };

    const getTotalStats = () => {
        const filtered = getFilteredData();
        return {
            totalUnits: filtered.length,
            totalEmployees: filtered.reduce((sum, data) => sum + data.totalEmployees, 0),
            activeEmployees: filtered.reduce((sum, data) => sum + data.activeEmployees, 0),
            inactiveEmployees: filtered.reduce((sum, data) => sum + data.inactiveEmployees, 0),
            fullTimeEmployees: filtered.reduce((sum, data) => sum + data.fullTimeEmployees, 0),
            partTimeEmployees: filtered.reduce((sum, data) => sum + data.partTimeEmployees, 0),
            contractEmployees: filtered.reduce((sum, data) => sum + data.contractEmployees, 0),
            internEmployees: filtered.reduce((sum, data) => sum + data.internEmployees, 0),
        };
    };

    const exportToCSV = () => {
        const filtered = getFilteredData();
        const csvContent = [
            ['Đơn vị', 'Mã đơn vị', 'Cấp độ', 'Tổng GV', 'Hoạt động', 'Không hoạt động', 'Full-time', 'Part-time', 'Contract', 'Intern'].join(','),
            ...filtered.map(data => [
                data.orgUnit.name,
                data.orgUnit.code || '',
                getUnitLevelLabel(data.orgUnit),
                data.totalEmployees,
                data.activeEmployees,
                data.inactiveEmployees,
                data.fullTimeEmployees,
                data.partTimeEmployees,
                data.contractEmployees,
                data.internEmployees
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'thong_ke_giang_vien.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
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

    const filteredData = getFilteredData();
    const stats = getTotalStats();

    return (
        <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h4" component="h1">
                    Báo cáo thống kê giảng viên
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                        <InputLabel>Cấp độ</InputLabel>
                        <Select
                            value={selectedLevel}
                            onChange={(e) => setSelectedLevel(e.target.value as number | 'all')}
                            label="Cấp độ"
                        >
                            <MenuItem value="all">Tất cả</MenuItem>
                            <MenuItem value={1}>Cấp 1</MenuItem>
                            <MenuItem value={2}>Cấp 2</MenuItem>
                            <MenuItem value={3}>Cấp 3</MenuItem>
                            <MenuItem value={4}>Cấp 4</MenuItem>
                        </Select>
                    </FormControl>
                    <Button
                        variant="contained"
                        startIcon={<DownloadIcon />}
                        onClick={exportToCSV}
                    >
                        Xuất CSV
                    </Button>
                </Box>
            </Box>

            {/* Summary Cards */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <BusinessIcon color="primary" sx={{ fontSize: 40 }} />
                                <Box>
                                    <Typography variant="h4" component="div">
                                        {stats.totalUnits}
                                    </Typography>
                                    <Typography color="text.secondary">
                                        Đơn vị
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
                                        {stats.totalEmployees}
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
                                <WorkIcon color="success" sx={{ fontSize: 40 }} />
                                <Box>
                                    <Typography variant="h4" component="div">
                                        {stats.activeEmployees}
                                    </Typography>
                                    <Typography color="text.secondary">
                                        Hoạt động
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
                                <AssessmentIcon color="warning" sx={{ fontSize: 40 }} />
                                <Box>
                                    <Typography variant="h4" component="div">
                                        {stats.fullTimeEmployees}
                                    </Typography>
                                    <Typography color="text.secondary">
                                        Full-time
                                    </Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Detailed Table */}
            <Paper sx={{ p: 3 }}>
                <Typography variant="h5" gutterBottom>
                    Chi tiết theo đơn vị
                </Typography>

                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Đơn vị</TableCell>
                                <TableCell>Mã đơn vị</TableCell>
                                <TableCell>Cấp độ</TableCell>
                                <TableCell align="center">Tổng GV</TableCell>
                                <TableCell align="center">Hoạt động</TableCell>
                                <TableCell align="center">Không hoạt động</TableCell>
                                <TableCell align="center">Full-time</TableCell>
                                <TableCell align="center">Part-time</TableCell>
                                <TableCell align="center">Contract</TableCell>
                                <TableCell align="center">Intern</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredData.map((data) => (
                                <TableRow key={data.orgUnit.id}>
                                    <TableCell>
                                        <Typography variant="body2" fontWeight="medium">
                                            {data.orgUnit.name}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        {data.orgUnit.code || '-'}
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={getUnitLevelLabel(data.orgUnit)}
                                            color={data.orgUnit.level === 1 ? 'primary' : 'secondary'}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell align="center">
                                        <Typography variant="h6" color="primary">
                                            {data.totalEmployees}
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="center">
                                        <Typography variant="body2" color="success.main">
                                            {data.activeEmployees}
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="center">
                                        <Typography variant="body2" color="error.main">
                                            {data.inactiveEmployees}
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="center">
                                        <Typography variant="body2">
                                            {data.fullTimeEmployees}
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="center">
                                        <Typography variant="body2">
                                            {data.partTimeEmployees}
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="center">
                                        <Typography variant="body2">
                                            {data.contractEmployees}
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="center">
                                        <Typography variant="body2">
                                            {data.internEmployees}
                                        </Typography>
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

