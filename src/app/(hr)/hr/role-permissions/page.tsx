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
    Link2,
    Plus,
    Trash2,
    MoreVertical,
    Eye,
    ChevronDown,
    Layers,
} from 'lucide-react';
import { HR_ROUTES, API_ROUTES } from '@/constants/routes';

interface Role {
    id: string;
    code: string;
    name: string;
}

interface Permission {
    id: string;
    code?: string;
    name: string;
    resource?: string;
    description?: string;
}

interface RolePermission {
    id: string;
    role_id: string;
    permission_id: string;
    roles?: Role;
    Role?: Role;
    permissions?: Permission;
    Permission?: Permission;
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
    const [openBulkDialog, setOpenBulkDialog] = useState(false);
    const [dialogMode, setDialogMode] = useState<'single' | 'bulk'>('single');
    const [formData, setFormData] = useState({
        role_id: '',
        permission_id: ''
    });
    const [bulkFormData, setBulkFormData] = useState({
        role_id: '',
        selected_resource: '',
        selected_permissions: [] as string[],
        assign_full: false
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

    const handleBulkSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (!bulkFormData.role_id || (!bulkFormData.selected_resource && !bulkFormData.assign_full)) {
                setError('Vui lòng chọn vai trò và resource hoặc chọn gán full');
                return;
            }

            let permissionsToAssign: string[] = [];

            if (bulkFormData.assign_full && bulkFormData.selected_resource) {
                // Gán tất cả permissions của resource
                const resourcePermissions = permissions.filter(
                    p => p.resource === bulkFormData.selected_resource
                );
                permissionsToAssign = resourcePermissions.map(p => p.id);
            } else if (bulkFormData.selected_permissions.length > 0) {
                // Gán các permissions đã chọn
                permissionsToAssign = bulkFormData.selected_permissions;
            } else {
                setError('Vui lòng chọn ít nhất một quyền hạn');
                return;
            }

            // Gán nhiều permissions cùng lúc
            const promises = permissionsToAssign.map(permissionId =>
                fetch(API_ROUTES.HR.ROLE_PERMISSIONS, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        role_id: bulkFormData.role_id,
                        permission_id: permissionId
                    }),
                })
            );

            const results = await Promise.all(promises);
            const jsonResults = await Promise.all(results.map(r => r.json()));

            const failed = jsonResults.filter(r => !r.success);
            if (failed.length > 0) {
                setError(`Không thể gán ${failed.length} quyền hạn`);
            } else {
                setOpenBulkDialog(false);
                setBulkFormData({
                    role_id: '',
                    selected_resource: '',
                    selected_permissions: [],
                    assign_full: false
                });
                fetchData();
            }
        } catch (err) {
            setError('Network error occurred');
        }
    };

    const handleDelete = async (rolePermission: RolePermission) => {
        const roleName = rolePermission.roles?.name || rolePermission.Role?.name || 'vai trò này';
        if (!confirm(`Bạn có chắc chắn muốn xóa tất cả phân quyền của vai trò "${roleName}"?`)) {
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
        setDialogMode('single');
        setFormData({ role_id: '', permission_id: '' });
        setOpenDialog(true);
    };

    const handleBulkAdd = () => {
        setDialogMode('bulk');
        setBulkFormData({
            role_id: '',
            selected_resource: '',
            selected_permissions: [],
            assign_full: false
        });
        setOpenBulkDialog(true);
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

    // Group role permissions by role, then by resource
    const groupedRolePermissions = rolePermissions.reduce((acc, rolePermission) => {
        const roleId = rolePermission.role_id;
        const role = rolePermission.roles || rolePermission.Role;
        const permission = rolePermission.permissions || rolePermission.Permission;
        
        if (!role || !permission) return acc;
        
        if (!acc[roleId]) {
            acc[roleId] = {
                role: role,
                permissions: [],
                byResource: {} as Record<string, Permission[]>
            };
        }
        acc[roleId].permissions.push(permission);
        
        // Group by resource
        const resource = permission.resource || 'other';
        if (!acc[roleId].byResource[resource]) {
            acc[roleId].byResource[resource] = [];
        }
        acc[roleId].byResource[resource].push(permission);
        
        return acc;
    }, {} as Record<string, { role: Role; permissions: Permission[]; byResource: Record<string, Permission[]> }>);

    // Group permissions by resource for bulk assignment
    const permissionsByResource = permissions.reduce((acc, perm) => {
        const resource = perm.resource || 'other';
        if (!acc[resource]) {
            acc[resource] = [];
        }
        acc[resource].push(perm);
        return acc;
    }, {} as Record<string, Permission[]>);

    const availableResources = Object.keys(permissionsByResource).sort();

    // Get permissions for selected resource
    const getResourcePermissions = (resource: string) => {
        return permissionsByResource[resource] || [];
    };

    // Check if all permissions of a resource are assigned to a role
    const isResourceFullAssigned = (roleId: string, resource: string) => {
        const rolePerms = rolePermissions
            .filter(rp => rp.role_id === roleId)
            .map(rp => rp.permissions || rp.Permission)
            .filter(Boolean) as Permission[];
        const resourcePerms = permissionsByResource[resource] || [];
        return resourcePerms.every(perm => 
            rolePerms.some(rp => rp?.id === perm.id)
        );
    };

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
                    <Link2 size={32} color="#2e4c92" />
                    <Typography variant="h4" component="h1">
                        Phân quyền Vai trò
                    </Typography>
                </Box>
                <Box display="flex" gap={2}>
                    <Button
                        variant="outlined"
                        onClick={handleBulkAdd}
                        sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                    >
                        <Layers size={20} />
                        Gán theo Resource
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleAdd}
                        sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                    >
                        <Plus size={20} />
                        Thêm Phân quyền
                    </Button>
                </Box>
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
                        <AccordionSummary expandIcon={<ChevronDown size={20} />}>
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
                                        <MoreVertical size={20} />
                                    </IconButton>
                                </Box>
                            </Box>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                {Object.keys(group.byResource).sort().map((resource) => (
                                    <Box key={resource}>
                                        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: 'text.secondary' }}>
                                            {resource} ({group.byResource[resource].length} quyền)
                                        </Typography>
                                        <Box display="flex" flexWrap="wrap" gap={1}>
                                            {group.byResource[resource].map((permission) => (
                                                <Chip
                                                    key={permission.id}
                                                    label={permission.name}
                                                    color="secondary"
                                                    variant="filled"
                                                    size="small"
                                                />
                                            ))}
                                        </Box>
                                    </Box>
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
                        <Eye size={18} style={{ color: 'black' }} />
                    </ListItemIcon>
                    <ListItemText sx={{
                        '& .MuiListItemText-primary': {
                            color: 'black !important'
                        }
                    }}>Xem chi tiết</ListItemText>
                </MenuItem>
                <MenuItem onClick={() => selectedRolePermission && handleDelete(selectedRolePermission)} sx={{ color: 'black !important' }}>
                    <ListItemIcon>
                        <Trash2 size={18} style={{ color: 'black' }} />
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
                                            {permission.name} {permission.code && `(${permission.code})`}
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

            {/* Bulk Assign by Resource Dialog */}
            <Dialog open={openBulkDialog} onClose={() => setOpenBulkDialog(false)} maxWidth="md" fullWidth>
                <DialogTitle>
                    Gán Quyền hạn theo Resource
                </DialogTitle>
                <form onSubmit={handleBulkSubmit}>
                    <DialogContent>
                        <Box display="flex" flexDirection="column" gap={3}>
                            <FormControl fullWidth required>
                                <InputLabel>Vai trò</InputLabel>
                                <Select
                                    value={bulkFormData.role_id}
                                    onChange={(e) => setBulkFormData({ ...bulkFormData, role_id: e.target.value })}
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
                                <InputLabel>Resource</InputLabel>
                                <Select
                                    value={bulkFormData.selected_resource}
                                    onChange={(e) => {
                                        const resource = e.target.value;
                                        const resourcePerms = getResourcePermissions(resource);
                                        setBulkFormData({
                                            ...bulkFormData,
                                            selected_resource: resource,
                                            selected_permissions: bulkFormData.assign_full 
                                                ? resourcePerms.map(p => p.id)
                                                : [],
                                            assign_full: false
                                        });
                                    }}
                                    label="Resource"
                                >
                                    {availableResources.map((resource) => (
                                        <MenuItem key={resource} value={resource}>
                                            {resource} ({permissionsByResource[resource].length} quyền)
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            {bulkFormData.selected_resource && (
                                <>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 2, bgcolor: 'rgba(46, 76, 146, 0.05)', borderRadius: 1 }}>
                                        <input
                                            type="checkbox"
                                            id="assign-full"
                                            checked={bulkFormData.assign_full}
                                            onChange={(e) => {
                                                const assignFull = e.target.checked;
                                                const resourcePerms = getResourcePermissions(bulkFormData.selected_resource);
                                                setBulkFormData({
                                                    ...bulkFormData,
                                                    assign_full: assignFull,
                                                    selected_permissions: assignFull 
                                                        ? resourcePerms.map(p => p.id)
                                                        : []
                                                });
                                            }}
                                            style={{ width: 18, height: 18, cursor: 'pointer' }}
                                        />
                                        <label htmlFor="assign-full" style={{ cursor: 'pointer', flex: 1 }}>
                                            <Typography variant="body2" fontWeight={500}>
                                                Gán tất cả quyền hạn của resource này ({getResourcePermissions(bulkFormData.selected_resource).length} quyền)
                                            </Typography>
                                        </label>
                                    </Box>

                                    {!bulkFormData.assign_full && (
                                        <Box sx={{ maxHeight: 300, overflowY: 'auto', border: '1px solid #e0e0e0', borderRadius: 1, p: 2 }}>
                                            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                                                Chọn quyền hạn ({bulkFormData.selected_permissions.length} đã chọn)
                                            </Typography>
                                            <Box display="flex" flexDirection="column" gap={1}>
                                                {getResourcePermissions(bulkFormData.selected_resource).map((permission) => (
                                                    <Box
                                                        key={permission.id}
                                                        sx={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: 1,
                                                            p: 1,
                                                            borderRadius: 1,
                                                            '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.02)' }
                                                        }}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={bulkFormData.selected_permissions.includes(permission.id)}
                                                            onChange={(e) => {
                                                                if (e.target.checked) {
                                                                    setBulkFormData({
                                                                        ...bulkFormData,
                                                                        selected_permissions: [...bulkFormData.selected_permissions, permission.id]
                                                                    });
                                                                } else {
                                                                    setBulkFormData({
                                                                        ...bulkFormData,
                                                                        selected_permissions: bulkFormData.selected_permissions.filter(id => id !== permission.id)
                                                                    });
                                                                }
                                                            }}
                                                            style={{ width: 18, height: 18, cursor: 'pointer' }}
                                                        />
                                                        <Box sx={{ flex: 1 }}>
                                                            <Typography variant="body2" fontWeight={500}>
                                                                {permission.name}
                                                            </Typography>
                                                            {permission.description && (
                                                                <Typography variant="caption" color="text.secondary">
                                                                    {permission.description}
                                                                </Typography>
                                                            )}
                                                        </Box>
                                                    </Box>
                                                ))}
                                            </Box>
                                        </Box>
                                    )}
                                </>
                            )}
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setOpenBulkDialog(false)}>
                            Hủy
                        </Button>
                        <Button 
                            type="submit" 
                            variant="contained"
                            disabled={!bulkFormData.role_id || (!bulkFormData.selected_resource && !bulkFormData.assign_full) || (!bulkFormData.assign_full && bulkFormData.selected_permissions.length === 0)}
                        >
                            Gán {bulkFormData.assign_full || bulkFormData.selected_permissions.length > 0 
                                ? `(${bulkFormData.assign_full ? getResourcePermissions(bulkFormData.selected_resource).length : bulkFormData.selected_permissions.length} quyền)`
                                : ''}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>
        </Box>
    );
}
