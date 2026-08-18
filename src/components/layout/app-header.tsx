'use client';

import React from 'react';
import Link from 'next/link';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Home as HomeIcon,
} from '@mui/icons-material';
import { ThemeToggle } from '@/components/misc/theme-toggle';
import { UserMenu } from './user-menu';
import type { ModuleKey } from '@/types/common';

const MODULE_TITLES: Record<ModuleKey, string> = {
  hr: 'HR Management',
  org: 'Cơ cấu Tổ chức',
  tms: 'Đào tạo & CTĐT (TMS)',
  finance: 'Quản lý Tài chính',
  academic: 'Học vụ & Khảo thí',
  students: 'Quản lý Sinh viên',
  schedule: 'Thời khóa biểu',
  reports: 'Báo cáo & Thống kê',
};

interface AppHeaderProps {
  currentModule: ModuleKey;
  onDrawerToggle?: () => void;
  drawerWidth?: number;
}

export function AppHeader({
  currentModule,
  onDrawerToggle,
  drawerWidth = 240,
}: AppHeaderProps) {
  const title = MODULE_TITLES[currentModule] || 'OpenAcademix';

  return (
    <AppBar
      position="fixed"
      sx={{
        width: { md: `calc(100% - ${drawerWidth}px)` },
        ml: { md: `${drawerWidth}px` },
        zIndex: (theme) => theme.zIndex.drawer + 1,
      }}
    >
      <Toolbar>
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={onDrawerToggle}
          sx={{ mr: 2, display: { md: 'none' } }}
        >
          <MenuIcon />
        </IconButton>

        <IconButton
          color="inherit"
          aria-label="Về trang chủ"
          sx={{ mr: 2 }}
          component={Link}
          href="/"
        >
          <HomeIcon />
        </IconButton>

        <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, fontWeight: 600 }}>
          {title}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <UserMenu />
          <ThemeToggle />
        </Box>
      </Toolbar>
    </AppBar>
  );
}
