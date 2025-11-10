'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
    Box,
    Container,
    Typography,
    Avatar,
    Card,
    CardContent,
    Chip,
    Divider,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    CircularProgress,
    Alert,
    Button,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
} from '@mui/material';
import {
    Person,
    Email,
    Phone,
    Home,
    CalendarToday,
    Badge,
    Security,
    Work,
    Edit,
    ArrowBack,
} from '@mui/icons-material';

interface UserData {
    user: {
        id: string;
        username: string;
        email: string;
        full_name: string;
        phone?: string;
        address?: string;
        dob?: string;
        gender?: string;
        status?: string;
        last_login_at?: string;
        created_at?: string;
        updated_at?: string;
    };
    roles: Array<{
        id: string;
        name: string;
        description?: string;
        assigned_at?: string;
    }>;
    permissions: Array<{
        id: string;
        name: string;
        description?: string;
        resource: string;
        action: string;
    }>;
    employee: Array<{
        id: string;
        employee_no?: string;
        employment_type?: string;
        status?: string;
        hired_at?: string;
        terminated_at?: string;
        org_assignments?: Array<{
            id: string;
            org_unit?: {
                id: string;
                name: string;
                code?: string;
            } | null;
        }>;
    }>;
}

export default function MePage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [userData, setUserData] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (status === 'loading') return;
        if (!session) {
            router.push('/auth/signin');
            return;
        }

        fetchUserData();
    }, [session, status]);

    const fetchUserData = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/me');
            const result = await response.json();

            if (result.success) {
                setUserData(result.data);
            } else {
                setError(result.error || 'Failed to fetch user data');
            }
        } catch (err) {
            console.error('Error fetching user data:', err);
            setError('Failed to fetch user data');
        } finally {
            setLoading(false);
        }
    };

    if (status === 'loading' || loading) {
        return (
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    minHeight: '100vh',
                }}
            >
                <CircularProgress />
            </Box>
        );
    }

    if (!session) {
        return null;
    }

    if (error) {
        return (
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Alert severity="error">{error}</Alert>
            </Container>
        );
    }

    if (!userData) {
        return (
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Alert severity="warning">No user data available</Alert>
            </Container>
        );
    }

    const { user, roles, permissions, employee } = userData;

    // Group permissions by resource
    const permissionsByResource = permissions.reduce((acc, perm) => {
        const resource = perm.resource || 'other';
        if (!acc[resource]) {
            acc[resource] = [];
        }
        acc[resource].push(perm);
        return acc;
    }, {} as Record<string, typeof permissions>);

    const formatDate = (value?: string) =>
        value ? new Date(value).toLocaleDateString('vi-VN') : '(trống)';
    const formatDateTime = (value?: string) =>
        value ? new Date(value).toLocaleString('vi-VN') : '(trống)';
    const formattedGender =
        user.gender === 'MALE' ? 'Nam'
            : user.gender === 'FEMALE' ? 'Nữ'
                : user.gender || '(trống)';

    const infoItems = [
        {
            icon: <Email fontSize="small" />,
            label: 'Email',
            value: user.email || '(trống)',
        },
        {
            icon: <Phone fontSize="small" />,
            label: 'Số điện thoại',
            value: user.phone || '(trống)',
        },
        {
            icon: <Home fontSize="small" />,
            label: 'Địa chỉ',
            value: user.address || '(trống)',
        },
        {
            icon: <CalendarToday fontSize="small" />,
            label: 'Ngày sinh',
            value: formatDate(user.dob),
        },
        {
            icon: <Person fontSize="small" />,
            label: 'Giới tính',
            value: formattedGender,
        },
        {
            icon: <Badge fontSize="small" />,
            label: 'Trạng thái',
            value: user.status || '(trống)',
        },
        {
            icon: <CalendarToday fontSize="small" />,
            label: 'Đăng nhập lần cuối',
            value: formatDateTime(user.last_login_at),
        },
        {
            icon: <CalendarToday fontSize="small" />,
            label: 'Ngày tạo tài khoản',
            value: formatDateTime(user.created_at),
        },
        {
            icon: <CalendarToday fontSize="small" />,
            label: 'Cập nhật lần cuối',
            value: formatDateTime(user.updated_at),
        },
    ];

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
                <Button
                    startIcon={<ArrowBack />}
                    onClick={() => router.back()}
                    variant="outlined"
                >
                    Quay lại
                </Button>
                <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
                    Thông tin cá nhân
                </Typography>
            </Stack>

            <Box
                sx={{
                    display: 'grid',
                    gap: 3,
                    gridTemplateColumns: { xs: '1fr', md: '360px 1fr' },
                    alignItems: 'stretch',
                }}
            >
                <Card
                    sx={{
                        backgroundColor: '#2e4c92',
                        color: '#ffffff',
                        borderRadius: 3,
                        boxShadow: '0 18px 40px rgba(46, 76, 146, 0.35)',
                        overflow: 'hidden',
                    }}
                >
                    <CardContent sx={{ p: 4 }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
                            <Avatar
                                sx={{
                                    width: 120,
                                    height: 120,
                                    bgcolor: 'rgba(255, 255, 255, 0.15)',
                                    mb: 2,
                                    fontSize: '3rem',
                                    border: '3px solid rgba(255, 255, 255, 0.35)',
                                }}
                            >
                                {user.full_name.charAt(0).toUpperCase()}
                            </Avatar>
                            <Typography variant="h5" component="h2" gutterBottom>
                                {user.full_name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                @{user.username}
                            </Typography>
                            <Chip
                                label={user.status || '(trống)'}
                                variant="outlined"
                                size="small"
                                sx={{
                                    mt: 1,
                                    color: '#ffffff',
                                    borderColor: 'rgba(255, 255, 255, 0.45)',
                                    backgroundColor: user.status === 'ACTIVE'
                                        ? 'rgba(82, 196, 26, 0.25)'
                                        : 'rgba(255, 255, 255, 0.12)',
                                }}
                            />
                        </Box>

                        <Divider sx={{ my: 2, borderColor: 'rgba(255, 255, 255, 0.18)' }} />

                        <List disablePadding>
                            {infoItems.map(({ icon, label, value }) => (
                                <ListItem key={label} sx={{ py: 0.75 }}>
                                    <ListItemIcon sx={{ color: 'rgba(255, 255, 255, 0.75)', minWidth: 40 }}>
                                        {icon}
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={label}
                                        secondary={value}
                                        primaryTypographyProps={{
                                            fontWeight: 600,
                                            color: '#ffffff',
                                        }}
                                        secondaryTypographyProps={{
                                            color: 'rgba(255, 255, 255, 0.88)',
                                        }}
                                    />
                                </ListItem>
                            ))}
                        </List>
                    </CardContent>
                </Card>

                <Stack spacing={3}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <Badge sx={{ mr: 1 }} />
                                <Typography variant="h6" component="h2">
                                    Vai trò ({roles.length})
                                </Typography>
                            </Box>
                            <Divider sx={{ mb: 2 }} />
                            {roles.length > 0 ? (
                                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                    {roles.map((role) => (
                                        <Chip
                                            key={role.id}
                                            label={role.name}
                                            color="primary"
                                            variant="outlined"
                                            sx={{ mb: 1 }}
                                        />
                                    ))}
                                </Stack>
                            ) : (
                                <Typography variant="body2" color="text.secondary">
                                    (trống)
                                </Typography>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <Security sx={{ mr: 1 }} />
                                <Typography variant="h6" component="h2">
                                    Quyền hạn ({permissions.length})
                                </Typography>
                            </Box>
                            <Divider sx={{ mb: 2 }} />
                            {permissions.length > 0 ? (
                                <Box>
                                    {Object.entries(permissionsByResource).map(([resource, perms]) => (
                                        <Box key={resource} sx={{ mb: 3 }}>
                                            <Typography variant="subtitle2" color="primary" sx={{ mb: 1, fontWeight: 'bold' }}>
                                                {resource}
                                            </Typography>
                                            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                                {perms.map((perm) => (
                                                    <Chip
                                                        key={perm.id}
                                                        label={perm.name}
                                                        size="small"
                                                        variant="outlined"
                                                        sx={{ mb: 0.5 }}
                                                    />
                                                ))}
                                            </Stack>
                                        </Box>
                                    ))}
                                </Box>
                            ) : (
                                <Typography variant="body2" color="text.secondary">
                                    (trống)
                                </Typography>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <Work sx={{ mr: 1 }} />
                                <Typography variant="h6" component="h2">
                                    Thông tin nhân viên
                                </Typography>
                            </Box>
                            <Divider sx={{ mb: 2 }} />
                            {employee.length > 0 ? (
                                <TableContainer>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Mã nhân viên</TableCell>
                                                <TableCell>Loại hợp đồng</TableCell>
                                                <TableCell>Trạng thái</TableCell>
                                                <TableCell>Ngày vào làm</TableCell>
                                                <TableCell>Ngày kết thúc</TableCell>
                                                <TableCell>Đơn vị</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {employee.map((emp) => (
                                                <TableRow key={emp.id}>
                                                    <TableCell>{emp.employee_no || '(trống)'}</TableCell>
                                                    <TableCell>{emp.employment_type || '(trống)'}</TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            label={emp.status || '(trống)'}
                                                            size="small"
                                                            color={emp.status === 'ACTIVE' ? 'success' : 'default'}
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        {emp.hired_at
                                                            ? new Date(emp.hired_at).toLocaleDateString('vi-VN')
                                                            : '(trống)'}
                                                    </TableCell>
                                                    <TableCell>
                                                        {emp.terminated_at
                                                            ? new Date(emp.terminated_at).toLocaleDateString('vi-VN')
                                                            : '(trống)'}
                                                    </TableCell>
                                                    <TableCell>
                                                        {emp.org_assignments && emp.org_assignments.length > 0
                                                            ? emp.org_assignments
                                                                .map((oa) => oa.org_unit?.name)
                                                                .filter(Boolean)
                                                                .join(', ') || '(trống)'
                                                            : '(trống)'}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            ) : (
                                <Typography variant="body2" color="text.secondary">
                                    (trống)
                                </Typography>
                            )}
                        </CardContent>
                    </Card>
                </Stack>
            </Box>
        </Container>
    );
}

