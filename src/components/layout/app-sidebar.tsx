'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Box,
  Typography,
  Divider,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  School as SchoolIcon,
  Work as WorkIcon,
  ExpandLess,
  ExpandMore,
  Group as GroupIcon,
  Assessment as AssessmentIcon,
  Person as PersonIcon,
  Security as SecurityIcon,
  AdminPanelSettings as AdminPanelSettingsIcon,
  VpnKey as VpnKeyIcon,
  Assignment as AssignmentIcon,
  EventNote as EventNoteIcon,
  AssignmentInd as AssignmentIndIcon,
  CastForEducation as TrainingsIcon,
  History as HistoryIcon,
  AccountTree as AccountTreeIcon,
  Share as ShareIcon,
  Apartment as ApartmentIcon,
  ListAlt as ListAltIcon,
  Add as AddIcon,
  Settings as SettingsIcon,
  LibraryBooks as LibraryBooksIcon,
  Approval as ApprovalIcon,
  Class as ClassIcon,
  Subject as SubjectIcon,
  SchoolOutlined as SchoolOutlinedIcon,
} from '@mui/icons-material';

import {
  MODULE_NAVIGATION,
  getActiveModuleFromPathname,
  type NavigationItem,
} from '@/config/navigation';
import { hasPermission } from '@/config/permissions';
import type { ModuleKey } from '@/types/common';

const ICON_MAP: Record<string, React.ReactElement> = {
  Dashboard: <DashboardIcon fontSize="small" />,
  People: <PeopleIcon fontSize="small" />,
  School: <SchoolIcon fontSize="small" />,
  Work: <WorkIcon fontSize="small" />,
  Group: <GroupIcon fontSize="small" />,
  Assessment: <AssessmentIcon fontSize="small" />,
  Person: <PersonIcon fontSize="small" />,
  Security: <SecurityIcon fontSize="small" />,
  AdminPanelSettings: <AdminPanelSettingsIcon fontSize="small" />,
  VpnKey: <VpnKeyIcon fontSize="small" />,
  Assignment: <AssignmentIcon fontSize="small" />,
  EventNote: <EventNoteIcon fontSize="small" />,
  AssignmentInd: <AssignmentIndIcon fontSize="small" />,
  CastForEducation: <TrainingsIcon fontSize="small" />,
  History: <HistoryIcon fontSize="small" />,
  AccountTree: <AccountTreeIcon fontSize="small" />,
  Share: <ShareIcon fontSize="small" />,
  Apartment: <ApartmentIcon fontSize="small" />,
  ListAlt: <ListAltIcon fontSize="small" />,
  Add: <AddIcon fontSize="small" />,
  Settings: <SettingsIcon fontSize="small" />,
  LibraryBooks: <LibraryBooksIcon fontSize="small" />,
  Approval: <ApprovalIcon fontSize="small" />,
  Class: <ClassIcon fontSize="small" />,
  Subject: <SubjectIcon fontSize="small" />,
  SchoolOutlined: <SchoolOutlinedIcon fontSize="small" />,
};

interface AppSidebarProps {
  currentModule?: ModuleKey;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
  drawerWidth?: number;
}

export function AppSidebar({
  currentModule: explicitModule,
  mobileOpen = false,
  onMobileClose,
  drawerWidth = 240,
}: AppSidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const permissions = (session?.user as { permissions?: string[] })?.permissions || [];

  const activeModule = explicitModule || getActiveModuleFromPathname(pathname);
  const items = MODULE_NAVIGATION[activeModule] || [];

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  const handleToggleSection = (key: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const visibleItems = useMemo(() => {
    const filterItem = (item: NavigationItem): NavigationItem | null => {
      if (item.permission && !hasPermission(permissions, item.permission)) {
        return null;
      }
      if (item.children) {
        const filteredChildren = item.children
          .map(filterItem)
          .filter((c): c is NavigationItem => c !== null);
        if (filteredChildren.length === 0 && !item.href) {
          return null;
        }
        return { ...item, children: filteredChildren };
      }
      return item;
    };

    return items.map(filterItem).filter((i): i is NavigationItem => i !== null);
  }, [items, permissions]);

  const renderItem = (item: NavigationItem, level = 0) => {
    const isSelected = item.href ? pathname === item.href || (item.href !== '/' && pathname.startsWith(`${item.href}/`)) : false;
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = openSections[item.key] ?? hasChildren;
    const icon = ICON_MAP[item.iconName] || <DashboardIcon fontSize="small" />;

    return (
      <React.Fragment key={item.key}>
        <ListItem disablePadding sx={{ display: 'block', pl: level * 2 }}>
          {item.href ? (
            <ListItemButton
              component={Link}
              href={item.href}
              selected={isSelected}
              onClick={onMobileClose}
              sx={{
                minHeight: 44,
                borderRadius: 1,
                mx: 1,
                my: 0.25,
                '&.Mui-selected': {
                  backgroundColor: 'primary.main',
                  color: 'primary.contrastText',
                  '&:hover': {
                    backgroundColor: 'primary.dark',
                  },
                  '& .MuiListItemIcon-root': {
                    color: 'primary.contrastText',
                  },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 36, color: isSelected ? 'inherit' : 'text.secondary' }}>
                {icon}
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{
                  fontSize: '0.875rem',
                  fontWeight: isSelected ? 600 : 400,
                }}
              />
            </ListItemButton>
          ) : (
            <ListItemButton
              onClick={() => handleToggleSection(item.key)}
              sx={{
                minHeight: 44,
                borderRadius: 1,
                mx: 1,
                my: 0.25,
              }}
            >
              <ListItemIcon sx={{ minWidth: 36, color: 'text.secondary' }}>
                {icon}
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{
                  fontSize: '0.875rem',
                  fontWeight: 500,
                }}
              />
              {hasChildren && (isExpanded ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />)}
            </ListItemButton>
          )}
        </ListItem>

        {hasChildren && (
          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {item.children!.map((child) => renderItem(child, level + 1))}
            </List>
          </Collapse>
        )}
      </React.Fragment>
    );
  };

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Brand Header */}
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: 1,
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            fontSize: '1rem',
          }}
        >
          OA
        </Box>
        <Box>
          <Typography variant="subtitle1" fontWeight={700} lineHeight={1.2}>
            OpenAcademix
          </Typography>
          <Typography variant="caption" color="text.secondary" textTransform="uppercase">
            Module: {activeModule}
          </Typography>
        </Box>
      </Box>

      <Divider />

      {/* Navigation List */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', py: 1 }}>
        <List component="nav" disablePadding>
          {visibleItems.map((item) => renderItem(item))}
        </List>
      </Box>

      <Divider />

      {/* Bottom Switcher Note */}
      <Box sx={{ p: 1.5, textAlign: 'center' }}>
        <Typography variant="caption" color="text.secondary">
          v0.1.0 • Clean Architecture
        </Typography>
      </Box>
    </Box>
  );

  return (
    <>
      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onMobileClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: drawerWidth,
          },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Desktop Drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: drawerWidth,
            borderRight: '1px solid',
            borderColor: 'divider',
          },
        }}
        open
      >
        {drawerContent}
      </Drawer>
    </>
  );
}
