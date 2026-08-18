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
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Chip,
    Menu,
    ListItemIcon,
    ListItemText,
} from '@mui/material';
import {
    Person as PersonIcon,
    Add as AddIcon,
    Delete as DeleteIcon,
    MoreVert as MoreVertIcon,
    Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { HR_ROUTES } from '@/constants/routes';
import {
    useUserRoles,
    useCreateUserRole,
    useDeleteUserRole,
    useRoles,
    useUsers,
    UserRole,
    Role
} from '@/features/hr';

export default function UserRolesPage() {
    const { data: session, status } = useSession();
    const confirmDialog = useConfirmDialog();
    const router = useRouter();

    const { data: userRoles = [], isLoading: userRolesLoading, error: queryError } = useUserRoles();
    const { data: roles = [], isLoading: rolesLoading } = useRoles();
    const { data: users = [], isLoading: usersLoading } = useUsers();
    const { mutateAsync: createUserRole } = useCreateUserRole();
    const { mutateAsync: deleteUserRole } = useDeleteUserRole();

    const loading = userRolesLoading || rolesLoading || usersLoading;
    const [actionError, setActionError] = useState<string | null>(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [formData, setFormData] = useState({
        user_id: '',
        role_id: ''
    });

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [selectedUserRole, setSelectedUserRole] = useState<UserRole | null>(null);

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
            await createUserRole(formData);
            setOpenDialog(false);
            setFormData({ user_id: '', role_id: '' });
        } catch (err: any) {
            setActionError(err.message || 'Lỗi khi phân quyền người dùng');
        }
    };

    const handleDelete = async (userRole: UserRole) => {
        const userName = userRole.User?.full_name || userRole.users_user_role_user_idTousers?.full_name || 'người dùng này';
        const roleName = userRole.Role?.name || userRole.roles?.name || 'vai trò';
        const confirmed = await confirmDialog({
            title: 'Xóa phân quyền người dùng',
            message: `Bạn có chắc chắn muốn xóa phân quyền "${userName}" - "${roleName}"?`,
            confirmText: 'Xóa',
            cancelText: 'Hủy',
            destructive: true,
        });
        if (!confirmed) {
            return;
        }

        try {
            setActionError(null);
            await deleteUserRole(userRole.id);
        } catch (err: any) {
            setActionError(err.message || 'Lỗi khi xóa phân quyền');
        }
    };

    const handleAdd = () => {
        setFormData({ user_id: '', role_id: '' });
        setOpenDialog(true);
    };

    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, userRole: UserRole) => {
        setAnchorEl(event.currentTarget);
        setSelectedUserRole(userRole);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        setSelectedUserRole(null);
    };

    const handleViewDetails = () => {
        if (selectedUserRole) {
            console.log('View details for user role:', selectedUserRole.id);
        }
        handleMenuClose();
    };

    if (loading && userRoles.length === 0) {
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
                    <PersonIcon color="primary" sx={{ fontSize: 32 }} />
                    <Typography variant="h4" component="h1">
                        Phân quyền Người dùng
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
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setActionError(null)}>
                    {error}
                </Alert>
            )}

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Người dùng</TableCell>
                            <TableCell>Vai trò</TableCell>
                            <TableCell align="center">Thao tác</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {userRoles.map((userRole) => (
                            <TableRow key={userRole.id}>
                                <TableCell>
                                    <Box>
                                        <Typography variant="body2" fontWeight="medium">
                                            {userRole.users_user_role_user_idTousers?.full_name || 'N/A'}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {userRole.users_user_role_user_idTousers?.email || 'N/A'}
                                        </Typography>
                                    </Box>
                                </TableCell>
                                <TableCell>
                                    <Box>
                                        <Typography variant="body2" fontWeight="medium">
                                            {userRole.Role?.code || 'N/A'}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {userRole.Role?.name || 'N/A'}
                                        </Typography>
                                    </Box>
                                </TableCell>
                                <TableCell align="center">
                                    <IconButton
                                        size="small"
                                        onClick={(e) => handleMenuOpen(e, userRole)}
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
                <MenuItem onClick={() => selectedUserRole && handleDelete(selectedUserRole)} sx={{ color: 'black !important' }}>
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

            {/* Add Dialog */}
            <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>
                    Thêm Phân quyền Mới
                </DialogTitle>
                <form onSubmit={handleSubmit}>
                    <DialogContent>
                        <Box display="flex" flexDirection="column" gap={3}>
                            <FormControl fullWidth required>
                                <InputLabel>Người dùng</InputLabel>
                                <Select
                                    value={formData.user_id}
                                    onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                                    label="Người dùng"
                                >
                                    {users.map((user) => (
                                        <MenuItem key={user.id} value={user.id}>
                                            {user.full_name} ({user.email})
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
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
