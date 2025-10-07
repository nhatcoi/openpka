'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { orgApi, type OrgUnit, type OrgStats } from '@/features/org/api/api';
import { API_ROUTES, ORG_ROUTES } from '@/constants/routes';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Stack,
    Chip,
    CircularProgress,
    Alert,
    AlertTitle,
    LinearProgress,
    Avatar,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    Divider,
    Container,
    Button,
    Paper,
    IconButton,
    CardActions,
} from '@mui/material';
import {
    Apartment as ApartmentIcon,
    People as PeopleIcon,
    TrendingUp as TrendingUpIcon,
    Business as BusinessIcon,
    Assessment as AssessmentIcon,
    Refresh as RefreshIcon,
    CheckCircle as CheckCircleIcon,
    Warning as WarningIcon,
    Info as InfoIcon,
    Dashboard as DashboardIcon,
    Add as AddIcon,
    Settings as SettingsIcon,
    BarChart as BarChartIcon,
    AccountTree as AccountTreeIcon,
    Timeline as TimelineIcon,
    History as HistoryIcon,
    ArrowForward as ArrowForwardIcon,
    BusinessCenter as BusinessCenterIcon,
    GroupAdd as GroupAddIcon,
    Report as ReportIcon,
    ManageAccounts as ManageAccountsIcon,
    Visibility as VisibilityIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
} from '@mui/icons-material';

// Types
interface RecentActivity {
    id: string;
    type: 'unit_created' | 'unit_updated' | 'employee_added' | 'employee_moved';
    description: string;
    timestamp: string;
    unitName?: string;
    employeeName?: string;
}

interface TopUnit {
    id: string | number;
    name: string;
    code: string;
    employeeCount: number;
    type: string;
}

// Constants
const COLORS = {
    PRIMARY: '#1976d2',
    SECONDARY: '#9c27b0',
    SUCCESS: '#2e7d32',
    WARNING: '#ed6c02',
    ERROR: '#d32f2f',
    INFO: '#0288d1',
    GRAY: '#757575',
} as const;

const MOCK_ACTIVITIES: RecentActivity[] = [
    {
        id: '1',
        type: 'unit_created',
        description: 'Đơn vị mới được tạo',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        unitName: 'Phòng Marketing',
    },
    {
        id: '2',
        type: 'employee_added',
        description: 'Nhân viên mới được thêm',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        employeeName: 'Nguyễn Văn A',
        unitName: 'Phòng IT',
    },
    {
        id: '3',
        type: 'unit_updated',
        description: 'Thông tin đơn vị được cập nhật',
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        unitName: 'Phòng Nhân sự',
    },
];

// Utility functions
const getActivityIcon = (type: string | null | undefined) => {
    if (!type) return <InfoIcon />;
    
    const iconMap = {
        unit_created: <BusinessIcon color="success" />,
        unit_updated: <AssessmentIcon color="info" />,
        employee_added: <PeopleIcon color="primary" />,
        employee_moved: <TrendingUpIcon color="warning" />,
    };
    return iconMap[type as keyof typeof iconMap] || <InfoIcon />;
};

const getTypeColor = (type: string | null | undefined): string => {
    if (!type) return COLORS.GRAY;
    
    const colorMap = {
        department: COLORS.PRIMARY,
        division: COLORS.SECONDARY,
        team: COLORS.WARNING,
        branch: COLORS.INFO,
    };
    return colorMap[type.toLowerCase() as keyof typeof colorMap] || COLORS.GRAY;
};

const calculatePercentage = (value: number, total: number): number => {
    return total > 0 ? (value / total) * 100 : 0;
};

const formatDateTime = (timestamp: string): string => {
    return new Date(timestamp).toLocaleString('vi-VN');
};

export default function OrgDashboardPage() {
    const router = useRouter();
    const [stats, setStats] = useState<OrgStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);

    const topUnits: TopUnit[] = stats?.topUnits?.map(unit => ({
        id: unit.id,
        name: unit.name,
        code: unit.code,
        type: unit.type,
        employeeCount: (unit as any)._count?.OrgAssignment || 0
    })) || [];

    const fetchStats = async (): Promise<void> => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch(API_ROUTES.ORG.STATS);
            const result = await response.json();

            if (result.success) {
                setStats(result.data);
            } else {
                setError(result.error || 'Lỗi lấy thống kê');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Lỗi lấy thống kê');
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = (): void => {
        fetchStats();
    };

    useEffect(() => {
        fetchStats();
        setRecentActivities(MOCK_ACTIVITIES);
    }, []);

    const renderLoadingState = () => (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
            <CircularProgress size={60} />
            <Typography sx={{ ml: 2 }}>Đang tải dữ liệu...</Typography>
        </Box>
    );

    const renderHeader = () => (
        <Paper
            elevation={0}
            sx={{
                p: 4,
                mb: 4,
                background: `linear-gradient(135deg, ${COLORS.PRIMARY} 0%, ${COLORS.SECONDARY} 100%)`,
                color: 'white',
                borderRadius: 3,
                position: 'relative',
                overflow: 'hidden'
            }}
        >
            <Box sx={{ position: 'relative', zIndex: 1 }}>
                <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                    <Box
                        sx={{
                            width: 56,
                            height: 56,
                            borderRadius: 2,
                            backgroundColor: 'rgba(255, 255, 255, 0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backdropFilter: 'blur(10px)',
                        }}
                    >
                        <DashboardIcon sx={{ color: 'white', fontSize: 32 }} />
                    </Box>
                    <Box>
                        <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 0.5 }}>
                            Dashboard Tổ chức
                        </Typography>
                        <Typography variant="h6" sx={{ opacity: 0.9 }}>
                            Quản lý toàn diện cấu trúc và hoạt động tổ chức
                        </Typography>
                    </Box>
                </Stack>
                <Stack direction="row" spacing={4}>
                    <Box>
                        <Typography variant="h3" sx={{ fontWeight: 700 }}>
                            {stats?.totalUnits || 0}
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.8 }}>
                            Tổng đơn vị
                        </Typography>
                    </Box>
                    <Box>
                        <Typography variant="h3" sx={{ fontWeight: 700 }}>
                            {stats?.totalEmployees || 0}
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.8 }}>
                            Tổng nhân viên
                        </Typography>
                    </Box>
                </Stack>
            </Box>
            {/* Decorative background elements */}
            <Box
                sx={{
                    position: 'absolute',
                    top: -50,
                    right: -50,
                    width: 200,
                    height: 200,
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.1)',
                    zIndex: 0
                }}
            />
            <Box
                sx={{
                    position: 'absolute',
                    bottom: -30,
                    left: -30,
                    width: 150,
                    height: 150,
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.05)',
                    zIndex: 0
                }}
            />
        </Paper>
    );

    const renderErrorState = () => (
        <Alert severity="error" sx={{ mb: 3 }}>
            <AlertTitle>Lỗi</AlertTitle>
            {String(error) || 'Có lỗi xảy ra khi tải dữ liệu'}
        </Alert>
    );

    const renderStatCard = (title: string, value: number, icon: React.ReactNode, color: string, bgColor: string) => (
        <Card
            sx={{
                height: '100%',
                background: `linear-gradient(135deg, ${bgColor} 0%, rgba(255,255,255,0.05) 100%)`,
                border: `1px solid ${bgColor}`,
                borderRadius: 3,
                transition: 'all 0.3s ease',
                '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: `0 8px 25px ${bgColor}40`
                }
            }}
        >
            <CardContent sx={{ p: 3 }}>
                <Stack direction="row" alignItems="center" spacing={2}>
                    <Box
                        sx={{
                            p: 2,
                            borderRadius: 2,
                            backgroundColor: bgColor,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <Box sx={{ color: color }}>
                            {icon}
                        </Box>
                    </Box>
                    <Box>
                        <Typography variant="h4" component="div" sx={{ fontWeight: 700, color: color }}>
                            {value}
                        </Typography>
                        <Typography color="text.secondary" sx={{ fontSize: '0.9rem' }}>
                            {title}
                        </Typography>
                    </Box>
                </Stack>
            </CardContent>
        </Card>
    );

    const renderStatsCards = () => {
        const statsData = [
            {
                title: 'Tổng đơn vị',
                value: stats?.totalUnits || 0,
                icon: <ApartmentIcon sx={{ fontSize: 28 }} />,
                color: COLORS.PRIMARY,
                bgColor: 'rgba(25, 118, 210, 0.1)'
            },
            {
                title: 'Tổng nhân viên',
                value: stats?.totalEmployees || 0,
                icon: <PeopleIcon sx={{ fontSize: 28 }} />,
                color: COLORS.SUCCESS,
                bgColor: 'rgba(46, 125, 50, 0.1)'
            },
            {
                title: 'Đơn vị hoạt động',
                value: stats?.activeUnits || 0,
                icon: <CheckCircleIcon sx={{ fontSize: 28 }} />,
                color: COLORS.SUCCESS,
                bgColor: 'rgba(46, 125, 50, 0.1)'
            },
            {
                title: 'Đơn vị không hoạt động',
                value: stats?.inactiveUnits || 0,
                icon: <WarningIcon sx={{ fontSize: 28 }} />,
                color: COLORS.ERROR,
                bgColor: 'rgba(211, 47, 47, 0.1)'
            }
        ];

        return (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 4 }}>
                {statsData.map((stat, index) => (
                    <Box key={index} sx={{ flex: '1 1 300px', minWidth: '250px' }}>
                        {renderStatCard(stat.title, stat.value, stat.icon, stat.color, stat.bgColor)}
                    </Box>
                ))}
            </Box>
        );
    };

    const renderQuickActions = () => {
        const actions = [
            {
                title: 'Quản lý đơn vị',
                description: 'Thêm, sửa, xóa thông tin đơn vị',
                icon: <BusinessIcon sx={{ fontSize: 32 }} />,
                color: COLORS.PRIMARY,
                route: ORG_ROUTES.UNIT,
                gradient: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)'
            },
            {
                title: 'Sơ đồ tổ chức',
                description: 'Xem và quản lý cây tổ chức',
                icon: <AccountTreeIcon sx={{ fontSize: 32 }} />,
                color: COLORS.SUCCESS,
                route: ORG_ROUTES.TREE,
                gradient: 'linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%)'
            },
            {
                title: 'Biểu đồ tổ chức',
                description: 'Xem sơ đồ tổ chức trực quan',
                icon: <BarChartIcon sx={{ fontSize: 32 }} />,
                color: COLORS.WARNING,
                route: ORG_ROUTES.DIAGRAM,
                gradient: 'linear-gradient(135deg, #ed6c02 0%, #e65100 100%)'
            },
            {
                title: 'Báo cáo tổ chức',
                description: 'Xem báo cáo và thống kê',
                icon: <ReportIcon sx={{ fontSize: 32 }} />,
                color: COLORS.SECONDARY,
                route: ORG_ROUTES.REPORTS,
                gradient: 'linear-gradient(135deg, #9c27b0 0%, #7b1fa2 100%)'
            },
            {
                title: 'Cấu hình hệ thống',
                description: 'Thiết lập cấu hình tổ chức',
                icon: <SettingsIcon sx={{ fontSize: 32 }} />,
                color: COLORS.INFO,
                route: ORG_ROUTES.CONFIG,
                gradient: 'linear-gradient(135deg, #0288d1 0%, #0277bd 100%)'
            },
            {
                title: 'Lịch sử thay đổi',
                description: 'Theo dõi lịch sử hoạt động',
                icon: <TimelineIcon sx={{ fontSize: 32 }} />,
                color: COLORS.ERROR,
                route: ORG_ROUTES.HISTORY,
                gradient: 'linear-gradient(135deg, #d32f2f 0%, #c62828 100%)'
            }
        ];

        return (
            <Box sx={{ mb: 4 }}>
                <Typography variant="h5" component="h2" sx={{ fontWeight: 700, mb: 3, color: 'text.primary' }}>
                    Truy cập nhanh
                </Typography>

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                    {actions.map((action, index) => (
                        <Box key={index} sx={{ flex: '1 1 300px', minWidth: '250px' }}>
                            <Card
                                onClick={() => router.push(action.route)}
                                sx={{
                                    height: '100%',
                                    borderRadius: 3,
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease',
                                    '&:hover': {
                                        transform: 'translateY(-8px)',
                                        boxShadow: '0 12px 40px rgba(0,0,0,0.15)'
                                    }
                                }}
                            >
                                <Box
                                    sx={{
                                        background: action.gradient,
                                        p: 3,
                                        color: 'white',
                                        textAlign: 'center'
                                    }}
                                >
                                    <Box sx={{ mb: 2 }}>
                                        {action.icon}
                                    </Box>
                                    <Typography variant="h6" component="h3" sx={{ fontWeight: 700, mb: 1 }}>
                                        {action.title}
                                    </Typography>
                                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                        {action.description}
                                    </Typography>
                                </Box>
                                <CardActions sx={{ justifyContent: 'center', p: 2 }}>
                                    <Button
                                        size="small"
                                        endIcon={<ArrowForwardIcon />}
                                        sx={{ fontWeight: 600 }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            router.push(action.route);
                                        }}
                                    >
                                        Truy cập
                                    </Button>
                                </CardActions>
                            </Card>
                        </Box>
                    ))}
                </Box>
            </Box>
        );
    };

    const renderAdditionalFeatures = () => (
        <Paper sx={{ p: 4, borderRadius: 3, mb: 4, elevation: 1 }}>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, mb: 3 }}>
                Chức năng bổ sung
            </Typography>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                {/* Quản lý đơn vị */}
                <Box sx={{ flex: '1 1 300px', minWidth: '250px' }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'text.primary' }}>
                        Quản lý đơn vị
                    </Typography>
                    <Stack spacing={2}>
                        <Button
                            variant="outlined"
                            startIcon={<VisibilityIcon />}
                            onClick={() => router.push(ORG_ROUTES.UNIT)}
                            size="large"
                            sx={{
                                justifyContent: 'flex-start',
                                p: 2,
                                borderRadius: 2,
                                borderColor: COLORS.PRIMARY,
                                color: COLORS.PRIMARY,
                                '&:hover': {
                                    backgroundColor: COLORS.PRIMARY,
                                    color: 'white',
                                    borderColor: COLORS.PRIMARY
                                }
                            }}
                        >
                            Xem danh sách đơn vị
                        </Button>
                        <Button
                            variant="outlined"
                            startIcon={<EditIcon />}
                            onClick={() => router.push('/org/unit/create')}
                            size="large"
                            sx={{
                                justifyContent: 'flex-start',
                                p: 2,
                                borderRadius: 2,
                                borderColor: COLORS.SUCCESS,
                                color: COLORS.SUCCESS,
                                '&:hover': {
                                    backgroundColor: COLORS.SUCCESS,
                                    color: 'white',
                                    borderColor: COLORS.SUCCESS
                                }
                            }}
                        >
                            Chỉnh sửa đơn vị
                        </Button>
                        <Button
                            variant="outlined"
                            startIcon={<DeleteIcon />}
                            onClick={() => router.push('/org/unit/delete')}
                            size="large"
                            sx={{
                                justifyContent: 'flex-start',
                                p: 2,
                                borderRadius: 2,
                                borderColor: COLORS.ERROR,
                                color: COLORS.ERROR,
                                '&:hover': {
                                    backgroundColor: COLORS.ERROR,
                                    color: 'white',
                                    borderColor: COLORS.ERROR
                                }
                            }}
                        >
                            Xóa đơn vị
                        </Button>
                    </Stack>
                </Box>

                {/* Quy trình tạo đơn vị */}
                <Box sx={{ flex: '1 1 300px', minWidth: '250px' }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'text.primary' }}>
                        Quy trình tạo đơn vị
                    </Typography>
                    <Stack spacing={2}>
                        <Button
                            variant="outlined"
                            startIcon={<AddIcon />}
                            onClick={() => router.push('/org/unit/create')}
                            size="large"
                            sx={{
                                justifyContent: 'flex-start',
                                p: 2,
                                borderRadius: 2,
                                borderColor: COLORS.PRIMARY,
                                color: COLORS.PRIMARY,
                                '&:hover': {
                                    backgroundColor: COLORS.PRIMARY,
                                    color: 'white',
                                    borderColor: COLORS.PRIMARY
                                }
                            }}
                        >
                            Tạo đơn vị mới
                        </Button>
                        <Button
                            variant="outlined"
                            startIcon={<BusinessCenterIcon />}
                            onClick={() => router.push(ORG_ROUTES.UNIT_CREATE.DRAFT)}
                            size="large"
                            sx={{
                                justifyContent: 'flex-start',
                                p: 2,
                                borderRadius: 2,
                                borderColor: COLORS.SECONDARY,
                                color: COLORS.SECONDARY,
                                '&:hover': {
                                    backgroundColor: COLORS.SECONDARY,
                                    color: 'white',
                                    borderColor: COLORS.SECONDARY
                                }
                            }}
                        >
                            Tạo bản nháp
                        </Button>
                        <Button
                            variant="outlined"
                            startIcon={<TimelineIcon />}
                            onClick={() => router.push(ORG_ROUTES.UNIT_CREATE.REVIEW)}
                            size="large"
                            sx={{
                                justifyContent: 'flex-start',
                                p: 2,
                                borderRadius: 2,
                                borderColor: COLORS.WARNING,
                                color: COLORS.WARNING,
                                '&:hover': {
                                    backgroundColor: COLORS.WARNING,
                                    color: 'white',
                                    borderColor: COLORS.WARNING
                                }
                            }}
                        >
                            Đánh giá đơn vị
                        </Button>
                        <Button
                            variant="outlined"
                            startIcon={<GroupAddIcon />}
                            onClick={() => router.push(ORG_ROUTES.UNIT_CREATE.APPROVE)}
                            size="large"
                            sx={{
                                justifyContent: 'flex-start',
                                p: 2,
                                borderRadius: 2,
                                borderColor: COLORS.SUCCESS,
                                color: COLORS.SUCCESS,
                                '&:hover': {
                                    backgroundColor: COLORS.SUCCESS,
                                    color: 'white',
                                    borderColor: COLORS.SUCCESS
                                }
                            }}
                        >
                            Phê duyệt đơn vị
                        </Button>
                    </Stack>
                </Box>

                {/* Quản lý hệ thống */}
                <Box sx={{ flex: '1 1 300px', minWidth: '250px' }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'text.primary' }}>
                        Quản lý hệ thống
                    </Typography>
                    <Stack spacing={2}>
                        <Button
                            variant="outlined"
                            startIcon={<ManageAccountsIcon />}
                            onClick={() => router.push(ORG_ROUTES.UNIT_CREATE.AUDIT)}
                            size="large"
                            sx={{
                                justifyContent: 'flex-start',
                                p: 2,
                                borderRadius: 2,
                                borderColor: COLORS.WARNING,
                                color: COLORS.WARNING,
                                '&:hover': {
                                    backgroundColor: COLORS.WARNING,
                                    color: 'white',
                                    borderColor: COLORS.WARNING
                                }
                            }}
                        >
                            Kiểm toán đơn vị
                        </Button>
                        <Button
                            variant="outlined"
                            startIcon={<HistoryIcon />}
                            onClick={() => router.push(ORG_ROUTES.UNIT_CREATE.ACTIVATE)}
                            size="large"
                            sx={{
                                justifyContent: 'flex-start',
                                p: 2,
                                borderRadius: 2,
                                borderColor: COLORS.INFO,
                                color: COLORS.INFO,
                                '&:hover': {
                                    backgroundColor: COLORS.INFO,
                                    color: 'white',
                                    borderColor: COLORS.INFO
                                }
                            }}
                        >
                            Kích hoạt đơn vị
                        </Button>
                        <Button
                            variant="outlined"
                            startIcon={<SettingsIcon />}
                            onClick={() => router.push(ORG_ROUTES.CONFIG)}
                            size="large"
                            sx={{
                                justifyContent: 'flex-start',
                                p: 2,
                                borderRadius: 2,
                                borderColor: COLORS.ERROR,
                                color: COLORS.ERROR,
                                '&:hover': {
                                    backgroundColor: COLORS.ERROR,
                                    color: 'white',
                                    borderColor: COLORS.ERROR
                                }
                            }}
                        >
                            Cấu hình hệ thống
                        </Button>
                        <Button
                            variant="outlined"
                            startIcon={<HistoryIcon />}
                            onClick={() => router.push(ORG_ROUTES.HISTORY)}
                            size="large"
                            sx={{
                                justifyContent: 'flex-start',
                                p: 2,
                                borderRadius: 2,
                                borderColor: COLORS.GRAY,
                                color: COLORS.GRAY,
                                '&:hover': {
                                    backgroundColor: COLORS.GRAY,
                                    color: 'white',
                                    borderColor: COLORS.GRAY
                                }
                            }}
                        >
                            Lịch sử hoạt động
                        </Button>
                    </Stack>
                </Box>
            </Box>
        </Paper>
    );

    const renderUnitTypeDistribution = () => {
        const unitTypes = [
            { label: 'Phòng ban', value: stats?.departments || 0, color: COLORS.PRIMARY },
            { label: 'Bộ phận', value: stats?.divisions || 0, color: COLORS.SECONDARY },
            { label: 'Nhóm', value: stats?.teams || 0, color: COLORS.WARNING },
            { label: 'Chi nhánh', value: stats?.branches || 0, color: COLORS.INFO },
        ];

        return (
            <Card sx={{ height: '100%', borderRadius: 3 }}>
                <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, color: 'text.primary' }}>
                        Phân bố loại đơn vị
                    </Typography>

                    <Stack spacing={3}>
                        {unitTypes.map((unitType) => (
                            <Box key={unitType.label}>
                                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                        {unitType.label}
                                    </Typography>
                                    <Typography variant="h6" sx={{ fontWeight: 700, color: unitType.color }}>
                                        {unitType.value}
                                    </Typography>
                                </Stack>
                                <LinearProgress
                                    variant="determinate"
                                    value={calculatePercentage(unitType.value, stats?.totalUnits || 0)}
                                    sx={{
                                        height: 8,
                                        borderRadius: 4,
                                        backgroundColor: `${unitType.color}20`,
                                        '& .MuiLinearProgress-bar': {
                                            backgroundColor: unitType.color
                                        }
                                    }}
                                />
                            </Box>
                        ))}
                    </Stack>
                </CardContent>
            </Card>
        );
    };

    const renderTopUnits = () => (
        <Card sx={{ height: '100%', borderRadius: 3 }}>
            <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, color: 'text.primary' }}>
                    Đơn vị có nhiều nhân viên nhất
                </Typography>

                <List>
                    {topUnits.map((unit, index) => (
                        <Box key={unit.id}>
                            <ListItem sx={{ px: 0, py: 2 }}>
                                <ListItemAvatar>
                                    <Avatar
                                        sx={{
                                            backgroundColor: getTypeColor(unit.type),
                                            width: 40,
                                            height: 40,
                                            fontWeight: 700
                                        }}
                                    >
                                        {index + 1}
                                    </Avatar>
                                </ListItemAvatar>
                                <Box sx={{ flex: 1 }}>
                                    <ListItemText
                                        primary={
                                            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                                {unit.name}
                                            </Typography>
                                        }
                                        secondary={
                                            <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
                                                <Chip
                                                    label={unit.code}
                                                    size="small"
                                                    variant="outlined"
                                                    sx={{ fontSize: '0.75rem' }}
                                                />
                                                <Chip
                                                    label={unit.type}
                                                    size="small"
                                                    sx={{
                                                        backgroundColor: getTypeColor(unit.type),
                                                        color: 'white',
                                                        fontSize: '0.75rem',
                                                        fontWeight: 600
                                                    }}
                                                />
                                            </Stack>
                                        }
                                    />
                                </Box>
                                <Box sx={{ textAlign: 'right' }}>
                                    <Typography variant="h5" sx={{ fontWeight: 700, color: COLORS.PRIMARY }}>
                                        {unit.employeeCount}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                                        nhân viên
                                    </Typography>
                                </Box>
                            </ListItem>
                            {index < topUnits.length - 1 && <Divider />}
                        </Box>
                    ))}
                </List>
            </CardContent>
        </Card>
    );

    const renderRecentActivities = () => (
        <Card sx={{ borderRadius: 3 }}>
            <CardContent sx={{ p: 3 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>
                        Hoạt động gần đây
                    </Typography>
                    <IconButton
                        onClick={handleRefresh}
                        sx={{
                            backgroundColor: `${COLORS.PRIMARY}20`,
                            '&:hover': {
                                backgroundColor: `${COLORS.PRIMARY}40`
                            }
                        }}
                    >
                        <RefreshIcon sx={{ color: COLORS.PRIMARY }} />
                    </IconButton>
                </Stack>

                <List>
                    {recentActivities.map((activity, index) => (
                        <Box key={activity.id}>
                            <ListItem sx={{ px: 0, py: 2 }}>
                                <ListItemAvatar>
                                    <Avatar
                                        sx={{
                                            backgroundColor: `${COLORS.PRIMARY}20`,
                                            width: 40,
                                            height: 40
                                        }}
                                    >
                                        {getActivityIcon(activity.type)}
                                    </Avatar>
                                </ListItemAvatar>
                                <ListItemText
                                    primary={
                                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                            {activity.description}
                                        </Typography>
                                    }
                                    secondary={
                                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
                                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                                                {formatDateTime(activity.timestamp)}
                                            </Typography>
                                            {activity.unitName && (
                                                <Chip
                                                    label={activity.unitName}
                                                    size="small"
                                                    variant="outlined"
                                                    sx={{ fontSize: '0.75rem' }}
                                                />
                                            )}
                                            {activity.employeeName && (
                                                <Chip
                                                    label={activity.employeeName}
                                                    size="small"
                                                    sx={{
                                                        backgroundColor: COLORS.WARNING,
                                                        color: 'white',
                                                        fontSize: '0.75rem',
                                                        fontWeight: 600
                                                    }}
                                                />
                                            )}
                                        </Stack>
                                    }
                                />
                            </ListItem>
                            {index < recentActivities.length - 1 && <Divider />}
                        </Box>
                    ))}
                </List>
            </CardContent>
        </Card>
    );

    // Main render
    if (loading) {
        return renderLoadingState();
    }

    return (
        <Container maxWidth="xl" sx={{ py: 3 }}>
            {renderHeader()}
            {error && renderErrorState()}
            {renderStatsCards()}
            {renderQuickActions()}
            {renderAdditionalFeatures()}

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 4 }}>
                <Box sx={{ flex: '1 1 300px', minWidth: '250px' }}>
                    {/*{renderUnitTypeDistribution()}*/}
                </Box>
                <Box sx={{ flex: '1 1 300px', minWidth: '250px' }}>
                    {renderTopUnits()}
                </Box>
            </Box>

            {/*{renderRecentActivities()}*/}
        </Container>
    );
}