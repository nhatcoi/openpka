'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Avatar,
  MenuItem,
  Chip,
  Popover,
  Paper,
  ListItemIcon,
  ListItemText,
  Divider,
  CircularProgress,
} from '@mui/material';
import {
  Menu as MenuIcon,
  AccountCircle,
  Logout,
  Edit,
  Home,
} from '@mui/icons-material';
import { TmsSidebar } from '@/components/nav/tms-sidebar';
import { ThemeToggle } from '@/components/misc/theme-toggle';

export default function TmsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, status } = useSession();

  // Check authentication and permissions
  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push(`/auth/signin?callbackUrl=${encodeURIComponent(pathname)}`);
      return;
    }
  }, [session, status, pathname, router]);

  // Show loading state while checking authentication
  if (status === 'loading') {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        <CircularProgress size={60} />
        <Typography variant="h6" color="text.secondary">
          Đang kiểm tra quyền truy cập...
        </Typography>
      </Box>
    );
  }

  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setAnchorEl(null);
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

          <IconButton
            color="inherit"
            aria-label="Quay về trang chính"
            sx={{ mr: 2 }}
            component={Link}
            href="/"
          >
            <Home />
          </IconButton>

          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            TMS Management
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

      {/* TMS Sidebar */}
      <TmsSidebar />

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
            onClick={() => {
              handleUserMenuClose();
              router.push('/me');
            }}
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
              primary="Thông tin cá nhân"
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
