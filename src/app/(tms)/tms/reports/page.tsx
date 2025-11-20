'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Card,
  CardContent,
  Chip,
  ChipProps,
  CircularProgress,
  Divider,
  LinearProgress,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import {
  Assessment as AssessmentIcon,
  BarChart as BarChartIcon,
  Business as BusinessIcon,
  MenuBook as MenuBookIcon,
  PendingActions as PendingActionsIcon,
  School as SchoolIcon,
  Timeline as TimelineIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import {
  getProgramStatusColor,
  getProgramStatusLabel,
} from '@/constants/programs';
import { API_ROUTES } from '@/constants/routes';
import type { ReportsOverviewResponse } from '@/lib/api/schemas/reports';

const numberFormatter = new Intl.NumberFormat('vi-VN');
const decimalFormatter = new Intl.NumberFormat('vi-VN', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

const chipColorFromStatus = (status: string | null): ChipProps['color'] => {
  if (!status) return 'default';
  const mapped = getProgramStatusColor(status as string);
  switch (mapped) {
    case 'error':
    case 'info':
    case 'success':
    case 'warning':
      return mapped;
    default:
      return 'default';
  }
};

const formatDateTime = (value: string | null): string => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('vi-VN');
};

export default function TmsReportsPage(): JSX.Element {
  const [data, setData] = useState<ReportsOverviewResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchReports = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(API_ROUTES.TMS.REPORTS_OVERVIEW);
        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.error || 'Không thể tải dữ liệu báo cáo');
        }

        if (!cancelled) {
          setData(result.data as ReportsOverviewResponse);
        }
      } catch (err) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : 'Đã xảy ra lỗi khi tải báo cáo';
          setError(message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchReports();

    return () => {
      cancelled = true;
    };
  }, []);

  const totalStatusCount = useMemo(() => {
    if (!data) return 0;
    return data.programStatus.reduce((sum, item) => sum + item.count, 0);
  }, [data]);

  const totalCoursesCount = useMemo(() => {
    if (!data) return 0;
    return data.courseTypeBreakdown.reduce((sum, item) => sum + item.count, 0);
  }, [data]);

  const totalCourseStatus = useMemo(() => {
    if (!data) return 0;
    return data.courseStatusBreakdown.reduce((sum, item) => sum + item.count, 0);
  }, [data]);

  const summaryCards = useMemo(() => {
    if (!data) return [];
    return [
      {
        title: 'Tổng số chương trình',
        value: numberFormatter.format(data.summary.totalPrograms),
        subtitle: `${numberFormatter.format(data.summary.activePrograms)} chương trình đang hoạt động`,
        icon: <SchoolIcon />,
        color: '#1976d2',
      },
      {
        title: 'Chương trình đang chờ duyệt',
        value: numberFormatter.format(data.summary.pendingPrograms),
        subtitle: `${numberFormatter.format(data.summary.draftPrograms)} chương trình ở trạng thái nháp`,
        icon: <PendingActionsIcon />,
        color: '#ed6c02',
      },
      {
        title: 'Tổng số học phần',
        value: numberFormatter.format(data.summary.totalCourses),
        subtitle: `${numberFormatter.format(totalCoursesCount)} lượt phân loại học phần`,
        icon: <MenuBookIcon />,
        color: '#2e7d32',
      },
      {
        title: 'Ngành đào tạo',
        value: numberFormatter.format(data.summary.totalMajors),
        subtitle: 'Số lượng ngành hiện có trong hệ thống',
        icon: <BusinessIcon />,
        color: '#6d4c41',
      },
      {
        title: 'Tổng tín chỉ',
        value: numberFormatter.format(data.summary.totalCredits),
        subtitle: 'Tổng tín chỉ tích lũy của tất cả chương trình',
        icon: <TimelineIcon />,
        color: '#0288d1',
      },
      {
        title: 'Học phần trung bình',
        value: decimalFormatter.format(data.summary.averageCoursesPerProgram),
        subtitle: 'Số học phần/ chương trình (trung bình)',
        icon: <TrendingUpIcon />,
        color: '#ab47bc',
      },
    ];
  }, [data, totalCoursesCount]);

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f8fafc', py: 4 }}>
      <Box sx={{ py: 4, px: 3, width: '100%' }}>
        {/* Header */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, md: 5 },
            mb: 4,
            color: 'white',
            borderRadius: 2,
            background: 'linear-gradient(135deg, #00695c 0%, #26a69a 100%)',
          }}
        >
          <Stack spacing={2} alignItems="center" textAlign="center">
            <AssessmentIcon sx={{ fontSize: 64 }} />
            <Typography variant="h3" component="h1" sx={{ fontWeight: 'bold' }}>
              Báo cáo & Phân tích TMS
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9 }}>
              Tổng quan số liệu đào tạo được tổng hợp trực tiếp từ hệ thống
            </Typography>
          </Stack>
        </Paper>

        {/* Loading State */}
        {loading && (
          <Paper sx={{ p: 6, textAlign: 'center', mb: 4 }}>
            <Stack spacing={2} alignItems="center">
              <CircularProgress />
              <Typography variant="body1">Đang tải dữ liệu báo cáo...</Typography>
            </Stack>
          </Paper>
        )}

        {/* Error State */}
        {!loading && error && (
          <Alert severity="error" sx={{ mb: 4 }}>
            {error}
          </Alert>
        )}

        {/* Content */}
        {!loading && !error && data && (
          <Stack spacing={4}>
            {/* Summary Cards */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr',
                  sm: 'repeat(2, 1fr)',
                  md: 'repeat(3, 1fr)',
                  lg: 'repeat(3, 1fr)',
                  xl: 'repeat(6, 1fr)',
                },
                gap: 3,
              }}
            >
              {summaryCards.map((item) => (
                <Card key={item.title} elevation={2}>
                  <CardContent>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                      <Stack spacing={0.5} sx={{ flex: 1 }}>
                        <Typography variant="subtitle2" color="text.secondary">
                          {item.title}
                        </Typography>
                        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                          {item.value}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {item.subtitle}
                        </Typography>
                      </Stack>
                      <Avatar sx={{ bgcolor: item.color, width: 48, height: 48 }}>
                        {item.icon}
                      </Avatar>
                    </Stack>
                  </CardContent>
                </Card>
              ))}
            </Box>

            {/* Status & Breakdown Section */}
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
              {/* Program Status */}
              <Paper elevation={2} sx={{ flex: 1, p: 3 }}>
                <Stack spacing={2}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    Trạng thái chương trình đào tạo
                  </Typography>
                  {data.programStatus.length === 0 ? (
                    <Typography color="text.secondary">Không có dữ liệu</Typography>
                  ) : (
                    <List disablePadding>
                      {data.programStatus.map((item, index) => {
                        const percent = totalStatusCount ? Math.round((item.count / totalStatusCount) * 100) : 0;
                        const chipColor = chipColorFromStatus(item.status);
                        return (
                          <React.Fragment key={item.status || index}>
                            {index > 0 && <Divider component="li" sx={{ my: 1 }} />}
                            <ListItem sx={{ px: 0 }}>
                              <Stack sx={{ width: '100%' }} spacing={1.5}>
                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                  <Chip
                                    size="small"
                                    label={getProgramStatusLabel(item.status)}
                                    color={chipColor}
                                    variant={chipColor === 'default' ? 'outlined' : 'filled'}
                                  />
                                  <Typography variant="body2" color="text.secondary">
                                    {numberFormatter.format(item.count)} ({percent}%)
                                  </Typography>
                                </Stack>
                                <LinearProgress
                                  variant="determinate"
                                  value={percent}
                                  sx={{ height: 8, borderRadius: 4 }}
                                />
                              </Stack>
                            </ListItem>
                          </React.Fragment>
                        );
                      })}
                    </List>
                  )}
                </Stack>
              </Paper>

              {/* Course Type Breakdown */}
              <Paper elevation={2} sx={{ flex: 1, p: 3 }}>
                <Stack spacing={2}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    Phân bổ học phần theo loại
                  </Typography>
                  {data.courseTypeBreakdown.length === 0 ? (
                    <Typography color="text.secondary">Không có dữ liệu</Typography>
                  ) : (
                    <List disablePadding>
                      {data.courseTypeBreakdown.map((item, index) => {
                        const percent = totalCoursesCount ? Math.round((item.count / totalCoursesCount) * 100) : 0;
                        return (
                          <React.Fragment key={item.type || index}>
                            {index > 0 && <Divider component="li" sx={{ my: 1 }} />}
                            <ListItem sx={{ px: 0 }}>
                              <Stack sx={{ width: '100%' }} spacing={1.5}>
                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                    {item.label}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    {numberFormatter.format(item.count)} ({percent}%)
                                  </Typography>
                                </Stack>
                                <LinearProgress
                                  variant="determinate"
                                  value={percent}
                                  sx={{ height: 8, borderRadius: 4 }}
                                />
                              </Stack>
                            </ListItem>
                          </React.Fragment>
                        );
                      })}
                    </List>
                  )}
                </Stack>
              </Paper>

              {/* Course Status Breakdown */}
              <Paper elevation={2} sx={{ flex: 1, p: 3 }}>
                <Stack spacing={2}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    Trạng thái học phần
                  </Typography>
                  {data.courseStatusBreakdown.length === 0 ? (
                    <Typography color="text.secondary">Không có dữ liệu</Typography>
                  ) : (
                    <List disablePadding>
                      {data.courseStatusBreakdown.map((item, index) => {
                        const percent = totalCourseStatus ? Math.round((item.count / totalCourseStatus) * 100) : 0;
                        return (
                          <React.Fragment key={item.status || index}>
                            {index > 0 && <Divider component="li" sx={{ my: 1 }} />}
                            <ListItem sx={{ px: 0 }}>
                              <Stack sx={{ width: '100%' }} spacing={1.5}>
                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                    {item.label}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    {numberFormatter.format(item.count)} ({percent}%)
                                  </Typography>
                                </Stack>
                                <LinearProgress
                                  variant="determinate"
                                  value={percent}
                                  sx={{ height: 8, borderRadius: 4 }}
                                />
                              </Stack>
                            </ListItem>
                          </React.Fragment>
                        );
                      })}
                    </List>
                  )}
                </Stack>
              </Paper>
            </Stack>

            {/* Distribution Section */}
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
              {/* Programs by Org Unit */}
              <Paper elevation={2} sx={{ flex: 1, p: 3 }}>
                <Stack spacing={2}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    Chương trình theo đơn vị
                  </Typography>
                  {data.programsByOrgUnit.length === 0 ? (
                    <Typography color="text.secondary">Không có dữ liệu</Typography>
                  ) : (
                    <List disablePadding>
                      {data.programsByOrgUnit.map((item, index) => (
                        <React.Fragment key={item.orgUnitId ?? `ou-${index}`}>
                          {index > 0 && <Divider component="li" sx={{ my: 1 }} />}
                          <ListItem sx={{ px: 0 }}>
                            <ListItemAvatar>
                              <Avatar>
                                <BarChartIcon />
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              secondary={
                                <React.Fragment>
                                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                    {item.orgUnitName}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    {item.orgUnitCode ? `Mã đơn vị: ${item.orgUnitCode}` : 'Chưa phân bổ'}
                                  </Typography>
                                </React.Fragment>
                              }
                            />
                            <Typography variant="body2" color="text.secondary">
                              {numberFormatter.format(item.programCount)} CTĐT
                            </Typography>
                          </ListItem>
                        </React.Fragment>
                      ))}
                    </List>
                  )}
                </Stack>
              </Paper>

              {/* Block Distribution */}
              <Paper elevation={2} sx={{ flex: 1, p: 3 }}>
                <Stack spacing={2}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    Phân bổ khối học phần
                  </Typography>
                  {data.blockDistribution.length === 0 ? (
                    <Typography color="text.secondary">Không có dữ liệu</Typography>
                  ) : (
                    <List disablePadding>
                      {data.blockDistribution.map((item, index) => (
                        <React.Fragment key={item.blockType || index}>
                          {index > 0 && <Divider component="li" sx={{ my: 1 }} />}
                          <ListItem sx={{ px: 0 }}>
                            <ListItemText
                              primary={<Typography sx={{ fontWeight: 500 }}>{item.label}</Typography>}
                            />
                            <Typography variant="body2" color="text.secondary">
                              {numberFormatter.format(item.count)} khối
                            </Typography>
                          </ListItem>
                        </React.Fragment>
                      ))}
                    </List>
                  )}
                </Stack>
              </Paper>
            </Stack>

            {/* Top Programs Section */}
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
              {/* Top Programs by Courses */}
              <Paper elevation={2} sx={{ flex: 1, p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                  Top chương trình theo số học phần
                </Typography>
                {data.topProgramsByCourses.length === 0 ? (
                  <Typography color="text.secondary">Không có dữ liệu</Typography>
                ) : (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Chương trình</TableCell>
                          <TableCell align="right">Học phần</TableCell>
                          <TableCell align="right">Tín chỉ</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {data.topProgramsByCourses.map((program) => (
                          <TableRow key={program.programId} hover>
                            <TableCell>
                              <Stack spacing={0.5}>
                                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                  {program.name}
                                </Typography>
                                <Stack direction="row" spacing={1} alignItems="center">
                                  <Typography variant="caption" color="text.secondary">
                                    {program.code || 'Không mã'}
                                  </Typography>
                                  <Chip
                                    size="small"
                                    label={getProgramStatusLabel(program.status ?? 'UNKNOWN')}
                                    color={chipColorFromStatus(program.status ?? null)}
                                    variant={chipColorFromStatus(program.status ?? null) === 'default' ? 'outlined' : 'filled'}
                                  />
                                </Stack>
                              </Stack>
                            </TableCell>
                            <TableCell align="right">{numberFormatter.format(program.totalCourses)}</TableCell>
                            <TableCell align="right">{numberFormatter.format(program.totalCredits)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Paper>

              {/* Top Programs by Credits */}
              <Paper elevation={2} sx={{ flex: 1, p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                  Top chương trình theo tín chỉ
                </Typography>
                {data.topProgramsByCredits.length === 0 ? (
                  <Typography color="text.secondary">Không có dữ liệu</Typography>
                ) : (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Chương trình</TableCell>
                          <TableCell align="right">Tín chỉ</TableCell>
                          <TableCell align="right">Học phần</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {data.topProgramsByCredits.map((program) => (
                          <TableRow key={program.programId} hover>
                            <TableCell>
                              <Stack spacing={0.5}>
                                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                  {program.name}
                                </Typography>
                                <Stack direction="row" spacing={1} alignItems="center">
                                  <Typography variant="caption" color="text.secondary">
                                    {program.code || 'Không mã'}
                                  </Typography>
                                  <Chip
                                    size="small"
                                    label={getProgramStatusLabel(program.status ?? 'UNKNOWN')}
                                    color={chipColorFromStatus(program.status ?? null)}
                                    variant={chipColorFromStatus(program.status ?? null) === 'default' ? 'outlined' : 'filled'}
                                  />
                                </Stack>
                              </Stack>
                            </TableCell>
                            <TableCell align="right">{numberFormatter.format(program.totalCredits)}</TableCell>
                            <TableCell align="right">{numberFormatter.format(program.totalCourses)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Paper>
            </Stack>

            {/* Recent Activity Section */}
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
              {/* Recent Programs */}
              <Paper elevation={2} sx={{ flex: 1, p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                  Cập nhật chương trình gần đây
                </Typography>
                {data.recentPrograms.length === 0 ? (
                  <Typography color="text.secondary">Không có dữ liệu</Typography>
                ) : (
                  <List disablePadding>
                    {data.recentPrograms.map((program, index) => (
                      <React.Fragment key={program.programId}>
                        {index > 0 && <Divider component="li" sx={{ my: 1 }} />}
                        <ListItem sx={{ px: 0 }}>
                          <ListItemAvatar>
                            <Avatar sx={{ bgcolor: '#1976d2' }}>
                              <SchoolIcon />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={program.name}
                            secondary={
                              program.orgUnitName
                                ? `${program.code || 'Không mã'} • ${program.orgUnitName}`
                                : program.code || 'Không mã'
                            }
                          />
                          <Stack alignItems="flex-end" spacing={0.5}>
                            <Chip
                              size="small"
                              label={getProgramStatusLabel(program.status ?? 'UNKNOWN')}
                              color={chipColorFromStatus(program.status ?? null)}
                              variant={chipColorFromStatus(program.status ?? null) === 'default' ? 'outlined' : 'filled'}
                            />
                            <Typography variant="caption" color="text.secondary">
                              {formatDateTime(program.updatedAt)}
                            </Typography>
                          </Stack>
                        </ListItem>
                      </React.Fragment>
                    ))}
                  </List>
                )}
              </Paper>

              {/* Recent Courses */}
              <Paper elevation={2} sx={{ flex: 1, p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                  Cập nhật học phần gần đây
                </Typography>
                {data.recentCourses.length === 0 ? (
                  <Typography color="text.secondary">Không có dữ liệu</Typography>
                ) : (
                  <List disablePadding>
                    {data.recentCourses.map((course, index) => (
                      <React.Fragment key={course.courseId}>
                        {index > 0 && <Divider component="li" sx={{ my: 1 }} />}
                        <ListItem sx={{ px: 0 }}>
                          <ListItemAvatar>
                            <Avatar sx={{ bgcolor: '#2e7d32' }}>
                              <MenuBookIcon />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={course.name}
                            secondary={
                              course.orgUnitName
                                ? `${course.code} • ${course.orgUnitName}`
                                : course.code
                            }
                          />
                          <Typography variant="caption" color="text.secondary">
                            {formatDateTime(course.updatedAt)}
                          </Typography>
                        </ListItem>
                      </React.Fragment>
                    ))}
                  </List>
                )}
              </Paper>
            </Stack>
          </Stack>
        )}
      </Box>
    </Box>
  );
}
