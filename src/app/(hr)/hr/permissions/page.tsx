'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useConfirmDialog } from '@/components/dialogs/ConfirmDialogProvider';
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
    TextField,
    Chip,
    Tooltip,
    Menu,
    ListItemIcon,
    ListItemText,
    MenuItem,
    Accordion,
    AccordionSummary,
    AccordionDetails,
} from '@mui/material';
import {
    Shield,
    Plus,
    Edit,
    Trash2,
    MoreVertical,
    Eye,
    ChevronDown,
    User,
    Building2,
    Users,
    GraduationCap,
    Package,
} from 'lucide-react';
import { HR_ROUTES, API_ROUTES } from '@/constants/routes';

interface Permission {
    id: string;
    code?: string;
    name: string;
    description?: string;
    resource?: string;
    action?: string;
    RolePermission?: Array<{
        id: string;
        roles: {
            id: string;
            code: string;
            name: string;
        };
    }>;
    role_permission?: Array<{
        id: string;
        roles: {
            id: string;
            code: string;
            name: string;
        };
    }>;
}

export default function PermissionsPage() {
    const { data: session, status } = useSession();
    const confirmDialog = useConfirmDialog();
    const router = useRouter();

    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [editingPermission, setEditingPermission] = useState<Permission | null>(null);
    const [formData, setFormData] = useState({
        code: '',
        name: '',
        description: '',
        resource: '',
        action: ''
    });

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [selectedPermission, setSelectedPermission] = useState<Permission | null>(null);

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
            const response = await fetch(API_ROUTES.HR.PERMISSIONS);
            const result = await response.json();

            if (result.success) {
                setPermissions(result.data);
            } else {
                setError(result.error || 'Failed to fetch permissions');
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
            const url = editingPermission
                ? API_ROUTES.HR.PERMISSIONS_BY_ID(editingPermission.id)
                : API_ROUTES.HR.PERMISSIONS;
            const method = editingPermission ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const result = await response.json();

            if (result.success) {
                setOpenDialog(false);
                setEditingPermission(null);
                setFormData({ code: '', name: '', description: '', resource: '', action: '' });
                fetchData();
            } else {
                setError(result.error || 'Failed to save permission');
            }
        } catch (err) {
            setError('Network error occurred');
        }
    };

    const handleDelete = async (permission: Permission) => {
        const confirmed = await confirmDialog({
            title: 'Xóa quyền',
            message: `Bạn có chắc chắn muốn xóa quyền "${permission.name}"?`,
            confirmText: 'Xóa',
            cancelText: 'Hủy',
            destructive: true,
        });
        if (!confirmed) {
            return;
        }

        try {
            const response = await fetch(API_ROUTES.HR.PERMISSIONS_BY_ID(permission.id), {
                method: 'DELETE',
            });

            const result = await response.json();

            if (result.success) {
                fetchData();
            } else {
                setError(result.error || 'Failed to delete permission');
            }
        } catch (err) {
            setError('Network error occurred');
        }
    };

    const handleEdit = (permission: Permission) => {
        setEditingPermission(permission);
        setFormData({
            code: permission.code || '',
            name: permission.name,
            description: permission.description || '',
            resource: permission.resource || '',
            action: permission.action || ''
        });
        setOpenDialog(true);
        handleMenuClose();
    };

    const handleAdd = () => {
        setEditingPermission(null);
        setFormData({ code: '', name: '', description: '', resource: '', action: '' });
        setOpenDialog(true);
    };

    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, permission: Permission) => {
        setAnchorEl(event.currentTarget);
        setSelectedPermission(permission);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        setSelectedPermission(null);
    };

    const handleViewDetails = () => {
        if (selectedPermission) {
            // TODO: Navigate to permission details page
            console.log('View details for permission:', selectedPermission.id);
        }
        handleMenuClose();
    };

    // Group permissions by main module
    const groupPermissionsByModule = (perms: Permission[]) => {
        const groups: Record<string, Permission[]> = {
            'user': [],
            'org': [],
            'hr': [],
            'tms': [],
            'other': []
        };
        
        perms.forEach(perm => {
            const name = perm.name.toLowerCase();
            let mainModule = 'other';
            
            // Determine main module based on permission name prefix
            if (name.startsWith('user') || name.startsWith('auth') || name.startsWith('profile')) {
                mainModule = 'user';
            } else if (name.startsWith('org_unit') || name.startsWith('org.')) {
                mainModule = 'org';
            } else if (name.startsWith('hr')) {
                mainModule = 'hr';
            } else if (name.startsWith('tms')) {
                mainModule = 'tms';
            }
            
            groups[mainModule].push(perm);
        });
        
        // Sort permissions within each module by resource, then by name
        Object.keys(groups).forEach(module => {
            groups[module].sort((a, b) => {
                const resourceA = a.resource || '';
                const resourceB = b.resource || '';
                if (resourceA !== resourceB) {
                    return resourceA.localeCompare(resourceB);
                }
                return a.name.localeCompare(b.name);
            });
        });
        
        // Define module order
        const moduleOrder = ['user', 'org', 'hr', 'tms', 'other'];
        const sortedModules = moduleOrder.filter(module => groups[module].length > 0);
        
        return { groups, sortedModules };
    };

    const getModuleDisplayName = (module: string) => {
        const moduleNames: Record<string, string> = {
            'user': 'Người dùng',
            'org': 'Tổ chức',
            'hr': 'Nhân sự',
            'tms': 'Quản lý đào tạo',
            'other': 'Khác',
        };
        
        return moduleNames[module] || module;
    };

    const getModuleIcon = (module: string) => {
        const icons: Record<string, React.ReactNode> = {
            'user': <User size={20} />,
            'org': <Building2 size={20} />,
            'hr': <Users size={20} />,
            'tms': <GraduationCap size={20} />,
            'other': <Package size={20} />,
        };
        
        return icons[module] || <Package size={20} />;
    };

    const getModuleColor = (module: string) => {
        const colors: Record<string, string> = {
            'user': '#1976d2',      // Blue
            'org': '#2e7d32',       // Green
            'hr': '#ed6c02',        // Orange
            'tms': '#9c27b0',       // Purple
            'other': '#757575',     // Grey
        };
        
        return colors[module] || '#757575';
    };

    const { groups, sortedModules } = groupPermissionsByModule(permissions);

    if (loading && permissions.length === 0) {
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
                    <Shield size={32} color="#2e4c92" />
                    <Typography variant="h4" component="h1">
                        Quản lý Quyền hạn
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    onClick={handleAdd}
                    sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                >
                    <Plus size={20} />
                    Thêm Quyền hạn
                </Button>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {sortedModules.map((module) => {
                    const moduleColor = getModuleColor(module);
                    return (
                        <Accordion key={module} defaultExpanded={module === 'hr'}>
                            <AccordionSummary
                                expandIcon={<ChevronDown size={20} />}
                                sx={{
                                    backgroundColor: `${moduleColor}08`,
                                    borderLeft: `4px solid ${moduleColor}`,
                                    '&:hover': {
                                        backgroundColor: `${moduleColor}12`,
                                    },
                                }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                        <Box sx={{ color: moduleColor, display: 'flex', alignItems: 'center' }}>
                                            {getModuleIcon(module)}
                                        </Box>
                                        <Typography variant="h6" sx={{ fontWeight: 600, color: moduleColor }}>
                                            {getModuleDisplayName(module)}
                                        </Typography>
                                    </Box>
                                    <Chip
                                        label={`${groups[module].length} quyền`}
                                        size="small"
                                        sx={{
                                            backgroundColor: `${moduleColor}15`,
                                            color: moduleColor,
                                            borderColor: moduleColor,
                                        }}
                                        variant="outlined"
                                    />
                                </Box>
                            </AccordionSummary>
                            <AccordionDetails sx={{ p: 0 }}>
                                <TableContainer component={Paper} variant="outlined">
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow sx={{ backgroundColor: `${moduleColor}05` }}>
                                                <TableCell sx={{ fontWeight: 600 }}>Mã quyền</TableCell>
                                                <TableCell sx={{ fontWeight: 600 }}>Tên quyền</TableCell>
                                                <TableCell sx={{ fontWeight: 600 }}>Resource</TableCell>
                                                <TableCell sx={{ fontWeight: 600 }}>Mô tả</TableCell>
                                                <TableCell sx={{ fontWeight: 600 }} align="center">Số vai trò</TableCell>
                                                <TableCell sx={{ fontWeight: 600 }} align="center">Thao tác</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {groups[module].map((permission) => {
                                                const rolePermissions = permission.RolePermission || permission.role_permission || [];
                                                return (
                                                    <TableRow 
                                                        key={permission.id}
                                                        sx={{
                                                            '&:hover': {
                                                                backgroundColor: `${moduleColor}08`,
                                                            },
                                                        }}
                                                    >
                                                        <TableCell>
                                                            <Typography variant="body2" fontWeight="medium" sx={{ fontFamily: 'monospace' }}>
                                                                {permission.code || permission.name}
                                                            </Typography>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Typography variant="body2">
                                                                {permission.name}
                                                            </Typography>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Typography 
                                                                variant="body2" 
                                                                sx={{ 
                                                                    fontFamily: 'monospace',
                                                                    color: moduleColor,
                                                                    fontWeight: 500,
                                                                }}
                                                            >
                                                                {permission.resource || '-'}
                                                            </Typography>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Typography 
                                                                variant="body2" 
                                                                color="text.secondary"
                                                                sx={{
                                                                    maxWidth: 400,
                                                                    overflow: 'hidden',
                                                                    textOverflow: 'ellipsis',
                                                                    whiteSpace: 'nowrap',
                                                                }}
                                                            >
                                                                {permission.description || '-'}
                                                            </Typography>
                                                        </TableCell>
                                                        <TableCell align="center">
                                                            <Chip
                                                                label={rolePermissions.length}
                                                                sx={{
                                                                    backgroundColor: `${moduleColor}15`,
                                                                    color: moduleColor,
                                                                    borderColor: moduleColor,
                                                                }}
                                                                variant="outlined"
                                                                size="small"
                                                            />
                                                        </TableCell>
                                                        <TableCell align="center">
                                                            <IconButton
                                                                size="small"
                                                                onClick={(e) => handleMenuOpen(e, permission)}
                                                                sx={{ color: moduleColor }}
                                                            >
                                                                <MoreVertical size={20} />
                                                            </IconButton>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </AccordionDetails>
                        </Accordion>
                    );
                })}
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
                <MenuItem onClick={() => selectedPermission && handleEdit(selectedPermission)} sx={{ color: 'black !important' }}>
                    <ListItemIcon>
                        <Edit size={18} style={{ color: 'black' }} />
                    </ListItemIcon>
                    <ListItemText sx={{
                        '& .MuiListItemText-primary': {
                            color: 'black !important'
                        }
                    }}>Chỉnh sửa</ListItemText>
                </MenuItem>
                <MenuItem onClick={() => selectedPermission && handleDelete(selectedPermission)} sx={{ color: 'black !important' }}>
                    <ListItemIcon>
                        <Trash2 size={18} style={{ color: 'black' }} />
                    </ListItemIcon>
                    <ListItemText sx={{
                        '& .MuiListItemText-primary': {
                            color: 'black !important'
                        }
                    }}>Xóa</ListItemText>
                </MenuItem>
            </Menu>

            {/* Add/Edit Dialog */}
            <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {editingPermission ? 'Chỉnh sửa Quyền hạn' : 'Thêm Quyền hạn Mới'}
                </DialogTitle>
                <form onSubmit={handleSubmit}>
                    <DialogContent>
                        <Box display="flex" flexDirection="column" gap={3}>
                            <TextField
                                label="Mã quyền"
                                value={formData.code}
                                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                fullWidth
                                helperText="Mã định danh quyền (ví dụ: hr.employee.view)"
                            />
                            <TextField
                                label="Tên quyền"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                                fullWidth
                                helperText="Tên đầy đủ của quyền"
                            />
                            <TextField
                                label="Mô tả"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                fullWidth
                                multiline
                                rows={3}
                                helperText="Mô tả chi tiết về quyền này"
                            />
                            <TextField
                                label="Resource"
                                value={formData.resource}
                                onChange={(e) => setFormData({ ...formData, resource: e.target.value })}
                                fullWidth
                                helperText="Tài nguyên (ví dụ: hr.employee)"
                            />
                            <TextField
                                label="Action"
                                value={formData.action}
                                onChange={(e) => setFormData({ ...formData, action: e.target.value })}
                                fullWidth
                                helperText="Hành động (ví dụ: view, create, update, delete)"
                            />
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setOpenDialog(false)}>
                            Hủy
                        </Button>
                        <Button type="submit" variant="contained">
                            {editingPermission ? 'Cập nhật' : 'Thêm'}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>
        </Box>
    );
}
