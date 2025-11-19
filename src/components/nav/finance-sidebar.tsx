'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
  Chip,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  MonetizationOn as MonetizationOnIcon,
  ReceiptLong as ReceiptLongIcon,
  Savings as SavingsIcon,
  Assessment as AssessmentIcon,
  InsertChartOutlined as ChartIcon,
} from '@mui/icons-material';
import { useSession } from 'next-auth/react';

const MENU_ITEMS = [
  { label: 'Dashboard', icon: <DashboardIcon />, href: '/finance', permission: 'finance.viewTuition' },
  { label: 'Quản lý học phí', icon: <MonetizationOnIcon />, href: '/finance', permission: 'finance.manageTuition' },
  { label: 'Thu học phí', icon: <ReceiptLongIcon />, href: '/finance/payments', permission: 'finance.collectTuition' },
  { label: 'Miễn giảm & học bổng', icon: <SavingsIcon />, href: '/finance/discounts', permission: 'finance.manageScholarship' },
  { label: 'Công nợ & cảnh báo', icon: <ChartIcon />, href: '/finance/debts', permission: 'finance.viewDebts' },
  { label: 'Báo cáo tài chính', icon: <AssessmentIcon />, href: '/finance/reports', permission: 'finance.viewReports' },
];

export function FinanceSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const permissions = session?.user?.permissions ?? [];

  const canView = (permission?: string) => {
    if (!permission) return true;
    return permissions.includes(permission);
  };

  return (
    <Drawer
      variant="permanent"
      anchor="left"
      sx={{
        width: 240,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: 240,
          boxSizing: 'border-box',
          background: 'linear-gradient(180deg, #0c4a6e 0%, #082f49 100%)',
          color: '#f8fafc',
          borderRight: 'none',
        },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
        }}
      >
        <Box
          sx={{
            px: 2,
            py: 3,
            borderBottom: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <Typography variant="subtitle2" sx={{ opacity: 0.8 }}>
            FINANCE MODULE
          </Typography>
          <Typography variant="h6" fontWeight={700}>
            Học phí & Thu chi
          </Typography>
          <Chip
            label="Beta"
            size="small"
            sx={{
              mt: 1,
              backgroundColor: 'rgba(255,255,255,0.2)',
              color: '#fff',
            }}
          />
        </Box>

        <List sx={{ flexGrow: 1, py: 2 }}>
          {MENU_ITEMS.filter((item) => canView(item.permission)).map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <ListItem key={item.href} disablePadding>
                <ListItemButton
                  component={Link}
                  href={item.href}
                  sx={{
                    mx: 1.5,
                    borderRadius: 2,
                    color: '#f8fafc',
                    mb: 0.5,
                    backgroundColor: active ? 'rgba(255,255,255,0.2)' : 'transparent',
                    '&:hover': {
                      backgroundColor: 'rgba(255,255,255,0.15)',
                    },
                  }}
                >
                  <ListItemIcon sx={{ color: '#f8fafc', minWidth: 40 }}>{item.icon}</ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{
                      fontWeight: active ? 600 : 400,
                    }}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Box>
    </Drawer>
  );
}

