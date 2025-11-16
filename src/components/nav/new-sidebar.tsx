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
    Person as PersonIcon,
    Security as SecurityIcon,
    AdminPanelSettings as AdminPanelSettingsIcon,
    VpnKey as VpnKeyIcon,
    Assignment as AssignmentIcon,
    EventNote as EventNoteIcon,
    AssignmentInd as AssignmentIndIcon,
    CastForEducation as TrainingsIcon,
    History as HistoryIcon,
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
        permission: 'hr.view',
    },
    {
        key: 'leave-requests',
        label: 'Đơn xin nghỉ',
        icon: <EventNoteIcon />,
        href: '/hr/leave-requests',
        permission: 'hr.leave_request.view',
    },
    {
        key: 'my-evaluations',
        label: 'Đánh giá của tôi',
        icon: <AssessmentIcon />,
        href: '/hr/my-evaluations',
        permission: 'hr.performance_review.view',
    },
    {
        key: 'hr-management',
        label: 'Quản lý Nhân sự',
        icon: <GroupIcon />,
        permission: 'hr.employee.view',
        children: [
            {
                key: 'employees',
                label: 'Nhân viên',
                icon: <PeopleIcon />,
                href: '/hr/employees',
                permission: 'hr.employee.view',
            },
            {
                key: 'assignments',
                label: 'Phân công công việc',
                icon: <AssignmentIndIcon />,
                href: '/hr/assignments',
                permission: 'hr.assignment.view',
            },
            {
                key: 'qualifications',
                label: 'Bằng cấp',
                icon: <SchoolIcon />,
                href: '/hr/qualifications',
                permission: 'hr.qualification.view',
            },
            {
                key: 'employee-qualifications',
                label: 'Bằng cấp nhân viên',
                icon: <SchoolIcon />,
                href: '/hr/employee-qualifications',
                permission: 'hr.qualification.view',
            },
            {
                key: 'employments',
                label: 'Hợp đồng',
                icon: <WorkIcon />,
                href: '/hr/employments',
                permission: 'hr.employment.view',
            },
            {
                key: 'academic-titles',
                label: 'Học hàm, học vị',
                icon: <SchoolIcon />,
                href: '/hr/academic-titles',
                permission: 'hr.academic_title.view',
            },
            {
                key: 'employee-academic-titles',
                label: 'Học hàm, học vị nhân viên',
                icon: <SchoolIcon />,
                href: '/hr/employee-academic-titles',
                permission: 'hr.academic_title.view',
            },
            {
                key: 'trainings',
                label: 'Đào tạo',
                icon: <TrainingsIcon />,
                href: '/hr/trainings',
                permission: 'hr.training.view',
            },
            {
                key: 'employee-trainings',
                label: 'Đào tạo nhân viên',
                icon: <TrainingsIcon />,
                href: '/hr/employee-trainings',
                permission: 'hr.training.view',
            },
            {
                key: 'performance-reviews',
                label: 'Đánh giá hiệu suất',
                icon: <AssessmentIcon />,
                href: '/hr/performance-reviews',
                permission: 'hr.performance_review.view',
            },
            {
                key: 'evaluation-periods',
                label: 'Quản lý kỳ đánh giá',
                icon: <AssessmentIcon />,
                href: '/hr/evaluation-periods',
                permission: 'hr.performance_review.create',
            },
            {
                key: 'employee-logs',
                label: 'Lịch sử sửa đổi',
                icon: <HistoryIcon />,
                href: '/hr/employee-logs',
                permission: 'hr.employee.view',
            },
        ],
    },
    {
        key: 'rbac',
        label: 'Phân quyền',
        icon: <SecurityIcon />,
        permission: 'hr.rbac.view',
        children: [
            {
                key: 'roles',
                label: 'Vai trò',
                icon: <AdminPanelSettingsIcon />,
                href: '/hr/roles',
                permission: 'hr.rbac.view',
            },
            {
                key: 'permissions',
                label: 'Quyền hạn',
                icon: <VpnKeyIcon />,
                href: '/hr/permissions',
                permission: 'hr.rbac.view',
            },
            {
                key: 'role-permissions',
                label: 'Vai trò - Quyền hạn',
                icon: <AssignmentIcon />,
                href: '/hr/role-permissions',
                permission: 'hr.rbac.view',
            },
            {
                key: 'user-roles',
                label: 'Người dùng - Vai trò',
                icon: <PersonIcon />,
                href: '/hr/user-roles',
                permission: 'hr.rbac.view',
            },
        ],
    },
    {
        key: 'reports',
        label: 'Báo cáo',
        icon: <AssessmentIcon />,
        href: '/hr/reports',
        permission: 'hr.report.view',
    },
    {
        key: 'profile',
        label: 'Hồ sơ cá nhân',
        icon: <PersonIcon />,
        href: '/hr/profile',
        permission: 'hr.employee.view',
    },
];

export function NewSidebar() {
    const pathname = usePathname();
    const { data: session, status } = useSession();
    const permissions = session?.user?.permissions || [];

    if (process.env.NODE_ENV === 'development' && session?.user) {
        console.log('🔐 User permissions:', permissions);
        console.log('👤 User:', session.user.username, session.user.email);
    }

    const [openSections, setOpenSections] = useState<Record<string, boolean>>({
        'hr-management': true,
        'org-management': false,
        'rbac': false,
    });

    const hasPermission = (requiredPermission: string) => {
        if (!requiredPermission) return true; // Không yêu cầu permission = hiển thị
        if (!permissions || permissions.length === 0) return false; // Chưa có permissions = không hiển thị
        return permissions.includes(requiredPermission);
    };

    const handleToggleSection = (key: string) => {
        setOpenSections(prev => ({
            ...prev,
            [key]: !prev[key],
        }));
    };

    const renderMenuItem = (item: MenuItem, level: number = 0) => {
        if (item.permission && !hasPermission(item.permission)) {
            return null;
        }

        if (item.children && item.children.length > 0) {
            const hasAccessibleChildren = item.children.some(child =>
                !child.permission || hasPermission(child.permission)
            );
            if (!hasAccessibleChildren) {
                return null;
            }
        }

        const isActive = item.href ? pathname === item.href || pathname.startsWith(item.href + '/') : false;
        const hasChildren = item.children && item.children.length > 0;

        if (hasChildren) {
            const isOpen = openSections[item.key] ?? false;

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
                                backgroundColor: isActive ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                                '&:hover': {
                                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                    transform: 'translateX(2px)',
                                },
                            }}
                        >
                            <ListItemIcon sx={{ color: '#ffffff', minWidth: 40 }}>
                                {item.icon}
                            </ListItemIcon>
                            <ListItemText
                                primary={item.label}
                                primaryTypographyProps={{
                                    component: 'div',
                                }}
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
                    <Collapse in={isOpen} timeout="auto" unmountOnExit>
                        <Box
                            sx={{
                                backgroundColor: 'rgba(0, 0, 0, 0.15)',
                                borderLeft: '3px solid rgba(255, 255, 255, 0.3)',
                                marginLeft: 2,
                                marginRight: 1,
                                borderRadius: '0 8px 8px 0',
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
                        margin: level > 0 ? '1px 4px' : '2px 8px',
                        minHeight: level > 0 ? 36 : 44,
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
                        primaryTypographyProps={{
                            component: 'div',
                        }}
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
                    height: '100vh',
                    position: 'fixed',
                },
            }}
        >
            <Box
                sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                }}
            >
                {/* Header */}
                <Box 
                    sx={{ 
                        padding: 2, 
                        textAlign: 'center',
                        flexShrink: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.1)',
                    }}
                >
                    <Typography variant="h6" sx={{ color: 'white', fontWeight: 700 }}>
                        HR System
                    </Typography>
                </Box>
                <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.12)', flexShrink: 0 }} />

                {/* Menu Items - Scrollable */}
                <List 
                    sx={{ 
                        flexGrow: 1, 
                        paddingTop: 1,
                        paddingBottom: 1,
                        overflowY: 'auto',
                        overflowX: 'hidden',
                        '&::-webkit-scrollbar': {
                            width: '8px',
                        },
                        '&::-webkit-scrollbar-track': {
                            backgroundColor: 'rgba(0, 0, 0, 0.1)',
                        },
                        '&::-webkit-scrollbar-thumb': {
                            backgroundColor: 'rgba(255, 255, 255, 0.3)',
                            borderRadius: '4px',
                            '&:hover': {
                                backgroundColor: 'rgba(255, 255, 255, 0.5)',
                            },
                        },
                    }}
                >
                    {menuItems.map(item => renderMenuItem(item)).filter(Boolean)}
                </List>
            </Box>
        </Drawer>
    );
}
