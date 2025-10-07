'use client';

import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, CircularProgress, Alert, Breadcrumbs, Link } from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { Tree } from 'react-d3-tree';
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

export default function OrgStructurePage() {
    const [orgUnitStats, setOrgUnitStats] = useState<OrgUnitStats[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

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

    const handleViewFaculty = (orgUnitId: string, orgUnitName: string) => {
        router.push(`${HR_ROUTES.FACULTY}?unitId=${orgUnitId}&unitName=${encodeURIComponent(orgUnitName)}`);
    };

    const handleBack = () => {
        router.push(HR_ROUTES.UNIVERSITY_OVERVIEW);
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
            <Box sx={{ mb: 3 }}>
                <Breadcrumbs sx={{ mb: 2 }}>
                    <Link
                        color="inherit"
                        href="/hr/university-overview"
                        onClick={(e) => { e.preventDefault(); handleBack(); }}
                        sx={{ cursor: 'pointer' }}
                    >
                        Tổng quan Đại học
                    </Link>
                    <Typography color="text.primary">Cơ cấu Tổ chức</Typography>
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
                        Cơ cấu Tổ chức
                    </Typography>
                </Box>
            </Box>

            <Box sx={{ width: '100%', height: '600px', overflow: 'auto' }}>
                <Tree
                    data={orgUnitStats}
                    orientation="vertical"
                    pathFunc="step"
                    translate={{ x: 600, y: 50 }}
                    nodeSize={{ x: 300, y: 180 }}
                    renderCustomNodeElement={(rd3tProps) => {
                        const { nodeDatum } = rd3tProps;
                        const isRoot = !(nodeDatum as { parent?: unknown }).parent || nodeDatum.attributes?.id === '1';
                        const level = Number(nodeDatum.attributes?.level) || 0;

                        // Màu sắc theo level
                        const colors = {
                            0: { bg: '#1976d2', text: 'white', stroke: '#1976d2' }, // Root - xanh dương
                            1: { bg: '#ffffff', text: '#2e7d32', stroke: '#2e7d32' }, // Level 1 - xanh lá
                            2: { bg: '#ffffff', text: '#f57c00', stroke: '#f57c00' }, // Level 2 - cam
                            3: { bg: '#ffffff', text: '#7b1fa2', stroke: '#7b1fa2' }, // Level 3 - tím
                            4: { bg: '#ffffff', text: '#d32f2f', stroke: '#d32f2f' }, // Level 4 - đỏ
                        };

                        const colorScheme = colors[level as keyof typeof colors] || colors[4];

                        return (
                            <g>
                                <rect
                                    width={isRoot ? 350 : 300}
                                    height={isRoot ? 140 : 120}
                                    x={isRoot ? -175 : -150}
                                    y={isRoot ? -70 : -60}
                                    fill={colorScheme.bg}
                                    stroke={colorScheme.stroke}
                                    strokeWidth="2"
                                    rx="8"
                                    ry="8"
                                />
                                <text
                                    textAnchor="middle"
                                    x="0"
                                    y={isRoot ? -20 : -15}
                                    fontSize={isRoot ? "18" : "16"}
                                    fontWeight="bold"
                                    fill={colorScheme.text}
                                    stroke="none"
                                >
                                    {nodeDatum.name}
                                </text>

                                <text
                                    textAnchor="middle"
                                    x="0"
                                    y="0"
                                    fontSize="12"
                                    fill={isRoot ? 'rgba(255,255,255,0.9)' : '#666'}
                                    stroke="none"
                                >
                                    {nodeDatum.attributes?.totalEmployees || 0} nhân viên
                                </text>

                                <text
                                    textAnchor="middle"
                                    x="0"
                                    y="15"
                                    fontSize="12"
                                    fill={isRoot ? 'rgba(255,255,255,0.9)' : '#2e7d32'}
                                    stroke="none"
                                >
                                    {nodeDatum.attributes?.activeEmployees || 0} hoạt động
                                </text>

                                {/* Nút Xem trường */}
                                <rect
                                    width="100"
                                    height="20"
                                    x="-50"
                                    y="30"
                                    fill="transparent"
                                    stroke={isRoot ? 'rgba(255,255,255,0.5)' : colorScheme.stroke}
                                    strokeWidth="1"
                                    rx="4"
                                    ry="4"
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => handleViewFaculty(String(nodeDatum.attributes?.id || ''), String(nodeDatum.name))}
                                />
                                <text
                                    textAnchor="middle"
                                    x="0"
                                    y="42"
                                    fontSize="9"
                                    fill={isRoot ? 'white' : colorScheme.text}
                                    stroke="none"
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => handleViewFaculty(String(nodeDatum.attributes?.id || ''), String(nodeDatum.name))}
                                >
                                    Xem trường
                                </text>

                                {/* Nút Xem giảng viên */}
                                {(Number(nodeDatum.attributes?.totalEmployees) || 0) > 0 && (
                                    <rect
                                        width="100"
                                        height="20"
                                        x="-50"
                                        y="55"
                                        fill="transparent"
                                        stroke={isRoot ? 'rgba(255,255,255,0.5)' : '#1976d2'}
                                        strokeWidth="1"
                                        rx="4"
                                        ry="4"
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => handleViewFaculty(String(nodeDatum.attributes?.id || ''), String(nodeDatum.name))}
                                    />
                                )}
                                {(Number(nodeDatum.attributes?.totalEmployees) || 0) > 0 && (
                                    <text
                                        textAnchor="middle"
                                        x="0"
                                        y="67"
                                        fontSize="9"
                                        fill={isRoot ? 'white' : '#1976d2'}
                                        stroke="none"
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => handleViewFaculty(String(nodeDatum.attributes?.id || ''), String(nodeDatum.name))}
                                    >
                                        Xem giảng viên
                                    </text>
                                )}
                            </g>
                        );
                    }}
                />
            </Box>
        </Box>
    );
}
