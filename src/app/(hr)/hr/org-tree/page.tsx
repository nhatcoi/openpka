'use client';

import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, CircularProgress, Alert, Grid, Card, CardContent, Chip } from '@mui/material';
import { School as SchoolIcon, People as PeopleIcon, Business as BusinessIcon } from '@mui/icons-material';
import { useRouter } from 'next/navigation';

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

import { useAllOrgUnits } from '@/features/org';

export default function OrgTreeOverviewPage() {
    const router = useRouter();
    const { data: units = [], isLoading: loading, error: queryError } = useAllOrgUnits();

    const orgUnitStats = React.useMemo<OrgUnitStats[]>(() => {
        if (!units || units.length === 0) return [];

        const assignmentsByUnit = new Map<string, Assignment[]>();
        units.forEach((unit: any) => {
            assignmentsByUnit.set(unit.id, unit.assignments || []);
        });

        const calculateLevel = (unit: any, visited: Set<string> = new Set()): number => {
            if (visited.has(unit.id)) return 1;
            visited.add(unit.id);

            if (!unit || !unit.parent_id) return 1;
            const parentUnit = units.find((u: any) => u.id === unit.parent_id);
            return parentUnit ? 1 + calculateLevel(parentUnit, visited) : 1;
        };

        const buildStats = (unit: any, level: number = 1): OrgUnitStats => {
            const unitAssignments = assignmentsByUnit.get(unit.id) || [];
            const employees = unitAssignments.map(a => ({
                ...a.employee,
                position: a.position
            })).filter(Boolean);
            const activeEmployees = employees.filter(emp => emp.status === 'ACTIVE');

            const children = units.filter((u: any) => u.parent_id === unit.id);
            const childrenStats = children.map((child: any) => buildStats(child, level + 1));

            return {
                id: unit.id,
                name: unit.name,
                code: unit.code,
                type: unit.type || '',
                status: unit.status || '',
                level,
                employees,
                totalEmployees: employees.length,
                activeEmployees: activeEmployees.length,
                children: childrenStats
            };
        };

        const rootUnits = units.filter((unit: any) => !unit.parent_id);
        return rootUnits.map((unit: any) => buildStats(unit, calculateLevel(unit)));
    }, [units]);

    const error = queryError ? (queryError as Error).message : null;

    const handleViewDetail = (unitId: string, unitName: string) => {
        router.push(`/hr/org-tree/${unitId}?name=${encodeURIComponent(unitName)}`);
    };

    const handleViewEmployees = (unitId: string, unitName: string) => {
        router.push(`/hr/org-tree/${unitId}/employees?name=${encodeURIComponent(unitName)}`);
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
            <Typography variant="h4" component="h1" sx={{ mb: 3, color: '#1976d2' }}>
                Tổng quan Cơ cấu Tổ chức
            </Typography>

            <Grid container spacing={3}>
                {orgUnitStats.map((unit) => (
                    <Grid size={{ xs: 12, sm: 6, md: 4 }} key={unit.id} sx={{ display: 'flex' }}>
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

                                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                    <Button
                                        variant="outlined"
                                        size="small"
                                        onClick={() => handleViewDetail(unit.id, unit.name)}
                                        startIcon={<BusinessIcon />}
                                    >
                                        Xem chi tiết
                                    </Button>
                                    <Button
                                        variant="contained"
                                        size="small"
                                        onClick={() => handleViewEmployees(unit.id, unit.name)}
                                        startIcon={<PeopleIcon />}
                                    >
                                        Xem giảng viên
                                    </Button>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
}