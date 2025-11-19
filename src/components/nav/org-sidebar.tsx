'use client';

import React, { useState } from 'react';
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
    Apartment as ApartmentIcon,
    AccountTree as AccountTreeIcon,
    Timeline as TimelineIcon,
    Group as GroupIcon,
    ListAlt as ListAltIcon,
    Add as AddIcon,
    Visibility as VisibilityIcon,
    Approval as ApprovalIcon,
    Publish as PublishIcon,
    Storage as StorageIcon,
    AssignmentInd as AssignmentIndIcon,
    Assessment as AssessmentIcon,
    Settings as SettingsIcon,
    Share as ShareIcon,
    Business as BusinessIcon,
    CheckCircle as CheckCircleIcon,
    ExpandLess,
    ExpandMore,
} from '@mui/icons-material';

interface MenuItem {
    key: string;
    label: string;
    icon: React.ReactNode;
    href?: string;
    children?: MenuItem[];
    permission?: string;
}

const menuItems: MenuItem[] = [
    {
        key: 'dashboard',
        label: 'Dashboard',
        icon: <DashboardIcon />,
        href: '/org/dashboard',
        permission: 'org_unit.unit.view',
    },
    {
        key: 'tree-management',
        label: 'Cây tổ chức',
        icon: <ApartmentIcon />,
        permission: 'org_unit.unit.view',
        children: [
            {
                key: 'tree',
                label: 'Cây tổ chức',
                icon: <AccountTreeIcon />,
                href: '/org/tree',
                permission: 'org_unit.unit.view',
            },
            {
                key: 'diagram',
                label: 'Sơ đồ',
                icon: <TimelineIcon />,
                href: '/org/diagram',
                permission: 'org_unit.unit.view',
            },
        ],
    },
    {
        key: 'unit-management',
        label: 'Quản lý đơn vị',
        icon: <GroupIcon />,
        permission: 'org_unit.unit.view',
        children: [
            {
                key: 'units',
                label: 'Danh sách đơn vị',
                icon: <ListAltIcon />,
                href: '/org/unit',
                permission: 'org_unit.unit.view',
            },
            {
                key: 'unit-relations',
                label: 'Quan hệ tổ chức',
                icon: <ShareIcon />,
                href: '/org/unit-relations',
                permission: 'org_unit.unit.view',
            },
            {
                key: 'unit-review',
                label: 'Trung tâm phê duyệt',
                icon: <AddIcon />,
                href: '/org/unit/review',
                permission: 'org_unit.unit.view',
            },
            {
                key: 'unit-audit',
                label: 'Theo dõi biến đổi',
                icon: <StorageIcon />,
                href: '/org/unit/create/audit',
                permission: 'org_unit.unit.view',
            },
            {
                key: 'unit-type',
                label: 'Loại đơn vị',
                icon: <BusinessIcon />,
                href: '/org/type',
                permission: 'org_unit.unit.view',
            },
            {
                key: 'unit-status',
                label: 'Trạng thái đơn vị',
                icon: <CheckCircleIcon />,
                href: '/org/status',
                permission: 'org_unit.unit.view',
            },
        ],
    },
    {
        key: 'assignments',
        label: 'Phân công nhân sự',
        icon: <AssignmentIndIcon />,
        href: '/org/assignments',
        permission: 'org_unit.assignment.view',
    },
    {
        key: 'reports',
        label: 'Báo cáo tổ chức',
        icon: <AssessmentIcon />,
        href: '/org/reports',
        permission: 'org_unit.report.view',
    },
    {
        key: 'config',
        label: 'Cấu hình hệ thống',
        icon: <SettingsIcon />,
        href: '/org/config',
        permission: 'org_unit.type.admin',
    },
];

export function OrgSidebar() {
    const pathname = usePathname();
    const { data: session, status } = useSession();
    const permissions = session?.user?.permissions || [];

    // Debug logging for development
    if (process.env.NODE_ENV === 'development' && session?.user) {
        console.log('🔐 User permissions:', permissions);
        console.log('👤 User:', session.user.username, session.user.email);
    }

    const [openSections, setOpenSections] = useState<Record<string, boolean>>({
        'tree-management': true,
        'unit-management': true,
    });

    // Function to check if user has permission
    const hasPermission = (requiredPermission: string) => {
        const hasAccess = permissions.includes(requiredPermission);
        // Debug logging (remove in production)
        if (process.env.NODE_ENV === 'development') {
            console.log(`Permission check: ${requiredPermission} - ${hasAccess ? '✅' : '❌'}`);
        }
        return hasAccess;
    };

    const handleToggleSection = (key: string) => {
        setOpenSections(prev => ({
            ...prev,
            [key]: !prev[key],
        }));
    };

    const renderMenuItem = (item: MenuItem, level: number = 0) => {
        // Check permission first
        if (item.permission && !hasPermission(item.permission)) {
            return null;
        }

        // For parent items with children, check if any child is accessible
        if (item.children && item.children.length > 0) {
            const hasAccessibleChildren = item.children.some(child =>
                !child.permission || hasPermission(child.permission)
            );
            if (!hasAccessibleChildren) {
                return null;
            }
        }

        const isActive = item.href ? pathname === item.href : false;
        const hasChildren = item.children && item.children.length > 0;

        if (hasChildren) {
            const isOpen = openSections[item.key];

            return (
                <React.Fragment key={item.key}>
                    <ListItem disablePadding>
                        <ListItemButton
                            onClick={() => handleToggleSection(item.key)}
                            sx={{
                                pl: 2 + level * 2,
                                color: '#ffffff',
                                borderRadius: '6px',
                                margin: '2px 8px',
                                minHeight: 44,
                                transition: 'all 0.2s ease-in-out',
                                '&:hover': {
                                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                                    transform: 'translateX(2px)',
                                },
                            }}
                        >
                            <ListItemIcon sx={{ color: '#ffffff', minWidth: 40 }}>
                                {item.icon}
                            </ListItemIcon>
                            <ListItemText
                                primary={item.label}
                                sx={{
                                    '& .MuiListItemText-primary': {
                                        color: '#ffffff',
                                        fontWeight: 500,
                                    },
                                }}
                            />
                            {isOpen ? <ExpandLess sx={{ color: '#ffffff' }} /> : <ExpandMore sx={{ color: '#ffffff' }} />}
                        </ListItemButton>
                    </ListItem>
                    <Collapse in={isOpen} timeout="auto">
                        <Box
                            sx={{
                                backgroundColor: 'rgba(0, 0, 0, 0.15)',
                                borderLeft: '3px solid rgba(255, 255, 255, 0.3)',
                                marginLeft: 2,
                                marginRight: 1,
                                borderRadius: '0 8px 8px 0',
                                boxShadow: 'inset 0 0 10px rgba(0, 0, 0, 0.2)',
                                overflow: 'hidden',
                            }}
                        >
                            {item.children?.map(child => renderMenuItem(child, level + 1)).filter(Boolean)}
                        </Box>
                    </Collapse>
                </React.Fragment>
            );
        }

        return (
            <ListItem key={item.key} disablePadding>
                <ListItemButton
                    component={Link}
                    href={item.href || '#'}
                    sx={{
                        pl: 2 + level * 2,
                        color: '#ffffff',
                        backgroundColor: isActive ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                        borderRadius: level > 0 ? '6px' : '0',
                        margin: level > 0 ? '1px 4px' : '0',
                        minHeight: 36,
                        transition: 'all 0.2s ease-in-out',
                        '&:hover': {
                            backgroundColor: isActive ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.15)',
                            transform: level > 0 ? 'translateX(2px)' : 'none',
                        },
                    }}
                >
                    <ListItemIcon sx={{ color: '#ffffff', minWidth: 40 }}>
                        {item.icon}
                    </ListItemIcon>
                    <ListItemText
                        primary={item.label}
                        sx={{
                            '& .MuiListItemText-primary': {
                                color: '#ffffff',
                                fontWeight: 500,
                            },
                        }}
                    />
                </ListItemButton>
            </ListItem>
        );
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
                    backgroundColor: '#2e4c92',
                    color: '#ffffff',
                },
            }}
        >
            <Box
                sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                {/* Header */}
                <Box sx={{ padding: 2, textAlign: 'center' }}>
                    <Typography variant="h6" sx={{ color: 'white', fontWeight: 700 }}>
                        Org System
                    </Typography>
                </Box>
                <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.12)' }} />

                {/* Menu Items */}
                <List sx={{ flexGrow: 1, paddingTop: 1 }}>
                    {menuItems.map(item => renderMenuItem(item)).filter(Boolean)}
                </List>
            </Box>
        </Drawer>
    );
}

