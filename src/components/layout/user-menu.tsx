'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import {
  Box,
  IconButton,
  Avatar,
  Popover,
  Paper,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Chip,
} from '@mui/material';
import {
  AccountCircle,
  Logout,
  Edit,
  LockReset,
} from '@mui/icons-material';

export function UserMenu() {
  const router = useRouter();
  const { data: session } = useSession();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  if (!session) return null;

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleEditProfile = () => {
    handleClose();
    router.push('/me');
  };

  const handleChangePassword = () => {
    handleClose();
    router.push('/hr/change-password');
  };

  const handleLogout = () => {
    handleClose();
    signOut({ callbackUrl: '/' });
  };

  const username = (session.user as { username?: string })?.username || session.user?.name || 'User';

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Chip
        label={`Xin chào, ${username}`}
        color="secondary"
        size="small"
        sx={{ color: 'white', display: { xs: 'none', sm: 'inline-flex' } }}
      />
      <IconButton
        size="large"
        edge="end"
        aria-label="Tài khoản người dùng"
        aria-controls="user-menu"
        aria-haspopup="true"
        onClick={handleOpen}
        color="inherit"
      >
        <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
          <AccountCircle />
        </Avatar>
      </IconButton>

      <Popover
        id="user-menu"
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handleClose}
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
            minWidth: 220,
            zIndex: 9999,
          },
        }}
      >
        <Paper sx={{ p: 1 }}>
          <MenuItem onClick={handleEditProfile}>
            <ListItemIcon>
              <Edit fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Chỉnh sửa thông tin" />
          </MenuItem>
          <MenuItem onClick={handleChangePassword}>
            <ListItemIcon>
              <LockReset fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Đổi mật khẩu" />
          </MenuItem>
          <Divider sx={{ my: 1 }} />
          <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
            <ListItemIcon>
              <Logout fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText primary="Đăng xuất" />
          </MenuItem>
        </Paper>
      </Popover>
    </Box>
  );
}
