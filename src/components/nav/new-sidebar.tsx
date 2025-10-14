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
    People as PeopleIcon,
    School as SchoolIcon,
    Work as WorkIcon,
    ExpandLess,
    ExpandMore,
    Group as GroupIcon,
    Assessment as AssessmentIcon,
    History as HistoryIcon,
    Person as PersonIcon,
    Security as SecurityIcon,
    AdminPanelSettings as AdminPanelSettingsIcon,
    VpnKey as VpnKeyIcon,
    Assignment as AssignmentIcon,
    Business as BusinessIcon,
    AccountTree as AccountTreeIcon,
    SupervisorAccount as SupervisorAccountIcon,
    EventNote as EventNoteIcon,
    Edit as EditIcon,
    MenuBook as MenuBookIcon,
    Class as ClassIcon,
    BookmarkBorder as BookmarkBorderIcon,
    ViewList as ViewListIcon,
    PlaylistAddCheck as PlaylistAddCheckIcon,
    AssignmentTurnedIn as AssignmentTurnedInIcon,
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
        href: '/hr/dashboard',
        permission: 'user.read', // Tất cả roles đều có user.read
    },
    {
        key: 'leave-requests',
        label: 'Đơn xin nghỉ',
        icon: <EventNoteIcon />,
        href: '/hr/leave-requests',
        permission: 'leave_request.read', // Cần quyền đọc đơn xin nghỉ
    },
    {
        key: 'my-evaluations',
        label: 'Đánh giá của tôi',
        icon: <AssessmentIcon />,
        href: '/hr/my-evaluations',
        permission: 'performance_review.read', // Giảng viên có thể xem đánh giá của mình
    },
    {
        key: 'hr-management',
        label: 'Quản lý Nhân sự',
        icon: <GroupIcon />,
        permission: 'employee.read', // Cần quyền đọc nhân viên
        children: [
            {
                key: 'employees',
                label: 'Nhân viên',
                icon: <PeopleIcon />,
                href: '/hr/employees',
                permission: 'employee.read',
            },
            {
                key: 'qualifications',
                label: 'Bằng cấp',
                icon: <SchoolIcon />,
                href: '/hr/qualifications',
                permission: 'employee.read',
            },
            {
                key: 'employments',
                label: 'Hợp đồng',
                icon: <WorkIcon />,
                href: '/hr/employments',
                permission: 'employee.read',
            },
            {
                key: 'performance-reviews',
                label: 'Đánh giá hiệu suất',
                icon: <AssessmentIcon />,
                href: '/hr/performance-reviews',
                permission: 'performance_review.read',
            },
            {
                key: 'evaluation-periods',
                label: 'Quản lý kỳ đánh giá',
                icon: <AssessmentIcon />,
                href: '/hr/evaluation-periods',
                permission: 'performance_review.create',
            },
            {
                key: 'employee-logs',
                label: 'Lịch sử sửa đổi',
                icon: <EditIcon />,
                href: '/hr/employee-logs',
                permission: 'employee.read',
            }
        ],
    },
    {
        key: 'rbac',
        label: 'Phân quyền',
        icon: <SecurityIcon />,
        permission: 'role.read', // Admin có quyền đọc role
        children: [
            {
                key: 'roles',
                label: 'Vai trò',
                icon: <AdminPanelSettingsIcon />,
                href: '/hr/roles',
                permission: 'role.read',
            },
            {
                key: 'permissions',
                label: 'Quyền hạn',
                icon: <VpnKeyIcon />,
                href: '/hr/permissions',
                permission: 'role.read', // Sử dụng role.read vì permissions liên quan đến roles
            },
            {
                key: 'role-permissions',
                label: 'Vai trò - Quyền hạn',
                icon: <AssignmentIcon />,
                href: '/hr/role-permissions',
                permission: 'role.read',
            },
            {
                key: 'user-roles',
                label: 'Người dùng - Vai trò',
                icon: <PersonIcon />,
                href: '/hr/user-roles',
                permission: 'user.read', // Liên quan đến user
            },
        ],
    },
    {
        key: 'tms',
        label: 'Quản lý Chương trình Đào tạo',
        icon: <MenuBookIcon />,
        permission: 'program.read',
        children: [
            {
                key: 'programs',
                label: 'Chương trình',
                icon: <ClassIcon />,
                href: '/tms/programs',
                permission: 'program.read',
            },
            {
                key: 'program-blocks',
                label: 'Khối học phần',
                icon: <BookmarkBorderIcon />,
                href: '/tms/programs/program-blocks',
                permission: 'program.read',
            },
            {
                key: 'courses',
                label: 'Học phần',
                icon: <ViewListIcon />,
                href: '/tms/courses',
                permission: 'course.read',
            },
            {
                key: 'majors',
                label: 'Ngành đào tạo',
                icon: <PlaylistAddCheckIcon />,
                href: '/tms/majors',
                permission: 'major.read',
            },
            {
                key: 'framework',
                label: 'Khung chương trình',
                icon: <AssignmentTurnedInIcon />,
                href: '/tms/programs/framework',
                permission: 'program.read',
            },
        ],
    }
];

export function NewSidebar() {
    const pathname = usePathname();
    const { data: session, status } = useSession();
    const permissions = session?.user?.permissions || [];

    // Debug logging for development
    if (process.env.NODE_ENV === 'development' && session?.user) {
        console.log('🔐 User permissions:', permissions);
        console.log('👤 User:', session.user.username, session.user.email);
    }


    const [openSections, setOpenSections] = useState<Record<string, boolean>>({
        'hr-management': true,
        'rbac': false,
        'org-management': false,
        'tms': true,
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
                        HR System
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
