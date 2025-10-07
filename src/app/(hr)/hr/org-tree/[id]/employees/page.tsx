'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { Box, Typography, Button, CircularProgress, Alert, Breadcrumbs, Link } from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { useRouter, useSearchParams } from 'next/navigation';
import { Tree } from 'react-d3-tree';

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

export default function OrgTreeEmployeesPage({ params }: { params: { id: string } }) {
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

    const handleBack = () => {
        router.push(`/hr/org-tree/${params.id}?name=${encodeURIComponent(unitName)}`);
    };

    const handleBackToOverview = () => {
        router.push('/hr/org-tree');
    };

    // Create employee tree data
    const createEmployeeTree = (employees: Employee[]) => {
        if (employees.length === 0) {
            return {
                name: 'Không có giảng viên',
                attributes: {
                    id: 'root',
                    type: 'empty',
                    totalEmployees: 0,
                },
                children: []
            };
        }

        // Sort employees by position/role
        const sortedEmployees = employees.sort((a, b) => {
            const getPositionLevel = (employee: Employee) => {
                const position = employee.position?.title?.toLowerCase() || employee.employment_type?.toLowerCase() || '';
                if (position.includes('hiệu trưởng') || position.includes('rector')) return 1;
                if (position.includes('phó hiệu trưởng') || position.includes('vice rector')) return 2;
                if (position.includes('trưởng khoa') || position.includes('head') || position.includes('dean')) return 3;
                if (position.includes('phó') || position.includes('deputy') || position.includes('vice')) return 4;
                if (position.includes('giảng viên') || position.includes('lecturer') || position.includes('teacher')) return 5;
                return 6;
            };
            return getPositionLevel(a) - getPositionLevel(b);
        });

        // Find the main leader
        const mainLeader = sortedEmployees[0];

        if (!mainLeader) {
            return {
                name: 'Không có giảng viên',
                attributes: {
                    id: 'root',
                    type: 'empty',
                    totalEmployees: 0,
                },
                children: []
            };
        }

        // Create tree structure with main leader as root
        const treeData = {
            name: mainLeader.User?.full_name || 'N/A',
            attributes: {
                id: mainLeader.id,
                position: mainLeader.position?.title || mainLeader.employment_type || 'Trưởng khoa',
                employee_no: mainLeader.employee_no || '',
                email: mainLeader.User?.email || '',
                status: mainLeader.status || '',
                type: 'leader',
                totalEmployees: employees.length,
            },
            children: sortedEmployees.slice(1).map(emp => ({
                name: emp.User?.full_name || 'N/A',
                attributes: {
                    id: emp.id,
                    position: emp.position?.title || emp.employment_type || 'Giảng viên',
                    employee_no: emp.employee_no || '',
                    email: emp.User?.email || '',
                    status: emp.status || '',
                    type: 'employee',
                },
                children: []
            }))
        };

        return treeData;
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

    const employeeTreeData = createEmployeeTree(orgUnitStats.Employee);

    return (
        <Box sx={{ p: 3, backgroundColor: '#fafafa', minHeight: '100vh' }}>
            <Box sx={{ mb: 3 }}>
                <Breadcrumbs sx={{ mb: 2 }}>
                    <Link
                        color="inherit"
                        href="/hr/org-tree"
                        onClick={(e) => { e.preventDefault(); handleBackToOverview(); }}
                        sx={{ cursor: 'pointer' }}
                    >
                        Tổng quan
                    </Link>
                    <Link
                        color="inherit"
                        href={`/hr/org-tree/${params.id}`}
                        onClick={(e) => { e.preventDefault(); handleBack(); }}
                        sx={{ cursor: 'pointer' }}
                    >
                        {unitName}
                    </Link>
                    <Typography color="text.primary">Giảng viên</Typography>
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
                        Giảng viên: {unitName}
                    </Typography>
                </Box>
            </Box>

            <Box sx={{ width: '100%', height: '600px', overflow: 'auto' }}>
                <Tree
                    data={employeeTreeData}
                    orientation="vertical"
                    pathFunc="step"
                    translate={{ x: 600, y: 50 }}
                    nodeSize={{ x: 300, y: 150 }}
                    renderCustomNodeElement={(rd3tProps) => {
                        const { nodeDatum } = rd3tProps;
                        const isRoot = !nodeDatum.parent;
                        const isLeader = nodeDatum.attributes?.type === 'leader';

                        // Different sizes based on position
                        const width = isRoot ? 350 : isLeader ? 320 : 250;
                        const height = isRoot ? 120 : isLeader ? 100 : 80;

                        return (
                            <g>
                                <rect
                                    width={width}
                                    height={height}
                                    x={-width / 2}
                                    y={-height / 2}
                                    fill={isRoot ? '#1976d2' : isLeader ? '#2e7d32' : '#ffffff'}
                                    stroke={isRoot ? '#1976d2' : isLeader ? '#2e7d32' : '#1976d2'}
                                    strokeWidth="2"
                                    rx="8"
                                    ry="8"
                                />
                                <text
                                    textAnchor="middle"
                                    x="0"
                                    y={isRoot ? -20 : -15}
                                    fontSize={isRoot ? "18" : isLeader ? "16" : "14"}
                                    fontWeight="bold"
                                    fill={isRoot || isLeader ? 'white' : '#1976d2'}
                                    stroke="none"
                                >
                                    {nodeDatum.name}
                                </text>

                                <text
                                    textAnchor="middle"
                                    x="0"
                                    y="0"
                                    fontSize="12"
                                    fill={isRoot || isLeader ? 'rgba(255,255,255,0.9)' : '#666'}
                                    stroke="none"
                                >
                                    {nodeDatum.attributes?.position || 'Giảng viên'}
                                </text>

                                {nodeDatum.attributes?.employee_no && (
                                    <text
                                        textAnchor="middle"
                                        x="0"
                                        y="15"
                                        fontSize="10"
                                        fill={isRoot || isLeader ? 'rgba(255,255,255,0.8)' : '#666'}
                                        stroke="none"
                                    >
                                        Mã: {nodeDatum.attributes?.employee_no}
                                    </text>
                                )}

                                <text
                                    textAnchor="middle"
                                    x="0"
                                    y={nodeDatum.attributes?.employee_no ? "30" : "15"}
                                    fontSize="10"
                                    fill={isRoot || isLeader ? 'rgba(255,255,255,0.8)' : '#666'}
                                    stroke="none"
                                >
                                    {nodeDatum.attributes?.status === 'active' ? 'Hoạt động' : 'Không hoạt động'}
                                </text>
                            </g>
                        );
                    }}
                />
            </Box>
        </Box>
    );
}

