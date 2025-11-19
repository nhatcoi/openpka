'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import {
  AppBar,
  Avatar,
  Box,
  Chip,
  CircularProgress,
  IconButton,
  MenuItem,
  Popover,
  Toolbar,
  Typography,
  ListItemIcon,
  ListItemText,
  Divider,
  Paper,
} from '@mui/material';
import { Menu as MenuIcon, Logout, AccountBalanceWallet, Person } from '@mui/icons-material';

import { FinanceSidebar } from '@/components/nav/finance-sidebar';
import { ThemeToggle } from '@/components/misc/theme-toggle';

export default function FinanceLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push(`/auth/signin?callbackUrl=${encodeURIComponent(pathname)}`);
    }
  }, [session, status, pathname, router]);

  if (status === 'loading') {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
        <CircularProgress size={56} />
        <Typography>Đang xác thực...</Typography>
      </Box>
    );
  }

  const openMenu = Boolean(anchorEl);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: 'background.default' }}>
      <FinanceSidebar />

      <AppBar
        position="fixed"
        sx={{
          ml: { md: '240px' },
          width: { md: 'calc(100% - 240px)' },
          background: 'linear-gradient(90deg, #0f172a 0%, #0c4a6e 100%)',
          boxShadow: 'none',
        }}
      >
        <Toolbar>
          <IconButton color="inherit" edge="start" sx={{ mr: 2 }}>
            <MenuIcon />
          </IconButton>

          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" fontWeight={600}>
              Trung tâm tài chính
            </Typography>
            <Chip
              label="Quản lý học phí & thu chi"
              size="small"
              sx={{ mt: 0.5, backgroundColor: 'rgba(255,255,255,0.2)', color: '#fff' }}
            />
          </Box>

          <ThemeToggle />

          {session && (
            <IconButton
              sx={{ ml: 2 }}
              onClick={(event) => setAnchorEl(event.currentTarget)}
              color="inherit"
              size="small"
            >
              <Avatar sx={{ width: 36, height: 36, bgcolor: 'rgba(255,255,255,0.2)' }}>
                <AccountBalanceWallet />
              </Avatar>
            </IconButton>
          )}
        </Toolbar>
      </AppBar>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          ml: { md: '240px' },
          pt: 10,
          px: 4,
          pb: 6,
        }}
      >
        {children}
      </Box>

      <Popover
        open={openMenu}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Paper sx={{ minWidth: 220 }}>
          <MenuItem
            onClick={() => {
              setAnchorEl(null);
              router.push('/me');
            }}
          >
            <ListItemIcon>
              <Person fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Thông tin cá nhân" />
          </MenuItem>
          <Divider />
          <MenuItem
            onClick={() => {
              setAnchorEl(null);
              signOut({ callbackUrl: '/' });
            }}
          >
            <ListItemIcon>
              <Logout fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Đăng xuất" />
          </MenuItem>
        </Paper>
      </Popover>
    </Box>
  );
}

