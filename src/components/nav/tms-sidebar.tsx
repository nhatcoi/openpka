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
    School as SchoolIcon,
    LibraryBooks as LibraryBooksIcon,
    Add as AddIcon,
    Class as ClassIcon,
    ViewModule as ViewModuleIcon,
    Storage as StorageIcon,
    Visibility as VisibilityIcon,
    BookOnline as BookOnlineIcon,
    Subject as SubjectIcon,
    Approval as ApprovalIcon,
    SchoolOutlined as SchoolOutlinedIcon,
    ListAlt as ListAltIcon,
    History as HistoryIcon,
    Assessment as AssessmentIcon,
    Folder as FolderIcon,
    TrendingUp as TrendingUpIcon,
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
        href: '/tms/dashboard',
        permission: 'tms.program.read',
    },
    {
        key: 'program-management',
        label: 'Quản lý chương trình đào tạo',
        icon: <SchoolIcon />,
        permission: 'tms.program.read',
        children: [
            {
                key: 'programs',
                label: 'Danh sách chương trình',
                icon: <LibraryBooksIcon />,
                href: '/tms/programs',
                permission: 'tms.program.read',
            },
            {
                key: 'programs-create',
                label: 'Tạo chương trình mới',
                icon: <AddIcon />,
                href: '/tms/programs/create',
                permission: 'tms.program.write',
            },
            {
                key: 'programs-map',
                label: 'Gán học phần',
                icon: <ClassIcon />,
                href: '/tms/programs/map',
                permission: 'tms.program.read',
            },
            {
                key: 'programs-blocks',
                label: 'Quản lý khối học phần',
                icon: <ViewModuleIcon />,
                href: '/tms/programs/blocks',
                permission: 'tms.program.read',
            },
            {
                key: 'programs-framework',
                label: 'Khung chương trình đào tạo',
                icon: <StorageIcon />,
                href: '/tms/programs/framework',
                permission: 'tms.program.read',
            },
            {
                key: 'programs-review',
                label: 'Phê duyệt chương trình',
                icon: <VisibilityIcon />,
                href: '/tms/programs/review',
                permission: 'tms.program.approve',
            },
        ],
    },
    {
        key: 'subject-management',
        label: 'Quản lý học phần',
        icon: <BookOnlineIcon />,
        permission: 'tms.course.read',
        children: [
            {
                key: 'courses',
                label: 'Danh sách học phần',
                icon: <SubjectIcon />,
                href: '/tms/courses',
                permission: 'tms.course.read',
            },
            {
                key: 'courses-create',
                label: 'Tạo học phần mới',
                icon: <AddIcon />,
                href: '/tms/courses/create',
                permission: 'tms.course.write',
            },
            {
                key: 'courses-approval',
                label: 'Phê duyệt học phần',
                icon: <ApprovalIcon />,
                href: '/tms/courses/approval',
                permission: 'tms.course.approve',
            },
        ],
    },
    {
        key: 'major-management',
        label: 'Quản lý ngành đào tạo',
        icon: <SchoolOutlinedIcon />,
        permission: 'tms.program.read',
        children: [
            {
                key: 'majors',
                label: 'Danh sách ngành đào tạo',
                icon: <ListAltIcon />,
                href: '/tms/majors',
                permission: 'tms.program.read',
            },
            {
                key: 'majors-create',
                label: 'Tạo ngành đào tạo mới',
                icon: <AddIcon />,
                href: '/tms/majors/create',
                permission: 'tms.program.write',
            },
            {
                key: 'majors-review',
                label: 'Phê duyệt ngành đào tạo',
                icon: <VisibilityIcon />,
                href: '/tms/majors/review',
                permission: 'tms.program.approve',
            },
        ],
    },
    {
        key: 'cohort-management',
        label: 'Quản lý khóa học',
        icon: <ClassIcon />,
        permission: 'tms.program.read',
        children: [
            {
                key: 'cohorts',
                label: 'Danh sách khóa học',
                icon: <ListAltIcon />,
                href: '/tms/cohorts',
                permission: 'tms.program.read',
            },
            {
                key: 'cohorts-create',
                label: 'Tạo khóa học mới',
                icon: <AddIcon />,
                href: '/tms/cohorts/create',
                permission: 'tms.program.write',
            },
            {
                key: 'cohorts-statistics',
                label: 'Thống kê khóa học',
                icon: <TrendingUpIcon />,
                href: '/tms/cohorts/statistics',
                permission: 'tms.program.read',
            },
        ],
    },
    {
        key: 'history',
        label: 'Lịch sử thay đổi',
        icon: <HistoryIcon />,
        href: '/tms/history',
        permission: 'tms.program.read',
    },
    {
        key: 'reports',
        label: 'Báo cáo đào tạo',
        icon: <AssessmentIcon />,
        href: '/tms/reports',
        permission: 'tms.program.read',
    },
    {
        key: 'documents',
        label: 'Quản lý tài liệu',
        icon: <FolderIcon />,
        href: '/tms/documents',
        permission: 'tms.program.read',
    },
];

export function TmsSidebar() {
    const pathname = usePathname();
    const { data: session, status } = useSession();
    const permissions = session?.user?.permissions || [];

    // Debug logging for development
    if (process.env.NODE_ENV === 'development' && session?.user) {
        console.log('🔐 User permissions:', permissions);
        console.log('👤 User:', session.user.username, session.user.email);
    }

    const [openSections, setOpenSections] = useState<Record<string, boolean>>({
        'program-management': true,
        'subject-management': true,
        'major-management': true,
        'cohort-management': false,
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
                        TMS System
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

