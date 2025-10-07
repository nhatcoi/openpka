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
    TextField,
    Chip,
    Tooltip,
    Menu,
    ListItemIcon,
    ListItemText,
    MenuItem,
} from '@mui/material';
import {
    Security as SecurityIcon,
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    MoreVert as MoreVertIcon,
    Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { HR_ROUTES, API_ROUTES } from '@/constants/routes';

interface Permission {
    id: string;
    code: string;
    name: string;
    role_permission: Array<{
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
    const router = useRouter();

    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [editingPermission, setEditingPermission] = useState<Permission | null>(null);
    const [formData, setFormData] = useState({
        code: '',
        name: ''
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
                setFormData({ code: '', name: '' });
                fetchData();
            } else {
                setError(result.error || 'Failed to save permission');
            }
        } catch (err) {
            setError('Network error occurred');
        }
    };

    const handleDelete = async (permission: Permission) => {
        if (!confirm(`Bạn có chắc chắn muốn xóa quyền "${permission.name}"?`)) {
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
            code: permission.code,
            name: permission.name
        });
        setOpenDialog(true);
        handleMenuClose();
    };

    const handleAdd = () => {
        setEditingPermission(null);
        setFormData({ code: '', name: '' });
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
                    <SecurityIcon color="primary" sx={{ fontSize: 32 }} />
                    <Typography variant="h4" component="h1">
                        Quản lý Quyền hạn
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleAdd}
                >
                    Thêm Quyền hạn
                </Button>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Mã quyền</TableCell>
                            <TableCell>Tên quyền</TableCell>
                            <TableCell>Số vai trò</TableCell>
                            <TableCell align="center">Thao tác</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {permissions.map((permission) => (
                            <TableRow key={permission.id}>
                                <TableCell>
                                    <Typography variant="body2" fontWeight="medium">
                                        {permission.code}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Typography variant="body2">
                                        {permission.name}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        label={permission.RolePermission.length}
                                        color="primary"
                                        variant="outlined"
                                        size="small"
                                    />
                                </TableCell>
                                <TableCell align="center">
                                    <IconButton
                                        size="small"
                                        onClick={(e) => handleMenuOpen(e, permission)}
                                        color="primary"
                                    >
                                        <MoreVertIcon />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

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
                <MenuItem onClick={() => selectedPermission && handleEdit(selectedPermission)} sx={{ color: 'black !important' }}>
                    <ListItemIcon>
                        <EditIcon fontSize="small" sx={{ color: 'black !important' }} />
                    </ListItemIcon>
                    <ListItemText sx={{
                        '& .MuiListItemText-primary': {
                            color: 'black !important'
                        }
                    }}>Chỉnh sửa</ListItemText>
                </MenuItem>
                <MenuItem onClick={() => selectedPermission && handleDelete(selectedPermission)} sx={{ color: 'black !important' }}>
                    <ListItemIcon>
                        <DeleteIcon fontSize="small" sx={{ color: 'black !important' }} />
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
                                required
                                fullWidth
                            />
                            <TextField
                                label="Tên quyền"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                                fullWidth
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
