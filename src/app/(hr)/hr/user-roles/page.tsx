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
import { HR_ROUTES, API_ROUTES } from '@/constants/routes';

interface User {
    id: string;
    full_name: string;
    email: string;
}

interface Role {
    id: string;
    code: string;
    name: string;
}

interface UserRole {
    id: string;
    user_id: string;
    role_id: string;
    users_user_role_user_idTousers: User | null;
    users_user_role_assigned_byTousers: User | null;
    roles: Role;
    assigned_at: string;
    expires_at: string | null;
    is_active: boolean;
}

export default function UserRolesPage() {
    const { data: session, status } = useSession();
    const confirmDialog = useConfirmDialog();
    const router = useRouter();

    const [userRoles, setUserRoles] = useState<UserRole[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
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
            return;
        }
        fetchData();
    }, [session, status, router]);

    const fetchData = async () => {
        try {
            setLoading(true);

            // Fetch user roles, users, and roles in parallel
            const [userRolesRes, usersRes, rolesRes] = await Promise.all([
                fetch(API_ROUTES.HR.USER_ROLES),
                fetch(API_ROUTES.HR.USERS),
                fetch(API_ROUTES.HR.ROLES)
            ]);

            const [userRolesResult, usersResult, rolesResult] = await Promise.all([
                userRolesRes.json(),
                usersRes.json(),
                rolesRes.json()
            ]);

            if (userRolesResult.success) {
                setUserRoles(userRolesResult.data);
            } else {
                setError(userRolesResult.error || 'Failed to fetch user roles');
            }

            if (usersResult.success) {
                setUsers(usersResult.data);
            } else {
                setError(usersResult.error || 'Failed to fetch users');
            }

            if (rolesResult.success) {
                setRoles(rolesResult.data);
            } else {
                setError(rolesResult.error || 'Failed to fetch roles');
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
            const response = await fetch(API_ROUTES.HR.USER_ROLES, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const result = await response.json();

            if (result.success) {
                setOpenDialog(false);
                setFormData({ user_id: '', role_id: '' });
                fetchData();
            } else {
                setError(result.error || 'Failed to create user role');
            }
        } catch (err) {
            setError('Network error occurred');
        }
    };

    const handleDelete = async (userRole: UserRole) => {
        const confirmed = await confirmDialog({
            title: 'Xóa phân quyền người dùng',
            message: `Bạn có chắc chắn muốn xóa phân quyền "${userRole.users_user_role_user_idTousers?.full_name || 'N/A'}" - "${userRole.Role?.name || 'N/A'}"?`,
            confirmText: 'Xóa',
            cancelText: 'Hủy',
            destructive: true,
        });
        if (!confirmed) {
            return;
        }

        try {
            const response = await fetch(API_ROUTES.HR.USER_ROLES_BY_ID(userRole.id), {
                method: 'DELETE',
            });

            const result = await response.json();

            if (result.success) {
                fetchData();
            } else {
                setError(result.error || 'Failed to delete user role');
            }
        } catch (err) {
            setError('Network error occurred');
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
            // TODO: Navigate to user role details page
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
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
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
