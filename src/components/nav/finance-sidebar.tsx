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
        label: 'Thiết lập đơn giá tín chỉ CTĐT',
        icon: <DashboardIcon />,
        href: '/finance',
        // permission: 'finance.viewTuition',
    },
];

export function FinanceSidebar() {
    const pathname = usePathname();
    const { data: session, status } = useSession();
    const permissions = session?.user?.permissions || [];

    if (process.env.NODE_ENV === 'development' && session?.user) {
        console.log('🔐 User permissions:', permissions);
        console.log('👤 User:', session.user.username, session.user.email);
    }

    const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

    const hasPermission = (requiredPermission: string) => {
        if (!requiredPermission) return true;
        if (!permissions || permissions.length === 0) return false;
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
                <Box 
                    sx={{ 
                        padding: 2, 
                        textAlign: 'center',
                        flexShrink: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.1)',
                    }}
                >
                    <Typography variant="h6" sx={{ color: 'white', fontWeight: 700 }}>
                        Finance System
                    </Typography>
                </Box>
                <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.12)', flexShrink: 0 }} />

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
