'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { Box, Typography, Button, CircularProgress, Alert, Grid, Card, CardContent, Chip, Breadcrumbs, Link } from '@mui/material';
import { ArrowBack as ArrowBackIcon, School as SchoolIcon, People as PeopleIcon, Business as BusinessIcon } from '@mui/icons-material';
import { useRouter, useSearchParams } from 'next/navigation';

interface OrgUnit {
    id: string;
    name: string;
    code: string;
    type: string;
    status: string;
    parent_id: string | null;
    children: OrgUnit[];
    assignments: Assignment[];
}

interface Assignment {
    id: string;
    employee: Employee;
    org_unit: OrgUnit;
    position?: {
        id: string;
        title: string;
        code: string;
    } | null;
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
    position?: {
        id: string;
        title: string;
        code: string;
    } | null;
}

interface OrgUnitStats {
    id: string;
    name: string;
    code: string;
    type: string;
    status: string;
    level: number;
    employees: Employee[];
    totalEmployees: number;
    activeEmployees: number;
    children: OrgUnitStats[];
}

export default async function OrgTreeDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = await params;
    return <OrgTreeDetailPageClient params={resolvedParams} />;
}

function OrgTreeDetailPageClient({ params }: { params: { id: string } }) {
    const [orgUnitStats, setOrgUnitStats] = useState<OrgUnitStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const searchParams = useSearchParams();
    const unitName = searchParams.get('name') || 'Đơn vị';

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const response = await fetch('/api/org/units');
                const result = await response.json();

                if (result.success) {
                    const units = result.data;

                    // Group assignments by unit
                    const assignmentsByUnit = new Map<string, Assignment[]>();
                    units.forEach((unit: OrgUnit) => {
                        assignmentsByUnit.set(unit.id, unit.assignments || []);
                    });

                    // Calculate level for each unit
                    const calculateLevel = (unit: OrgUnit, visited: Set<string> = new Set()): number => {
                        if (visited.has(unit.id)) return 1; // Prevent infinite loop
                        visited.add(unit.id);

                        if (!unit || !unit.parent_id) return 1; // Root level
                        return 1 + calculateLevel(unit.parent_id, visited);
                    };

                    const buildStats = (unit: OrgUnit, level: number = 1): OrgUnitStats => {
                        const unitAssignments = assignmentsByUnit.get(unit.id) || [];
                        const employees = unitAssignments.map(a => ({
                            ...a.employee,
                            position: a.position
                        })).filter(Boolean);
                        const activeEmployees = employees.filter(emp => emp.status === 'ACTIVE');

                        const children = units.filter(u => u.parent_id === unit.id);
                        const childrenStats = children.map(child => buildStats(child, level + 1));

                        return {
                            id: unit.id,
                            name: unit.name,
                            code: unit.code,
                            type: unit.type,
                            status: unit.status,
                            level,
                            employees,
                            totalEmployees: employees.length,
                            activeEmployees: activeEmployees.length,
                            children: childrenStats
                        };
                    };

                    // Find the specific unit
                    const targetUnit = units.find((unit: OrgUnit) => unit.id === params.id);
                    if (targetUnit) {
                        const stats = buildStats(targetUnit, 1);
                        setOrgUnitStats(stats);
                    } else {
                        setError('Không tìm thấy đơn vị');
                    }
                } else {
                    setError(result.error || 'Không thể tải dữ liệu');
                }
            } catch (err) {
                console.error('Error fetching data:', err);
                setError('Lỗi kết nối đến server');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [params.id]);

    const handleViewEmployees = (unitId: string, unitName: string) => {
        router.push(`/hr/org-tree/${unitId}/employees?name=${encodeURIComponent(unitName)}`);
    };

    const handleBack = () => {
        router.push('/hr/org-tree');
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box p={3}>
                <Alert severity="error">{error}</Alert>
            </Box>
        );
    }

    if (!orgUnitStats) {
        return (
            <Box p={3}>
                <Alert severity="warning">Không tìm thấy dữ liệu</Alert>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3, backgroundColor: '#fafafa', minHeight: '100vh' }}>
            <Box sx={{ mb: 3 }}>
                <Breadcrumbs sx={{ mb: 2 }}>
                    <Link
                        color="inherit"
                        href="/hr/org-tree"
                        onClick={(e) => { e.preventDefault(); handleBack(); }}
                        sx={{ cursor: 'pointer' }}
                    >
                        Tổng quan
                    </Link>
                    <Typography color="text.primary">{unitName}</Typography>
                </Breadcrumbs>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Button
                        startIcon={<ArrowBackIcon />}
                        onClick={handleBack}
                        variant="outlined"
                    >
                        Quay lại
                    </Button>
                    <Typography variant="h4" component="h1" sx={{ color: '#1976d2' }}>
                        {unitName}
                    </Typography>
                </Box>

                <Box sx={{ mb: 3 }}>
                    <Chip
                        label={`${orgUnitStats.totalEmployees} nhân viên`}
                        color="primary"
                        sx={{ mr: 1, mb: 1 }}
                    />
                    <Chip
                        label={`${orgUnitStats.activeEmployees} hoạt động`}
                        color="success"
                        sx={{ mr: 1, mb: 1 }}
                    />
                    <Chip
                        label={orgUnitStats.status}
                        color={orgUnitStats.status === 'ACTIVE' ? 'success' : 'default'}
                        sx={{ mr: 1, mb: 1 }}
                    />
                </Box>
            </Box>

            <Grid container spacing={3}>
                {/* Current unit info */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <SchoolIcon sx={{ mr: 1, color: '#1976d2' }} />
                                <Typography variant="h6" component="h2" sx={{ fontWeight: 'bold' }}>
                                    {orgUnitStats.name}
                                </Typography>
                            </Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                Mã: {orgUnitStats.code} | Loại: {orgUnitStats.type}
                            </Typography>
                            <Button
                                variant="contained"
                                onClick={() => handleViewEmployees(orgUnitStats.id, orgUnitStats.name)}
                                startIcon={<PeopleIcon />}
                                fullWidth
                            >
                                Xem giảng viên
                            </Button>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Children units */}
                {orgUnitStats.children.length > 0 && (
                    <Grid item xs={12} md={6}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" component="h2" sx={{ mb: 2, fontWeight: 'bold' }}>
                                    Đơn vị con
                                </Typography>
                                <Grid container spacing={2}>
                                    {orgUnitStats.children.map((child) => (
                                        <Grid item xs={12} key={child.id}>
                                            <Card variant="outlined">
                                                <CardContent sx={{ p: 2 }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                        <BusinessIcon sx={{ mr: 1, color: '#666' }} />
                                                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                                            {child.name}
                                                        </Typography>
                                                    </Box>
                                                    <Box sx={{ mb: 2 }}>
                                                        <Chip
                                                            label={`${child.totalEmployees} nhân viên`}
                                                            size="small"
                                                            color="primary"
                                                            sx={{ mr: 1, mb: 1 }}
                                                        />
                                                        <Chip
                                                            label={`${child.activeEmployees} hoạt động`}
                                                            size="small"
                                                            color="success"
                                                        />
                                                    </Box>
                                                    <Button
                                                        variant="outlined"
                                                        size="small"
                                                        onClick={() => handleViewEmployees(child.id, child.name)}
                                                        startIcon={<PeopleIcon />}
                                                        fullWidth
                                                    >
                                                        Xem giảng viên
                                                    </Button>
                                                </CardContent>
                                            </Card>
                                        </Grid>
                                    ))}
                                </Grid>
                            </CardContent>
                        </Card>
                    </Grid>
                )}
            </Grid>
        </Box>
    );
}

