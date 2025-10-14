'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  useTheme,
  useMediaQuery,
  Collapse,
  Avatar,
  Chip,
  CircularProgress,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  Menu as MenuIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Apartment as ApartmentIcon,
  Group as GroupIcon,
  Dashboard as DashboardIcon,
  Assignment as AssignmentIcon,
  History as HistoryIcon,
  Assessment as AssessmentIcon,
  Settings as SettingsIcon,
  ListAlt as ListAltIcon,
  Visibility as VisibilityIcon,
  Add as AddIcon,
  Approval as ApprovalIcon,
  Publish as PublishIcon,
  Storage as StorageIcon,
  AccountTree as AccountTreeIcon,
  Timeline as TimelineIcon,
  Person as PersonIcon,
  AssignmentInd as AssignmentIndIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material';
import { ThemeToggle } from '@/components/misc/theme-toggle';

const drawerWidth = 240;

export default function OrgLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [unitManagementOpen, setUnitManagementOpen] = useState(false);
  const [treeManagementOpen, setTreeManagementOpen] = useState(false);
  const [createUnitOpen, setCreateUnitOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  
  // Authentication
  const { data: session, status } = useSession();
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);

  // Check authentication and permissions
  useEffect(() => {
    if (status === 'loading') return; // Still loading
    
    if (!session) {
      // Not authenticated, redirect to login without auto signIn
      router.push(`/auth/signin?callbackUrl=${encodeURIComponent(pathname)}`);
      return;
    }
  }, [session, status, pathname, router]);

  // Permission checking functions
  const hasPermission = (permission: string): boolean => {
    if (!session?.user?.permissions) return false;
    return session.user.permissions.includes(permission);
  };

  const hasAnyPermission = (permissions: string[]): boolean => {
    if (!session?.user?.permissions) return false;
    return permissions.some(permission => session.user.permissions.includes(permission));
  };

  // Filter menu items based on permissions
  const filterMenuItems = (items: Array<{ permissions?: string[]; hasSubmenu?: boolean; submenu?: Array<{ permissions?: string[]; hasSubmenu?: boolean; [key: string]: unknown }> }>): Array<{ permissions?: string[]; hasSubmenu?: boolean; submenu?: Array<{ permissions?: string[]; hasSubmenu?: boolean; [key: string]: unknown }> }> => {
    return items.filter(item => {
      // If no permissions specified, show to all authenticated users
      if (!item.permissions) return true;
      
      // Check if user has any of the required permissions
      const hasAccess = hasAnyPermission(item.permissions);
      
      // If item has submenu, also filter submenu items
      if (hasAccess && item.hasSubmenu && item.submenu) {
        item.submenu = filterMenuItems(item.submenu);
        // Only show parent if it has accessible submenu items
        return item.submenu.length > 0;
      }
      
      return hasAccess;
    });
  };

  // Move visibleMenuItems calculation after menuItems definition

  // Show loading state while checking authentication
  if (status === 'loading') {
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
        <CircularProgress size={60} />
        <Typography variant="h6" color="text.secondary">
          Đang kiểm tra quyền truy cập...
        </Typography>
      </Box>
    );
  }

  // User menu handlers
  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setUserMenuAnchor(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };

  const handleLogout = async () => {
    handleUserMenuClose();
    await signOut({ callbackUrl: '/' });
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleCollapseToggle = () => {
    setCollapsed(!collapsed);
  };

  const handleUnitManagementToggle = () => {
    setUnitManagementOpen(!unitManagementOpen);
  };

  const handleTreeManagementToggle = () => {
    setTreeManagementOpen(!treeManagementOpen);
  };

  const handleCreateUnitToggle = () => {
    setCreateUnitOpen(!createUnitOpen);
  };

  const menuItems = [
    {
      key: '/org/dashboard',
      icon: <DashboardIcon />,
      label: 'Dashboard',
      permissions: ['org_unit.read', 'org_unit.create', 'org_unit.update', 'org_unit.delete'],
    },
    {
      key: 'tree-management',
      icon: <ApartmentIcon />,
      label: 'Cây tổ chức',
      hasSubmenu: true,
      permissions: ['org_unit.read'],
      submenu: [
        {
          key: '/org/tree',
          icon: <AccountTreeIcon />,
          label: 'Cây tổ chức',
          permissions: ['org_unit.read'],
        },
        {
          key: '/org/diagram',
          icon: <TimelineIcon />,
          label: 'Sơ đồ',
          permissions: ['org_unit.read'],
        },
      ],
    },
    {
      key: 'unit-management',
      icon: <GroupIcon />,
      label: 'Quản lý đơn vị',
      hasSubmenu: true,
      permissions: ['org_unit.read'],
      submenu: [
        {
          key: '/org/unit',
          icon: <ListAltIcon />,
          label: 'Danh sách đơn vị',
          permissions: ['org_unit.read'],
        },
        {
          key: 'create-unit',
          icon: <AddIcon />,
          label: 'Tạo đơn vị mới',
          hasSubmenu: true,
          permissions: ['org_unit.create'],
          submenu: [
            {
              key: '/org/unit/create/draft',
              icon: <AddIcon />,
              label: 'Đề xuất',
              permissions: ['org_unit.create'],
            },
            {
              key: '/org/unit/create/review',
              icon: <VisibilityIcon />,
              label: 'Xem xét/Thẩm định',
              permissions: ['org_unit.review'],
            },
            {
              key: '/org/unit/create/approve',
              icon: <ApprovalIcon />,
              label: 'Phê duyệt',
              permissions: ['org_unit.approve'],
            },
            {
              key: '/org/unit/create/activate',
              icon: <PublishIcon />,
              label: 'Kích hoạt',
              permissions: ['org_unit.activate'],
            },
            {
              key: '/org/unit/create/audit',
              icon: <StorageIcon />,
              label: 'Theo dõi biến đổi',
              permissions: ['org_unit.read'],
            },
          ],
        },
      ],
    },
    {
      key: '/org/assignments',
      icon: <AssignmentIndIcon />,
      label: 'Phân công nhân sự',
      permissions: ['org_unit.read'],
    },
    {
      key: '/org/unit/create/audit',
      icon: <HistoryIcon />,
      label: 'Lịch sử thay đổi',
      permissions: ['org_unit.read'],
    },
    {
      key: '/org/reports',
      icon: <AssessmentIcon />,
      label: 'Báo cáo tổ chức',
      permissions: ['org_unit.read'],
    },
    {
      key: '/org/config',
      icon: <SettingsIcon />,
      label: 'Cấu hình hệ thống',
      permissions: ['org_unit.admin'],
    },
  ];

  const visibleMenuItems = session ? filterMenuItems(menuItems) : [];

  const handleMenuClick = (path: string) => {
    router.push(path);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const handleMenuItemClick = (item: { key: string; hasSubmenu?: boolean }) => {
    if (item.hasSubmenu) {
      if (item.key === 'unit-management') {
        handleUnitManagementToggle();
      } else if (item.key === 'tree-management') {
        handleTreeManagementToggle();
      } else if (item.key === 'create-unit') {
        handleCreateUnitToggle();
      }
    } else {
      handleMenuClick(item.key);
    }
  };

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Logo */}
      <Toolbar sx={{ minHeight: '64px !important' }}>
        <Typography
          variant="h6"
          noWrap
          component="div"
          sx={{ 
            color: 'white',
            fontWeight: 'bold',
            flexGrow: 1,
            textAlign: 'center'
          }}
        >
          {collapsed ? 'T' : 'Quản lí cơ cấu tổ chức'}
        </Typography>
      </Toolbar>
      
      <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.12)' }} />
      
      {/* Menu Items */}
      <List sx={{ flexGrow: 1, pt: 1 }}>
        {visibleMenuItems.map((item) => (
          <React.Fragment key={item.key}>
            <ListItem disablePadding>
              <ListItemButton
                selected={pathname === item.key}
                onClick={() => handleMenuItemClick(item)}
                sx={{
                  mx: 1,
                  borderRadius: 1,
                  '&.Mui-selected': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  },
                }}
              >
                <ListItemIcon>
                  {item.icon}
                </ListItemIcon>
                {!collapsed && (
                  <>
                    <ListItemText primary={item.label} />
                    {item.hasSubmenu && (
                      item.key === 'tree-management' ? (
                        treeManagementOpen ? (
                          <ChevronRightIcon sx={{ 
                            transform: 'rotate(90deg)',
                            transition: 'transform 0.2s ease-in-out'
                          }} />
                        ) : (
                          <ChevronRightIcon sx={{ 
                            transition: 'transform 0.2s ease-in-out'
                          }} />
                        )
                      ) : (
                        item.key === 'unit-management' ? (
                          unitManagementOpen ? (
                            <ChevronRightIcon sx={{ 
                              transform: 'rotate(90deg)',
                              transition: 'transform 0.2s ease-in-out'
                            }} />
                          ) : (
                            <ChevronRightIcon sx={{ 
                              transition: 'transform 0.2s ease-in-out'
                            }} />
                          )
                        ) : (
                          <ChevronRightIcon />
                        )
                      )
                    )}
                  </>
                )}
              </ListItemButton>
            </ListItem>
            
            {/* Submenu */}
            {item.hasSubmenu && item.submenu && !collapsed && (
              <Collapse in={
                (item.key === 'unit-management' && unitManagementOpen) || 
                (item.key === 'tree-management' && treeManagementOpen)
              } timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  {item.submenu.map((subItem) => (
                    <React.Fragment key={subItem.key}>
                      <ListItem disablePadding>
                        <ListItemButton
                          selected={pathname === subItem.key}
                          onClick={() => subItem.hasSubmenu ? handleMenuItemClick(subItem) : handleMenuClick(subItem.key)}
                          sx={{
                            mx: 1,
                            ml: 3,
                            borderRadius: 1,
                            '&.Mui-selected': {
                              backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            },
                          }}
                        >
                          <ListItemIcon>
                            {subItem.icon}
                          </ListItemIcon>
                          <ListItemText primary={subItem.label} />
                          {subItem.hasSubmenu && (
                            subItem.key === 'create-unit' ? (
                              createUnitOpen ? (
                                <ChevronRightIcon sx={{ 
                                  transform: 'rotate(90deg)',
                                  transition: 'transform 0.2s ease-in-out'
                                }} />
                              ) : (
                                <ChevronRightIcon sx={{ 
                                  transition: 'transform 0.2s ease-in-out'
                                }} />
                              )
                            ) : (
                              <ChevronRightIcon />
                            )
                          )}
                        </ListItemButton>
                      </ListItem>
                      
                      {/* Sub-submenu */}
                      {subItem.hasSubmenu && subItem.submenu && (
                        <Collapse in={
                          (subItem.key === 'create-unit' && createUnitOpen)
                        } timeout="auto" unmountOnExit>
                          <List component="div" disablePadding>
                            {subItem.submenu.map((subSubItem) => (
                              <ListItem key={subSubItem.key} disablePadding>
                                <ListItemButton
                                  selected={pathname === subSubItem.key}
                                  onClick={() => handleMenuClick(subSubItem.key)}
                                  sx={{
                                    mx: 1,
                                    ml: 5,
                                    borderRadius: 1,
                                    '&.Mui-selected': {
                                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                    },
                                  }}
                                >
                                  <ListItemIcon>
                                    {subSubItem.icon}
                                  </ListItemIcon>
                                  <ListItemText primary={subSubItem.label} />
                                </ListItemButton>
                              </ListItem>
                            ))}
                          </List>
                        </Collapse>
                      )}
                    </React.Fragment>
                  ))}
                </List>
              </Collapse>
            )}
          </React.Fragment>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${collapsed ? 80 : drawerWidth}px)` },
          ml: { md: collapsed ? '80px' : `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="toggle drawer"
            edge="start"
            onClick={isMobile ? handleDrawerToggle : handleCollapseToggle}
            sx={{ mr: 2 }}
          >
            {isMobile ? <MenuIcon /> : (collapsed ? <ChevronLeftIcon sx={{ transform: 'rotate(180deg)' }} /> : <ChevronLeftIcon />)}
          </IconButton>
          
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            OpenPKA - Quản lý Tổ chức
          </Typography>
          
          {/* Loading state */}
          {status === 'loading' && (
            <CircularProgress size={24} color="inherit" sx={{ mr: 2 }} />
          )}
          
          {/* User info */}
          {session && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Chip
                label={`${session.user.permissions?.length || 0} quyền`}
                size="small"
                color="secondary"
                variant="outlined"
              />
              
              <IconButton
                size="large"
                aria-label="account of current user"
                aria-controls="user-menu"
                aria-haspopup="true"
                onClick={handleUserMenuOpen}
                color="inherit"
              >
                <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
                  {(session.user as { full_name?: string }).full_name?.charAt(0) || session.user.username?.charAt(0) || 'U'}
                </Avatar>
              </IconButton>
              
              <Menu
                id="user-menu"
                anchorEl={userMenuAnchor}
                anchorOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                keepMounted
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                open={Boolean(userMenuAnchor)}
                onClose={handleUserMenuClose}
              >
                <MenuItem disabled>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                      {(session.user as { full_name?: string }).full_name || session.user.username}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {session.user.email}
                    </Typography>
                  </Box>
                </MenuItem>
                <Divider />
                <MenuItem onClick={handleLogout}>
                  <ListItemIcon>
                    <LogoutIcon fontSize="small" />
                  </ListItemIcon>
                  Đăng xuất
                </MenuItem>
              </Menu>
            </Box>
          )}
          
          <ThemeToggle />
        </Toolbar>
      </AppBar>

      {/* Sidebar */}
      <Box
        component="nav"
        sx={{ width: { md: collapsed ? 80 : drawerWidth }, flexShrink: { md: 0 } }}
      >
        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
            },
          }}
        >
          {drawer}
        </Drawer>
        
        {/* Desktop drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: collapsed ? 80 : drawerWidth,
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${collapsed ? 80 : drawerWidth}px)` },
          minHeight: '100vh',
          backgroundColor: 'background.default',
        }}
      >
        <Toolbar />
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}

