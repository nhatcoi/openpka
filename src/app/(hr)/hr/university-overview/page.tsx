'use client';

import React, { useState, useEffect } from 'react';
import { API_ROUTES } from '@/constants/routes';
import { Box, Typography, Button, CircularProgress, Alert, Grid, Card, CardContent, Chip } from '@mui/material';
import { School as SchoolIcon, People as PeopleIcon, Business as BusinessIcon } from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { HR_ROUTES } from '@/constants/routes';

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

export default function UniversityOverviewPage() {
    const [orgUnitStats, setOrgUnitStats] = useState<OrgUnitStats[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const response = await fetch(API_ROUTES.ORG.UNITS);
                const result = await response.json();

                if (result.success) {
                    const units = result.data;

                    // Group assignments by unit
                    const assignmentsByUnit = new Map<string, Assignment[]>();
                    units.forEach((unit: OrgUnit) => {
                        assignmentsByUnit.set(unit.id, unit.assignments || []);
                    });

                    const buildStats = (unit: OrgUnit, level: number = 1): OrgUnitStats => {
                        const unitAssignments = assignmentsByUnit.get(unit.id) || [];
                        const employees = unitAssignments.map(a => ({
                            ...a.employee,
                            position: a.position
                        })).filter(Boolean);
                        const activeEmployees = employees.filter(emp => emp.status === 'ACTIVE');

                        const children = units.filter((u: OrgUnit) => u.parent_id === unit.id);
                        const childrenStats = children.map((child: OrgUnit) => buildStats(child, level + 1));

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

                    // Build stats for root units (level 1 - Trường)
                    const rootUnits = units.filter((unit: OrgUnit) => !unit.parent_id);
                    const stats = rootUnits.map((unit: OrgUnit) => buildStats(unit, 1));

                    setOrgUnitStats(stats);
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
    }, []);

    const handleViewOrgStructure = () => {
        router.push(HR_ROUTES.ORG_STRUCTURE);
    };

    const handleViewFaculty = (unitId: string, unitName: string) => {
        router.push(`${HR_ROUTES.FACULTY}?unitId=${unitId}&unitName=${encodeURIComponent(unitName)}`);
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

    return (
        <Box sx={{ p: 3, backgroundColor: '#fafafa', minHeight: '100vh' }}>
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h4" component="h1" sx={{ color: '#1976d2' }}>
                    Tổng quan Đại học
                </Typography>
                <Button
                    variant="contained"
                    onClick={handleViewOrgStructure}
                    startIcon={<BusinessIcon />}
                >
                    Xem Cơ cấu Tổ chức
                </Button>
            </Box>

            <Grid container spacing={3}>
                {orgUnitStats.map((unit) => (
                    <Grid item xs={12} sm={6} md={4} key={unit.id}>
                        <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                            <CardContent sx={{ flexGrow: 1 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                    <SchoolIcon sx={{ mr: 1, color: '#1976d2' }} />
                                    <Typography variant="h6" component="h2" sx={{ fontWeight: 'bold' }}>
                                        {unit.name}
                                    </Typography>
                                </Box>

                                <Box sx={{ mb: 2 }}>
                                    <Chip
                                        label={`${unit.totalEmployees} nhân viên`}
                                        color="primary"
                                        size="small"
                                        sx={{ mr: 1, mb: 1 }}
                                    />
                                    <Chip
                                        label={`${unit.activeEmployees} hoạt động`}
                                        color="success"
                                        size="small"
                                        sx={{ mr: 1, mb: 1 }}
                                    />
                                    <Chip
                                        label={unit.status}
                                        color={unit.status === 'ACTIVE' ? 'success' : 'default'}
                                        size="small"
                                    />
                                </Box>

                                <Button
                                    variant="contained"
                                    size="small"
                                    onClick={() => handleViewFaculty(unit.id, unit.name)}
                                    startIcon={<PeopleIcon />}
                                    fullWidth
                                >
                                    Xem Giảng viên
                                </Button>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
}
