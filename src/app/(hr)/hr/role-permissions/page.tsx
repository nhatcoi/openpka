'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
    Box,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Alert,
    CircularProgress,
    Button,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Chip,
    Menu,
    ListItemIcon,
    ListItemText,
    Accordion,
    AccordionSummary,
    AccordionDetails,
} from '@mui/material';
import {
    Link as LinkIcon,
    Add as AddIcon,
    Delete as DeleteIcon,
    MoreVert as MoreVertIcon,
    Visibility as VisibilityIcon,
    ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import { HR_ROUTES, API_ROUTES } from '@/constants/routes';

interface Role {
    id: string;
    code: string;
    name: string;
}

interface Permission {
    id: string;
    code: string;
    name: string;
}

interface RolePermission {
    id: string;
    role_id: string;
    permission_id: string;
    roles: Role;
    permissions: Permission;
}

export default function RolePermissionsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    const [rolePermissions, setRolePermissions] = useState<RolePermission[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [formData, setFormData] = useState({
        role_id: '',
        permission_id: ''
    });

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [selectedRolePermission, setSelectedRolePermission] = useState<RolePermission | null>(null);

    useEffect(() => {
        if (status === 'loading') return;
        if (!session) {
            router.push('/auth/signin');
            return;
        }
        fetchData();
    }, [session, status, router]);

    const fetchData = async () => {
        try {
            setLoading(true);

            // Fetch role permissions, roles, and permissions in parallel
            const [rolePermissionsRes, rolesRes, permissionsRes] = await Promise.all([
                fetch(API_ROUTES.HR.ROLE_PERMISSIONS),
                fetch(API_ROUTES.HR.ROLES),
                fetch(API_ROUTES.HR.PERMISSIONS)
            ]);

            const [rolePermissionsResult, rolesResult, permissionsResult] = await Promise.all([
                rolePermissionsRes.json(),
                rolesRes.json(),
                permissionsRes.json()
            ]);

            if (rolePermissionsResult.success) {
                setRolePermissions(rolePermissionsResult.data);
            } else {
                setError(rolePermissionsResult.error || 'Failed to fetch role permissions');
            }

            if (rolesResult.success) {
                setRoles(rolesResult.data);
            } else {
                setError(rolesResult.error || 'Failed to fetch roles');
            }

            if (permissionsResult.success) {
                setPermissions(permissionsResult.data);
            } else {
                setError(permissionsResult.error || 'Failed to fetch permissions');
            }
        } catch (err) {
            setError('Network error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await fetch(API_ROUTES.HR.ROLE_PERMISSIONS, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const result = await response.json();

            if (result.success) {
                setOpenDialog(false);
                setFormData({ role_id: '', permission_id: '' });
                fetchData();
            } else {
                setError(result.error || 'Failed to create role permission');
            }
        } catch (err) {
            setError('Network error occurred');
        }
    };

    const handleDelete = async (rolePermission: RolePermission) => {
        if (!confirm(`Bạn có chắc chắn muốn xóa tất cả phân quyền của vai trò "${rolePermission.Role.name}"?`)) {
            return;
        }

        try {
            // Delete all role permissions for this role
            const rolePermissionsToDelete = rolePermissions.filter(rp => rp.role_id === rolePermission.role_id);

            for (const rp of rolePermissionsToDelete) {
                const response = await fetch(API_ROUTES.HR.ROLE_PERMISSIONS_BY_ID(rp.id), {
                    method: 'DELETE',
                });

                const result = await response.json();
                if (!result.success) {
                    setError(result.error || 'Failed to delete role permission');
                    return;
                }
            }

            fetchData();
        } catch (err) {
            setError('Network error occurred');
        }
    };

    const handleAdd = () => {
        setFormData({ role_id: '', permission_id: '' });
        setOpenDialog(true);
    };

    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, rolePermission: RolePermission) => {
        setAnchorEl(event.currentTarget);
        setSelectedRolePermission(rolePermission);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        setSelectedRolePermission(null);
    };

    const handleViewDetails = () => {
        if (selectedRolePermission) {
            // TODO: Navigate to role permission details page
            console.log('View details for role permission:', selectedRolePermission.id);
        }
        handleMenuClose();
    };

    // Group role permissions by role
    const groupedRolePermissions = rolePermissions.reduce((acc, rolePermission) => {
        const roleId = rolePermission.role_id;
        if (!acc[roleId]) {
            acc[roleId] = {
                role: rolePermission.Role,
                permissions: []
            };
        }
        acc[roleId].permissions.push(rolePermission.Permission);
        return acc;
    }, {} as Record<string, { role: Role; permissions: Permission[] }>);

    if (loading && rolePermissions.length === 0) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Box display="flex" alignItems="center" gap={2}>
                    <LinkIcon color="primary" sx={{ fontSize: 32 }} />
                    <Typography variant="h4" component="h1">
                        Phân quyền Vai trò
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleAdd}
                >
                    Thêm Phân quyền
                </Button>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {/* Grouped by Role */}
            <Box sx={{ mb: 3 }}>
                {Object.values(groupedRolePermissions).map((group) => (
                    <Accordion key={group.role.id} sx={{ mb: 1 }}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Box display="flex" alignItems="center" gap={2} width="100%">
                                <Box>
                                    <Typography variant="h6" fontWeight="medium">
                                        {group.role.name}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {group.role.code}
                                    </Typography>
                                </Box>
                                <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Chip
                                        label={`${group.permissions.length} quyền hạn`}
                                        color="primary"
                                        variant="outlined"
                                        size="small"
                                    />
                                    <IconButton
                                        size="small"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleMenuOpen(e, {
                                                id: group.role.id,
                                                role_id: group.role.id,
                                                permission_id: '',
                                                roles: group.role,
                                                permissions: { id: '', code: '', name: '' }
                                            } as RolePermission);
                                        }}
                                        color="primary"
                                    >
                                        <MoreVertIcon />
                                    </IconButton>
                                </Box>
                            </Box>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Box display="flex" flexWrap="wrap" gap={1}>
                                {group.permissions.map((permission) => (
                                    <Chip
                                        key={permission.id}
                                        label={`${permission.name} (${permission.code})`}
                                        color="secondary"
                                        variant="filled"
                                        size="small"
                                    />
                                ))}
                            </Box>
                        </AccordionDetails>
                    </Accordion>
                ))}
            </Box>


            {/* Actions Menu */}
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
            >
                <MenuItem onClick={handleViewDetails} sx={{ color: 'black !important' }}>
                    <ListItemIcon>
                        <VisibilityIcon fontSize="small" sx={{ color: 'black !important' }} />
                    </ListItemIcon>
                    <ListItemText sx={{
                        '& .MuiListItemText-primary': {
                            color: 'black !important'
                        }
                    }}>Xem chi tiết</ListItemText>
                </MenuItem>
                <MenuItem onClick={() => selectedRolePermission && handleDelete(selectedRolePermission)} sx={{ color: 'black !important' }}>
                    <ListItemIcon>
                        <DeleteIcon fontSize="small" sx={{ color: 'black !important' }} />
                    </ListItemIcon>
                    <ListItemText sx={{
                        '& .MuiListItemText-primary': {
                            color: 'black !important'
                        }
                    }}>Xóa tất cả quyền hạn</ListItemText>
                </MenuItem>
            </Menu>

            {/* Add Dialog */}
            <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>
                    Thêm Phân quyền Mới
                </DialogTitle>
                <form onSubmit={handleSubmit}>
                    <DialogContent>
                        <Box display="flex" flexDirection="column" gap={3}>
                            <FormControl fullWidth required>
                                <InputLabel>Vai trò</InputLabel>
                                <Select
                                    value={formData.role_id}
                                    onChange={(e) => setFormData({ ...formData, role_id: e.target.value })}
                                    label="Vai trò"
                                >
                                    {roles.map((role) => (
                                        <MenuItem key={role.id} value={role.id}>
                                            {role.name} ({role.code})
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <FormControl fullWidth required>
                                <InputLabel>Quyền hạn</InputLabel>
                                <Select
                                    value={formData.permission_id}
                                    onChange={(e) => setFormData({ ...formData, permission_id: e.target.value })}
                                    label="Quyền hạn"
                                >
                                    {permissions.map((permission) => (
                                        <MenuItem key={permission.id} value={permission.id}>
                                            {permission.name} ({permission.code})
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setOpenDialog(false)}>
                            Hủy
                        </Button>
                        <Button type="submit" variant="contained">
                            Thêm
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>
        </Box>
    );
}
