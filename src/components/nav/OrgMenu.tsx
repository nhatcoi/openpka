'use client';

import React from 'react';
import { 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText,
  Collapse,
  Box
} from '@mui/material';
import { 
  Dashboard as DashboardIcon,
  AccountTree as TreeIcon,
  Business as BusinessIcon,
  Settings as SettingsIcon,
  Assessment as ReportsIcon,
  Group as AssignmentsIcon,
  ExpandLess,
  ExpandMore
} from '@mui/icons-material';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

interface MenuItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  href?: string;
  permission?: string;
  children?: MenuItem[];
}

const menuItems: MenuItem[] = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    icon: <DashboardIcon />,
    href: '/org/dashboard',
    permission: 'org_unit.read'
  },
  {
    key: 'tree',
    label: 'Sơ đồ tổ chức',
    icon: <TreeIcon />,
    href: '/org/tree',
    permission: 'org_unit.read'
  },
  {
    key: 'units',
    label: 'Đơn vị',
    icon: <BusinessIcon />,
    permission: 'org_unit.read',
    children: [
      {
        key: 'units-list',
        label: 'Danh sách đơn vị',
        href: '/org/unit',
        permission: 'org_unit.read'
      },
      {
        key: 'units-new',
        label: 'Tạo đơn vị mới',
        href: '/org/unit/new',
        permission: 'org_unit.create'
      }
    ]
  },
  {
    key: 'assignments',
    label: 'Phân công',
    icon: <AssignmentsIcon />,
    href: '/org/assignments',
    permission: 'org_unit.read'
  },
  {
    key: 'reports',
    label: 'Báo cáo',
    icon: <ReportsIcon />,
    href: '/org/reports',
    permission: 'org_unit.read'
  },
  {
    key: 'config',
    label: 'Cấu hình',
    icon: <SettingsIcon />,
    href: '/org/config',
    permission: 'org_unit.admin'
  }
];

export function OrgMenu() {
  const router = useRouter();
  const { data: session } = useSession();
  const permissions = session?.user?.permissions || [];
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const hasPermission = (permission?: string) => {
    if (!permission) return true;
    return permissions.includes(permission);
  };

  const handleItemClick = (item: MenuItem) => {
    if (item.href) {
      router.push(item.href);
    } else if (item.children) {
      setExpandedItems(prev => 
        prev.includes(item.key) 
          ? prev.filter(key => key !== item.key)
          : [...prev, item.key]
      );
    }
  };

  const renderMenuItem = (item: MenuItem, level = 0) => {
    const isExpanded = expandedItems.includes(item.key);
    const hasChildren = item.children && item.children.length > 0;

    // Check permission
    if (!hasPermission(item.permission)) {
      return null;
    }

    return (
      <React.Fragment key={item.key}>
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => handleItemClick(item)}
            sx={{ pl: 2 + level * 2 }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText 
              primary={item.label}
              primaryTypographyProps={{
                fontSize: level > 0 ? '0.875rem' : '1rem',
                fontWeight: level > 0 ? 400 : 500,
              }}
            />
            {hasChildren && (isExpanded ? <ExpandLess /> : <ExpandMore />)}
          </ListItemButton>
        </ListItem>
        
        {hasChildren && (
          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {item.children!.map(child => renderMenuItem(child, level + 1))}
            </List>
          </Collapse>
        )}
      </React.Fragment>
    );
  };

  return (
    <Box sx={{ width: '100%' }}>
      <List>
        {menuItems.map(item => renderMenuItem(item))}
      </List>
    </Box>
  );
}
