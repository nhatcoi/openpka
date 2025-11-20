'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import {
    Box,
    AppBar,
    Toolbar,
    Typography,
    IconButton,
    Avatar,
    Menu,
    MenuItem,
    Chip,
    Popover,
    Paper,
    ListItemIcon,
    ListItemText,
    Divider,
} from '@mui/material';
import {
    Menu as MenuIcon,
    AccountCircle,
    Logout,
    Edit,
} from '@mui/icons-material';
import { NewSidebar } from '@/components/nav/new-sidebar';
import { ThemeToggle } from '@/components/misc/theme-toggle';

import { HR_ROUTES } from '@/constants/routes';


export default function HrLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const router = useRouter();
    const pathname = usePathname();
    const { data: session, status } = useSession();



    const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        console.log('Opening user menu...', event.currentTarget);
        setAnchorEl(event.currentTarget);
    };

    const handleUserMenuClose = () => {
        setAnchorEl(null);
    };

    const handleEditProfile = () => {
        handleUserMenuClose();
        router.push('/me');
    };

    const handleLogout = () => {
        handleUserMenuClose();
        signOut({ callbackUrl: '/' });
    };


    return (
        <Box sx={{ display: 'flex' }}>
            {/* App Bar */}
            <AppBar
                position="fixed"
                sx={{
                    width: { md: 'calc(100% - 240px)' },
                    ml: { md: '240px' },
                }}
            >
                <Toolbar>
                    <IconButton
                        color="inherit"
                        aria-label="menu"
                        edge="start"
                        sx={{ mr: 2 }}
                    >
                        <MenuIcon />
                    </IconButton>

                    <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
                        HR Management
                    </Typography>

                    {/* User Info and Actions */}
                    {session && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: 2 }}>
                            <Chip
                                label={`Xin chào, ${(session.user as { username?: string })?.username || 'User'}`}
                                color="secondary"
                                size="small"
                                sx={{ color: 'white' }}
                            />
                            <IconButton
                                size="large"
                                edge="end"
                                aria-label="account of current user"
                                aria-controls="user-menu"
                                aria-haspopup="true"
                                onClick={handleUserMenuOpen}
                                color="inherit"
                            >
                                <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
                                    <AccountCircle />
                                </Avatar>
                            </IconButton>
                        </Box>
                    )}

                    <ThemeToggle />
                </Toolbar>
            </AppBar>

            {/* New Sidebarw */}
            <NewSidebar />

            {/* Main content */}
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    width: { md: 'calc(100% - 240px)' },
                    minHeight: '100vh',
                    backgroundColor: 'background.default',
                }}
            >
                <Toolbar />
                <Box sx={{ p: 3 }}>
                    {children}
                </Box>
            </Box>

            {/* User Menu */}
            <Popover
                id="user-menu"
                open={Boolean(anchorEl)}
                anchorEl={anchorEl}
                onClose={handleUserMenuClose}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
                sx={{
                    '& .MuiPaper-root': {
                        mt: 1,
                        minWidth: 200,
                        zIndex: 9999,
                        backgroundColor: 'background.paper',
                        color: 'text.primary',
                    }
                }}
            >
                <Paper sx={{
                    p: 1,
                    backgroundColor: 'background.paper',
                    color: '#000000',
                    '& .MuiListItemText-primary': {
                        color: '#000000 !important',
                        fontWeight: '500 !important',
                    }
                }}>
                    <MenuItem
                        onClick={handleEditProfile}
                        sx={{
                            color: '#000000',
                            '&:hover': {
                                backgroundColor: 'action.hover',
                            }
                        }}
                    >
                        <ListItemIcon>
                            <Edit fontSize="small" sx={{ color: '#000000' }} />
                        </ListItemIcon>
                        <ListItemText
                            primary="Chỉnh sửa thông tin"
                            primaryTypographyProps={{
                                color: '#000000',
                                fontWeight: 500
                            }}
                        />
                    </MenuItem>
                    <MenuItem
                        onClick={() => {
                            handleUserMenuClose();
                            router.push(HR_ROUTES.CHANGE_PASSWORD);
                        }}
                        sx={{
                            color: '#000000',
                            '&:hover': {
                                backgroundColor: 'action.hover',
                            }
                        }}
                    >
                        <ListItemIcon>
                            <AccountCircle fontSize="small" sx={{ color: '#000000' }} />
                        </ListItemIcon>
                        <ListItemText
                            primary="Đổi mật khẩu"
                            primaryTypographyProps={{
                                color: '#000000',
                                fontWeight: 500
                            }}
                        />
                    </MenuItem>
                    <Divider />
                    <MenuItem
                        onClick={handleLogout}
                        sx={{
                            color: '#000000',
                            '&:hover': {
                                backgroundColor: 'action.hover',
                            }
                        }}
                    >
                        <ListItemIcon>
                            <Logout fontSize="small" sx={{ color: '#000000' }} />
                        </ListItemIcon>
                        <ListItemText
                            primary="Đăng xuất"
                            primaryTypographyProps={{
                                color: '#000000',
                                fontWeight: 500
                            }}
                        />
                    </MenuItem>
                </Paper>
            </Popover>
        </Box>
    );
}