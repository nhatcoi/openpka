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
  School as SchoolIcon,
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
  Logout as LogoutIcon,
  BookOnline as BookOnlineIcon,
  Subject as SubjectIcon,
  LibraryBooks as LibraryBooksIcon,
  Schedule as ScheduleIcon,
  TrendingUp as TrendingUpIcon,
  Category as CategoryIcon,
  Class as ClassIcon,
  SchoolOutlined as SchoolOutlinedIcon,
  ViewModule as ViewModuleIcon,
} from '@mui/icons-material';
import { ThemeToggle } from '@/components/misc/theme-toggle';

const drawerWidth = 240;

export default function TmsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [programManagementOpen, setProgramManagementOpen] = useState(false);
  const [subjectManagementOpen, setSubjectManagementOpen] = useState(false);
  const [curriculumManagementOpen, setCurriculumManagementOpen] = useState(false);
  const [majorManagementOpen, setMajorManagementOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  
  // Authentication
  const { data: session, status } = useSession();
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);

  // Check authentication and permissions
  useEffect(() => {
    if (status === 'loading') return; // Still loading
    
    // Temporarily disable authentication for testing
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
  const filterMenuItems = (items: Array<{ key: string; icon: React.ReactNode; label: string; permissions?: string[]; hasSubmenu?: boolean; submenu?: Array<{ key: string; icon: React.ReactNode; label: string; permissions?: string[]; hasSubmenu?: boolean; [key: string]: unknown }> }>): Array<{ key: string; icon: React.ReactNode; label: string; permissions?: string[]; hasSubmenu?: boolean; submenu?: Array<{ key: string; icon: React.ReactNode; label: string; permissions?: string[]; hasSubmenu?: boolean; [key: string]: unknown }> }> => {
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

  // Show loading state while checking authentication
  // Temporarily disable loading check for testing
  // if (status === 'loading') {
  //   return (
  //     <Box
  //       sx={{
  //         display: 'flex',
  //         justifyContent: 'center',
  //         alignItems: 'center',
  //         minHeight: '100vh',
  //         flexDirection: 'column',
  //         gap: 2,
  //       }}
  //     >
  //       <CircularProgress size={60} />
  //       <Typography variant="h6" color="text.secondary">
  //         Đang kiểm tra quyền truy cập...
  //       </Typography>
  //     </Box>
  //   );
  // }

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

  const handleProgramManagementToggle = () => {
    setProgramManagementOpen(!programManagementOpen);
  };

  const handleSubjectManagementToggle = () => {
    setSubjectManagementOpen(!subjectManagementOpen);
  };

  const handleCurriculumManagementToggle = () => {
    setCurriculumManagementOpen(!curriculumManagementOpen);
  };

  const handleMajorManagementToggle = () => {
    setMajorManagementOpen(!majorManagementOpen);
  };

  const menuItems = [
    {
      key: '/tms/dashboard',
      icon: <DashboardIcon />,
      label: 'Dashboard',
      permissions: ['tms.read', 'tms.create', 'tms.update', 'tms.delete'],
    },
    {
      key: 'program-management',
      icon: <SchoolIcon />,
      label: 'Quản lý chương trình đào tạo',
      hasSubmenu: true,
      permissions: ['tms.program.read'],
      submenu: [
        {
          key: '/tms/programs',
          icon: <LibraryBooksIcon />,
          label: 'Danh sách chương trình',
          permissions: ['tms.program.read'],
        },
        {
          key: '/tms/programs/create',
          icon: <AddIcon />,
          label: 'Tạo chương trình mới',
          permissions: ['tms.program.create'],
        },
        {
          key: '/tms/programs/map',
          icon: <ClassIcon />,
          label: 'Gán học phần',
          permissions: ['tms.program.read'],
        },
        {
          key: '/tms/programs/blocks',
          icon: <ViewModuleIcon />,
          label: 'Quản lý khối học phần',
          permissions: ['tms.program.read'],
        },
        {
          key: '/tms/programs/framework',
          icon: <StorageIcon />,
          label: 'Khung chương trình đào tạo',
          permissions: ['tms.program.read'],
        },
        {
          key: '/tms/programs/review',
          icon: <VisibilityIcon />,
          label: 'Phê duyệt chương trình',
          permissions: ['tms.program.review'],
        },
      ],
    },
    {
      key: 'subject-management',
      icon: <BookOnlineIcon />,
      label: 'Quản lý học phần',
      hasSubmenu: true,
      permissions: ['tms.subject.read'],
      submenu: [
        {
          key: '/tms/courses',
          icon: <SubjectIcon />,
          label: 'Danh sách học phần',
          permissions: ['tms.subject.read'],
        },
        {
          key: '/tms/courses/create',
          icon: <AddIcon />,
          label: 'Tạo học phần mới',
          permissions: ['tms.subject.create'],
        },
        // {
        //   key: '/tms/courses/categories',
        //   icon: <CategoryIcon />,
        //   label: 'Phân loại học phần',
        //   permissions: ['tms.subject.read'],
        // },
        {
          key: '/tms/courses/approval',
          icon: <ApprovalIcon />,
          label: 'Phê duyệt học phần',
          permissions: ['tms.subject.approve'],
        },
      ],
    },
    {
      key: 'curriculum-management',
      icon: <ScheduleIcon />,
      label: 'Quản lý kế hoạch đào tạo',
      hasSubmenu: true,
      permissions: ['tms.curriculum.read'],
      submenu: [
        {
          key: '/tms/curriculum/planning',
          icon: <TimelineIcon />,
          label: 'Lập kế hoạch đào tạo',
          permissions: ['tms.curriculum.create'],
        },
        {
          key: '/tms/curriculum/schedule',
          icon: <ScheduleIcon />,
          label: 'Thời khóa biểu',
          permissions: ['tms.curriculum.read'],
        },
        {
          key: '/tms/curriculum/classes',
          icon: <ClassIcon />,
          label: 'Quản lý lớp học',
          permissions: ['tms.curriculum.read'],
        },
      ],
    },
    {
      key: 'major-management',
      icon: <SchoolOutlinedIcon />,
      label: 'Quản lý ngành đào tạo',
      hasSubmenu: true,
      permissions: ['tms.major.read'],
      submenu: [
        {
          key: '/tms/majors',
          icon: <ListAltIcon />,
          label: 'Danh sách ngành đào tạo',
          permissions: ['tms.major.read'],
        },
        {
          key: '/tms/majors/create',
          icon: <AddIcon />,
          label: 'Tạo ngành đào tạo mới',
          permissions: ['tms.major.create'],
        },
      ],
    },
    {
      key: '/tms/curriculum/create/audit',
      icon: <HistoryIcon />,
      label: 'Lịch sử thay đổi',
      permissions: ['tms.read'],
    },
    {
      key: '/tms/reports',
      icon: <AssessmentIcon />,
      label: 'Báo cáo đào tạo',
      permissions: ['tms.read'],
    },
    {
      key: '/tms/config',
      icon: <SettingsIcon />,
      label: 'Cấu hình hệ thống',
      permissions: ['tms.admin'],
    },
  ];

  // For now, show all menu items without permission filtering for testing
  const visibleMenuItems = menuItems;

  const handleMenuClick = (path: string) => {
    router.push(path);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const handleMenuItemClick = (item: { key: string; hasSubmenu?: boolean }) => {
    if (item.hasSubmenu) {
      if (item.key === 'program-management') {
        handleProgramManagementToggle();
      } else if (item.key === 'subject-management') {
        handleSubjectManagementToggle();
      } else if (item.key === 'curriculum-management') {
        handleCurriculumManagementToggle();
      } else if (item.key === 'major-management') {
        handleMajorManagementToggle();
      }
    } else {
      handleMenuClick(item.key);
    }
  };

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#2e4c92' }}>
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
          {collapsed ? 'T' : 'Hệ thống quản lý đào tạo (TMS)'}
        </Typography>
      </Toolbar>
      
      <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.12)' }} />
      
      {/* Menu Items */}
      <List sx={{ flexGrow: 1, pt: 1 }}>
        {visibleMenuItems.length === 0 && (
          <ListItem>
            <Typography variant="body2" color="white" sx={{ opacity: 0.7 }}>
              Đang tải menu... ({visibleMenuItems.length} items)
            </Typography>
          </ListItem>
        )}
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
                <ListItemIcon sx={{ color: 'white' }}>
                  {item.icon}
                </ListItemIcon>
                {!collapsed && (
                  <>
                    <ListItemText primary={item.label} primaryTypographyProps={{ color: 'white' }} />
                    {item.hasSubmenu && (
                      item.key === 'program-management' ? (
                        programManagementOpen ? (
                          <ChevronRightIcon sx={{ 
                            transform: 'rotate(90deg)',
                            transition: 'transform 0.2s ease-in-out'
                          }} />
                        ) : (
                          <ChevronRightIcon sx={{ 
                            transition: 'transform 0.2s ease-in-out'
                          }} />
                        )
                      ) : item.key === 'subject-management' ? (
                        subjectManagementOpen ? (
                          <ChevronRightIcon sx={{ 
                            transform: 'rotate(90deg)',
                            transition: 'transform 0.2s ease-in-out'
                          }} />
                        ) : (
                          <ChevronRightIcon sx={{ 
                            transition: 'transform 0.2s ease-in-out'
                          }} />
                        )
                      ) : item.key === 'curriculum-management' ? (
                        curriculumManagementOpen ? (
                          <ChevronRightIcon sx={{ 
                            transform: 'rotate(90deg)',
                            transition: 'transform 0.2s ease-in-out'
                          }} />
                        ) : (
                          <ChevronRightIcon sx={{ 
                            transition: 'transform 0.2s ease-in-out'
                          }} />
                        )
                      ) : item.key === 'major-management' ? (
                        majorManagementOpen ? (
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
                  </>
                )}
              </ListItemButton>
            </ListItem>
            
            {/* Submenu */}
            {item.hasSubmenu && item.submenu && !collapsed && (
              <Collapse in={
                (item.key === 'program-management' && programManagementOpen) || 
                (item.key === 'subject-management' && subjectManagementOpen) ||
                (item.key === 'curriculum-management' && curriculumManagementOpen) ||
                (item.key === 'major-management' && majorManagementOpen)
              } timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  {item.submenu.map((subItem) => (
                    <ListItem key={subItem.key} disablePadding>
                      <ListItemButton
                        selected={pathname === subItem.key}
                        onClick={() => handleMenuClick(subItem.key)}
                        sx={{
                          mx: 1,
                          ml: 3,
                          borderRadius: 1,
                          '&.Mui-selected': {
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          },
                        }}
                      >
                        <ListItemIcon sx={{ color: 'white' }}>
                          {subItem.icon}
                        </ListItemIcon>
                        <ListItemText primary={subItem.label} primaryTypographyProps={{ color: 'white' }} />
                      </ListItemButton>
                    </ListItem>
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
            OpenPKA - Hệ thống quản lý đào tạo (TMS)
          </Typography>
          
          {/* Loading state */}
          {status === 'loading' && (
            <CircularProgress size={24} color="inherit" sx={{ mr: 2 }} />
          )}
          
          {/* User info */}
          {session && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body1" sx={{ color: 'white' }}>
                Xin chào {(session.user as { full_name?: string }).full_name || session.user.username}
              </Typography>
              
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
              backgroundColor: '#2e4c92',
              color: 'white',
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
              backgroundColor: '#2e4c92',
              color: 'white',
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
        <Box sx={{ p: 2 }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}
