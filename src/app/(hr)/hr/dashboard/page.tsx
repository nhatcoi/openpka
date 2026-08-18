'use client';

import { useState, useEffect } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
    Box,
    Paper,
    Typography,
    Grid,
    Card,
    CardContent,
    Alert,
    CircularProgress,
    Divider,
    Button,
} from '@mui/material';
import {
    School as SchoolIcon,
    People as PeopleIcon,
    Work as WorkIcon,
    Business as BusinessIcon,
} from '@mui/icons-material';
import { HR_ROUTES } from '@/constants/routes';
import { useHrStats } from '@/features/hr';

export default function HRDashboardPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    const { data: hrStatsData, isLoading: loading, error: queryError } = useHrStats();
    const [actionError, setActionError] = useState('');

    useEffect(() => {
        if (status === 'loading') return;
        if (!session) {
            void signIn();
        }
    }, [session, status]);

    const error = actionError || (queryError ? (queryError as Error).message : '');

    const totalUnits = hrStatsData?.totalUnits || 0;
    const activeUnits = hrStatsData?.activeUnits || 0;
    const totalEmployees = hrStatsData?.totalEmployees || 0;
    const activeEmployees = hrStatsData?.activeEmployees || 0;

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            <Typography variant="h4" component="h1" gutterBottom>
                Thống kê giảng viên theo cơ cấu tổ chức
            </Typography>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setActionError('')}>
                    {error}
                </Alert>
            )}

            {/* Summary Cards */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <SchoolIcon color="primary" sx={{ fontSize: 40 }} />
                                <Box>
                                    <Typography variant="h4" component="div">
                                        {totalUnits}
                                    </Typography>
                                    <Typography color="text.secondary">
                                        Tổng số đơn vị
                                    </Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <BusinessIcon color="success" sx={{ fontSize: 40 }} />
                                <Box>
                                    <Typography variant="h4" component="div">
                                        {activeUnits}
                                    </Typography>
                                    <Typography color="text.secondary">
                                        Đơn vị hoạt động
                                    </Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <PeopleIcon color="secondary" sx={{ fontSize: 40 }} />
                                <Box>
                                    <Typography variant="h4" component="div">
                                        {totalEmployees}
                                    </Typography>
                                    <Typography color="text.secondary">
                                        Tổng giảng viên
                                    </Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <WorkIcon color="warning" sx={{ fontSize: 40 }} />
                                <Box>
                                    <Typography variant="h4" component="div">
                                        {activeEmployees}
                                    </Typography>
                                    <Typography color="text.secondary">
                                        Giảng viên hoạt động
                                    </Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Quick Access to Org Tree */}
            <Paper sx={{ p: 3 }}>
                <Typography variant="h5" gutterBottom>
                    Truy cập nhanh
                </Typography>
                <Divider sx={{ mb: 2 }} />

                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <Button
                        variant="contained"
                        startIcon={<BusinessIcon />}
                        onClick={() => router.push(HR_ROUTES.ORG_TREE)}
                        size="large"
                    >
                        Xem sơ đồ tổ chức
                    </Button>
                    <Button
                        variant="outlined"
                        startIcon={<PeopleIcon />}
                        onClick={() => router.push(HR_ROUTES.EMPLOYEES)}
                        size="large"
                    >
                        Quản lý nhân viên
                    </Button>
                    <Button
                        variant="outlined"
                        startIcon={<WorkIcon />}
                        onClick={() => router.push(HR_ROUTES.ASSIGNMENTS)}
                        size="large"
                    >
                        Phân công công việc
                    </Button>
                </Box>
            </Paper>
        </Box>
    );
}
