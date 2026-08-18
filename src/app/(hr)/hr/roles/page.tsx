'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useConfirmDialog } from '@/components/dialogs/confirm-dialog-provider';
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
    Work as WorkIcon,
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    MoreVert as MoreVertIcon,
    Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { HR_ROUTES } from '@/constants/routes';
import { useRoles, useCreateRole, useUpdateRole, useDeleteRole, Role } from '@/features/hr';

export default function RolesPage() {
    const { data: session, status } = useSession();
    const confirmDialog = useConfirmDialog();
    const router = useRouter();

    const { data: roles = [], isLoading: loading, error: queryError } = useRoles();
    const { mutateAsync: createRole } = useCreateRole();
    const { mutateAsync: updateRole } = useUpdateRole();
    const { mutateAsync: deleteRole } = useDeleteRole();

    const [actionError, setActionError] = useState<string | null>(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [editingRole, setEditingRole] = useState<Role | null>(null);
    const [formData, setFormData] = useState({
        code: '',
        name: ''
    });

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [selectedRole, setSelectedRole] = useState<Role | null>(null);

    useEffect(() => {
        if (status === 'loading') return;
        if (!session) {
            router.push('/auth/signin');
        }
    }, [session, status, router]);

    const error = actionError || (queryError ? (queryError as Error).message : null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setActionError(null);
            if (editingRole) {
                await updateRole({ id: editingRole.id, data: formData });
            } else {
                await createRole(formData);
            }
            setOpenDialog(false);
            setEditingRole(null);
            setFormData({ code: '', name: '' });
        } catch (err: any) {
            setActionError(err.message || 'Lỗi khi lưu vai trò');
        }
    };

    const handleDelete = async (role: Role) => {
        const confirmed = await confirmDialog({
            title: 'Xóa vai trò',
            message: `Bạn có chắc chắn muốn xóa vai trò "${role.name}"?`,
            confirmText: 'Xóa',
            cancelText: 'Hủy',
            destructive: true,
        });
        if (!confirmed) {
            return;
        }

        try {
            setActionError(null);
            await deleteRole(role.id);
        } catch (err: any) {
            setActionError(err.message || 'Lỗi khi xóa vai trò');
        }
    };

    const handleEdit = (role: Role) => {
        setEditingRole(role);
        setFormData({
            code: role.code,
            name: role.name
        });
        setOpenDialog(true);
        handleMenuClose();
    };

    const handleAdd = () => {
        setEditingRole(null);
        setFormData({ code: '', name: '' });
        setOpenDialog(true);
    };

    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, role: Role) => {
        setAnchorEl(event.currentTarget);
        setSelectedRole(role);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        setSelectedRole(null);
    };

    const handleViewDetails = () => {
        if (selectedRole) {
            // TODO: Navigate to role details page
            console.log('View details for role:', selectedRole.id);
        }
        handleMenuClose();
    };

    if (loading && roles.length === 0) {
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
                    <WorkIcon color="primary" sx={{ fontSize: 32 }} />
                    <Typography variant="h4" component="h1">
                        Quản lý Vai trò
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleAdd}
                >
                    Thêm Vai trò
                </Button>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setActionError(null)}>
                    {error}
                </Alert>
            )}

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Mã vai trò</TableCell>
                            <TableCell>Tên vai trò</TableCell>
                            <TableCell>Số quyền</TableCell>
                            <TableCell>Số người dùng</TableCell>
                            <TableCell align="center">Thao tác</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {roles.map((role) => (
                            <TableRow key={role.id}>
                                <TableCell>
                                    <Typography variant="body2" fontWeight="medium">
                                        {role.code}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Typography variant="body2">
                                        {role.name}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        label={role.RolePermission?.length ?? role.role_permission?.length ?? 0}
                                        color="primary"
                                        variant="outlined"
                                        size="small"
                                    />
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        label={role.UserRole?.length ?? role.user_role?.length ?? 0}
                                        color="secondary"
                                        variant="outlined"
                                        size="small"
                                    />
                                </TableCell>
                                <TableCell align="center">
                                    <IconButton
                                        size="small"
                                        onClick={(e) => handleMenuOpen(e, role)}
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
                <MenuItem onClick={() => selectedRole && handleEdit(selectedRole)} sx={{ color: 'black !important' }}>
                    <ListItemIcon>
                        <EditIcon fontSize="small" sx={{ color: 'black !important' }} />
                    </ListItemIcon>
                    <ListItemText sx={{
                        '& .MuiListItemText-primary': {
                            color: 'black !important'
                        }
                    }}>Chỉnh sửa</ListItemText>
                </MenuItem>
                <MenuItem onClick={() => selectedRole && handleDelete(selectedRole)} sx={{ color: 'black !important' }}>
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
                    {editingRole ? 'Chỉnh sửa Vai trò' : 'Thêm Vai trò Mới'}
                </DialogTitle>
                <form onSubmit={handleSubmit}>
                    <DialogContent>
                        <Box display="flex" flexDirection="column" gap={3}>
                            <TextField
                                label="Mã vai trò"
                                value={formData.code}
                                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                required
                                fullWidth
                            />
                            <TextField
                                label="Tên vai trò"
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
                            {editingRole ? 'Cập nhật' : 'Thêm'}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>
        </Box>
    );
}
