'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  Box,
  Toolbar,
  CircularProgress,
  Typography,
} from '@mui/material';

import { AppHeader } from './app-header';
import { AppSidebar } from './app-sidebar';
import { getActiveModuleFromPathname } from '@/config/navigation';
import type { ModuleKey } from '@/types/common';

interface DashboardShellProps {
  children: React.ReactNode;
  module?: ModuleKey;
  requireAuth?: boolean;
}

const DRAWER_WIDTH = 240;

export function DashboardShell({
  children,
  module: explicitModule,
  requireAuth = true,
}: DashboardShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  const activeModule = explicitModule || getActiveModuleFromPathname(pathname);

  const handleDrawerToggle = () => {
    setMobileOpen((prev) => !prev);
  };

  useEffect(() => {
    if (!requireAuth) return;
    if (status === 'loading') return;

    if (!session) {
      router.push(`/auth/signin?callbackUrl=${encodeURIComponent(pathname)}`);
    }
  }, [session, status, pathname, router, requireAuth]);

  if (requireAuth && status === 'loading') {
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
        <CircularProgress />
        <Typography variant="body2" color="text.secondary">
          Đang xác thực thông tin...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: 'background.default' }}>
      {/* Dynamic Header */}
      <AppHeader
        currentModule={activeModule}
        onDrawerToggle={handleDrawerToggle}
        drawerWidth={DRAWER_WIDTH}
      />

      {/* Dynamic Sidebar */}
      <AppSidebar
        currentModule={activeModule}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        drawerWidth={DRAWER_WIDTH}
      />

      {/* Main Content Area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Toolbar />
        <Box sx={{ p: { xs: 2, sm: 3 }, flexGrow: 1 }}>{children}</Box>
      </Box>
    </Box>
  );
}
