'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Stack,
  Button,
  Card,
  CardContent,
  Chip,
  IconButton,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  ChipProps,
  Avatar,
  Divider,
  Fade,
  Tooltip,
  Badge,
} from '@mui/material';
import {
  Edit as EditIcon,
  ArrowBack as ArrowBackIcon,
  School as SchoolIcon,
  BookmarkBorder as BookmarkIcon,
  Schedule as ScheduleIcon,
  Language as LanguageIcon,
  TrendingUp as TrendingUpIcon,
  Description as DescriptionIcon,
  Verified as VerifiedIcon,
  People as PeopleIcon,
  History as HistoryIcon,
  Assessment as AssessmentIcon,
  Info as InfoIcon,
  AttachMoney as MoneyIcon,
  CalendarToday as CalendarIcon,
  Code as CodeIcon,
  Business as OrgIcon,
  Timeline as TimelineIcon,
  CheckCircle as ActiveIcon,
  EditNote as DraftIcon,
  Pending as ProposedIcon,
  PauseCircle as SuspendedIcon,
  Cancel as ClosedIcon,
} from '@mui/icons-material';
import { useRouter, useParams } from 'next/navigation';

type IdLike = number | string;

interface Major {
  id: IdLike;
  code: string;
  name_vi: string;
  name_en?: string;
  short_name?: string;
  slug?: string;
  is_moet_standard?: boolean;
  degree_level: string;
  field_cluster?: string;
  org_unit_id: IdLike;
  duration_years?: number | string;
  total_credits_min?: number | string;
  total_credits_max?: number | string;
  semesters_per_year?: number | string;
  start_terms?: string;
  status: string;
  established_at?: string;
  closed_at?: string;
  description?: string;
  created_by?: IdLike | null;
  updated_by?: IdLike | null;
  created_at?: string;
  updated_at?: string;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`major-tabpanel-${index}`}
      aria-labelledby={`major-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export default function MajorDetailPage() {
  const router = useRouter();
  const params = useParams();
  const majorId = params.id as string;
  
  const [major, setMajor] = useState<Major | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [deleteDialog, setDeleteDialog] = useState(false);

  // Fetch major data
  useEffect(() => {
    const fetchMajor = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/tms/majors/${majorId}`);
        const data = await response.json();

        if (data.success) {
          const payload = data.data?.data ?? data.data;
          setMajor(payload || null);
        } else {
          setError(data.error || 'Failed to fetch major');
        }
      } catch (err) {
        setError('Network error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (majorId) {
      fetchMajor();
    }
  }, [majorId]);

  const getStatusConfig = (status: string) => {
    const normalized = status.toUpperCase();

    switch (normalized) {
      case 'ACTIVE':
        return {
          color: 'success',
          label: 'Hoạt động',
          icon: <ActiveIcon />,
          bgColor: 'rgba(76, 175, 80, 0.1)',
          textColor: '#2e7d32'
        };
      case 'SUSPENDED':
        return {
          color: 'warning',
          label: 'Tạm dừng',
          icon: <SuspendedIcon />,
          bgColor: 'rgba(255, 152, 0, 0.1)',
          textColor: '#f57c00'
        };
      case 'CLOSED':
        return {
          color: 'error',
          label: 'Đã đóng',
          icon: <ClosedIcon />,
          bgColor: 'rgba(244, 67, 54, 0.1)',
          textColor: '#d32f2f'
        };
      case 'PROPOSED':
        return {
          color: 'info',
          label: 'Đề xuất',
          icon: <ProposedIcon />,
          bgColor: 'rgba(33, 150, 243, 0.1)',
          textColor: '#1976d2'
        };
      case 'DRAFT':
      default:
        return {
          color: 'default',
          label: 'Nháp',
          icon: <DraftIcon />,
          bgColor: 'rgba(158, 158, 158, 0.1)',
          textColor: '#616161'
        };
    }
  };

  const getDegreeLevelText = (level?: string) => {
    if (!level) return '—';

    switch (level.toLowerCase()) {
      case 'bachelor':
        return 'Cử nhân';
      case 'master':
        return 'Thạc sĩ';
      case 'doctor':
        return 'Tiến sĩ';
      case 'associate':
        return 'Cao đẳng';
      default:
        return level;
    }
  };

  const parseNumeric = (value: number | string | null | undefined): number | null => {
    if (value === null || value === undefined) return null;
    if (typeof value === 'number') {
      return Number.isNaN(value) ? null : value;
    }

    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  };

  const formatNumber = (value: number | string | null | undefined, fallback: string = '—') => {
    const parsed = parseNumeric(value);
    if (parsed === null) return fallback;

    return parsed.toLocaleString('vi-VN');
  };

  const formatCreditRange = (
    min?: number | string,
    max?: number | string
  ) => {
    const minVal = parseNumeric(min ?? null);
    const maxVal = parseNumeric(max ?? null);

    if (minVal !== null && maxVal !== null) {
      if (minVal === maxVal) return `${minVal} tín chỉ`;
      return `${minVal} - ${maxVal} tín chỉ`;
    }

    if (minVal !== null) return `${minVal} tín chỉ`;
    if (maxVal !== null) return `${maxVal} tín chỉ`;
    return '—';
  };

  const formatDate = (value?: string | null) => {
    if (!value) return '—';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleDateString('vi-VN');
  };

  const formatBoolean = (value: boolean | null | undefined) => {
    if (value === undefined || value === null) return '—';
    return value ? 'Có' : 'Không';
  };

  const handleDelete = async () => {
    if (!major) return;

    try {
      const response = await fetch(`/api/tms/majors/${major.id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        router.push('/tms/majors');
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to delete major');
      }
    } catch (err) {
      setError('Network error occurred');
    }
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', backgroundColor: '#f8fafc', py: 4 }}>
        <Container maxWidth="lg">
          <Stack alignItems="center" justifyContent="center" sx={{ minHeight: 400 }}>
            <CircularProgress size={60} sx={{ color: 'primary.main' }} />
            <Typography variant="h6" sx={{ mt: 2, color: 'text.secondary' }}>
              Đang tải thông tin ngành đào tạo...
            </Typography>
          </Stack>
        </Container>
      </Box>
    );
  }

  if (error || !major) {
    return (
      <Box sx={{ minHeight: '100vh', backgroundColor: '#f8fafc', py: 4 }}>
        <Container maxWidth="lg">
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
            {error || 'Ngành đào tạo không tồn tại'}
          </Alert>
        </Container>
      </Box>
    );
  }

  const durationYears = parseNumeric(major.duration_years);
  const semestersPerYear = parseNumeric(major.semesters_per_year);
  const creditRangeText = formatCreditRange(major.total_credits_min, major.total_credits_max);
  const startTerms = major.start_terms || '—';

  const statusConfig = getStatusConfig(major.status);

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f8fafc', py: 4 }}>
      <Container maxWidth='lg'>
        {/* Header */}
        <Fade in={true} timeout={800}>
          <Paper 
            elevation={0} 
            sx={{ 
              p: 4, 
              background: `linear-gradient(135deg, ${statusConfig.bgColor} 0%, rgba(255,255,255,0.95) 100%)`,
              color: 'text.primary', 
              borderRadius: 3, 
              mb: 4,
              border: '1px solid',
              borderColor: 'divider',
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: `linear-gradient(45deg, ${statusConfig.bgColor} 0%, transparent 50%)`,
                opacity: 0.1
              }
            }}
          >
            <Stack direction="row" alignItems="center" spacing={2} mb={3} position="relative" zIndex={1}>
              <Tooltip title="Quay lại">
                <IconButton
                  onClick={() => router.back()}
                  sx={{ 
                    bgcolor: 'rgba(255,255,255,0.9)',
                    '&:hover': { bgcolor: 'white' },
                    transition: 'all 0.2s ease-in-out'
                  }}
                >
                  <ArrowBackIcon />
                </IconButton>
              </Tooltip>
              <Stack spacing={1} sx={{ flexGrow: 1 }}>
                <Typography variant="h3" component="h1" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                  {major.name_vi}
                </Typography>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Typography variant="h6" sx={{ color: 'text.secondary' }}>
                    {major.code}
                  </Typography>
                  <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: 'text.secondary' }} />
                  <Typography variant="h6" sx={{ color: 'text.secondary' }}>
                    {getDegreeLevelText(major.degree_level)}
                  </Typography>
                  {major.name_en && (
                    <>
                      <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: 'text.secondary' }} />
                      <Typography variant="h6" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                        {major.name_en}
                      </Typography>
                    </>
                  )}
                </Stack>
              </Stack>
              <Stack direction="row" spacing={2}>
                <Button
                  variant="contained"
                  startIcon={<EditIcon />}
                  sx={{ 
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600,
                    px: 3,
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': { transform: 'translateY(-1px)', boxShadow: 3 }
                  }}
                  onClick={() => router.push(`/tms/majors/${major.id}/edit`)}
                >
                  Chỉnh sửa
                </Button>
                <Chip 
                  icon={statusConfig.icon}
                  label={statusConfig.label}
                  sx={{
                    bgcolor: statusConfig.bgColor,
                    color: statusConfig.textColor,
                    fontWeight: 'bold',
                    border: `1px solid ${statusConfig.textColor}30`,
                    '& .MuiChip-icon': {
                      color: statusConfig.textColor
                    }
                  }}
                />
              </Stack>
            </Stack>

            <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider', maxWidth: 320 }}>
              <Stack alignItems="center" spacing={1}>
                <Avatar sx={{ bgcolor: 'info.light', width: 48, height: 48 }}>
                  <ScheduleIcon color="info" />
                </Avatar>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'info.main' }}>
                  {durationYears !== null ? durationYears : '—'}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                  Năm đào tạo
                </Typography>
              </Stack>
            </Paper>
          </Paper>
        </Fade>

        {/* Tabs - simplified */}
        <Fade in={true} timeout={1000}>
          <Paper 
            elevation={0} 
            sx={{ 
              mb: 4, 
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              overflow: 'hidden'
            }}
          >
            <Tabs value={0} variant="fullWidth">
              <Tab icon={<InfoIcon />} iconPosition="start" label="Thông tin chung" />
            </Tabs>

          {/* General Information */}
          <TabPanel value={0} index={0}>
            <Fade in={tabValue === 0} timeout={300}>
              <Stack spacing={4}>
                <Stack 
                  direction={{ xs: 'column', md: 'row' }} 
                  spacing={3}
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: {
                      xs: '1fr',
                      md: 'repeat(2, 1fr)'
                    },
                    gap: 3
                  }}
                >
                  <Card 
                    elevation={0} 
                    sx={{ 
                      borderRadius: 3,
                      border: '1px solid',
                      borderColor: 'divider',
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': { transform: 'translateY(-2px)', boxShadow: 2 }
                    }}
                  >
                    <Box sx={{ p: 3, borderBottom: '1px solid', borderColor: 'divider' }}>
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <Avatar sx={{ bgcolor: 'primary.light', width: 40, height: 40 }}>
                          <InfoIcon color="primary" />
                        </Avatar>
                        <Typography variant="h6" fontWeight="bold" color="text.primary">
                          Thông tin cơ bản
                        </Typography>
                      </Stack>
                    </Box>
                    <CardContent sx={{ p: 0 }}>
                      <Stack spacing={0}>
                        {[
                          { icon: <BookmarkIcon />, label: 'Bằng cấp', value: getDegreeLevelText(major.degree_level) },
                          { icon: <OrgIcon />, label: 'Đơn vị quản lý (ID)', value: String(major.org_unit_id) },
                          { icon: <CodeIcon />, label: 'Mã ngành', value: `${major.code}${major.short_name ? ` • ${major.short_name}` : ''}` },
                          { icon: <LanguageIcon />, label: 'Slug', value: major.slug || '—' },
                          { icon: <TrendingUpIcon />, label: 'Nhóm ngành', value: major.field_cluster || '—' },
                          { icon: <VerifiedIcon />, label: 'Chuẩn MOET', value: formatBoolean(major.is_moet_standard) }
                        ].map((item, index) => (
                          <Box key={index}>
                            <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Avatar sx={{ bgcolor: 'grey.100', width: 32, height: 32 }}>
                                {item.icon}
                              </Avatar>
                              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                                <Typography variant="body2" color="text.secondary" fontWeight={500}>
                                  {item.label}
                                </Typography>
                                <Typography variant="body1" fontWeight={600} sx={{ wordBreak: 'break-word' }}>
                                  {item.value}
                                </Typography>
                              </Box>
                            </Box>
                            {index < 8 && <Divider />}
                          </Box>
                        ))}
                      </Stack>
                    </CardContent>
                  </Card>

                  <Card 
                    elevation={0} 
                    sx={{ 
                      borderRadius: 3,
                      border: '1px solid',
                      borderColor: 'divider',
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': { transform: 'translateY(-2px)', boxShadow: 2 }
                    }}
                  >
                    <Box sx={{ p: 3, borderBottom: '1px solid', borderColor: 'divider' }}>
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <Avatar sx={{ bgcolor: 'info.light', width: 40, height: 40 }}>
                          <ScheduleIcon color="info" />
                        </Avatar>
                        <Typography variant="h6" fontWeight="bold" color="text.primary">
                          Thông số đào tạo
                        </Typography>
                      </Stack>
                    </Box>
                    <CardContent sx={{ p: 0 }}>
                      <Stack spacing={0}>
                        {[
                          { icon: <ScheduleIcon />, label: 'Thời gian đào tạo', value: durationYears !== null ? `${durationYears} năm` : '—' },
                          { icon: <CalendarIcon />, label: 'Số học kỳ / năm', value: semestersPerYear !== null ? semestersPerYear : '—' },
                          { icon: <TrendingUpIcon />, label: 'Tổng tín chỉ', value: creditRangeText },
                          { icon: <CalendarIcon />, label: 'Kỳ tuyển sinh', value: startTerms },
                          { icon: <PeopleIcon />, label: 'Chỉ tiêu mặc định', value: '—' }
                        ].map((item, index) => (
                          <Box key={index}>
                            <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Avatar sx={{ bgcolor: 'grey.100', width: 32, height: 32 }}>
                                {item.icon}
                              </Avatar>
                              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                                <Typography variant="body2" color="text.secondary" fontWeight={500}>
                                  {item.label}
                                </Typography>
                                <Typography variant="body1" fontWeight={600}>
                                  {item.value}
                                </Typography>
                              </Box>
                            </Box>
                            {index < 4 && <Divider />}
                          </Box>
                        ))}
                      </Stack>
                    </CardContent>
                  </Card>
                </Stack>

                <Card 
                  elevation={0} 
                  sx={{ 
                    borderRadius: 3,
                    border: '1px solid',
                    borderColor: 'divider',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': { transform: 'translateY(-2px)', boxShadow: 2 }
                  }}
                >
                  <Box sx={{ p: 3, borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <Avatar sx={{ bgcolor: 'warning.light', width: 40, height: 40 }}>
                        <HistoryIcon color="warning" />
                      </Avatar>
                      <Typography variant="h6" fontWeight="bold" color="text.primary">
                        Mốc thời gian
                      </Typography>
                    </Stack>
                  </Box>
                  <CardContent sx={{ p: 0 }}>
                    <Stack spacing={0}>
                      {[
                        { label: 'Ngày thành lập', value: formatDate(major.established_at) },
                        { label: 'Ngày đóng', value: formatDate(major.closed_at) },
                        { label: 'Ngày tạo', value: formatDate(major.created_at) },
                        { label: 'Ngày cập nhật', value: formatDate(major.updated_at) }
                      ].map((item, index) => (
                        <Box key={index}>
                          <Box sx={{ p: 3 }}>
                            <Typography variant="body2" color="text.secondary" fontWeight={500}>
                              {item.label}
                            </Typography>
                            <Typography variant="body1" fontWeight={600}>
                              {item.value}
                            </Typography>
                          </Box>
                          {index < 3 && <Divider />}
                        </Box>
                      ))}
                    </Stack>
                  </CardContent>
                </Card>

                {major.description && (
                  <Stack spacing={3}>
                    {major.description && (
                      <Card 
                        elevation={0} 
                        sx={{ 
                          borderRadius: 3,
                          border: '1px solid',
                          borderColor: 'divider',
                          transition: 'all 0.2s ease-in-out',
                          '&:hover': { transform: 'translateY(-2px)', boxShadow: 2 }
                        }}
                      >
                        <Box sx={{ p: 3, borderBottom: '1px solid', borderColor: 'divider' }}>
                          <Stack direction="row" alignItems="center" spacing={2}>
                            <Avatar sx={{ bgcolor: 'secondary.light', width: 40, height: 40 }}>
                              <DescriptionIcon color="secondary" />
                            </Avatar>
                            <Typography variant="h6" fontWeight="bold" color="text.primary">
                              Mô tả
                            </Typography>
                          </Stack>
                        </Box>
                        <CardContent sx={{ p: 3 }}>
                          <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                            {major.description}
                          </Typography>
                        </CardContent>
                      </Card>
                    )}
                  </Stack>
                )}

                {/* Related sections removed for simplification */}
              </Stack>
            </Fade>
          </TabPanel>

          {/* Removed other tabs for simplification */}
          </Paper>
        </Fade>

        {/* Delete Confirmation Dialog */}
        <Dialog 
          open={deleteDialog} 
          onClose={() => setDeleteDialog(false)}
          PaperProps={{
            sx: {
              borderRadius: 3,
              minWidth: 400
            }
          }}
        >
          <DialogTitle sx={{ pb: 2 }}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Avatar sx={{ bgcolor: 'error.light', width: 40, height: 40 }}>
                <ClosedIcon color="error" />
              </Avatar>
              <Typography variant="h6" fontWeight="bold">
                Xác nhận xóa
              </Typography>
            </Stack>
          </DialogTitle>
          <DialogContent sx={{ pb: 2 }}>
            <Typography variant="body1" sx={{ lineHeight: 1.6 }}>
              Bạn có chắc chắn muốn xóa ngành đào tạo <strong>"{major?.name_vi}"</strong> không?
              <br />
              Hành động này không thể hoàn tác.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 2 }}>
            <Button 
              onClick={() => setDeleteDialog(false)}
              sx={{ borderRadius: 2, textTransform: 'none' }}
            >
              Hủy
            </Button>
            <Button 
              onClick={handleDelete}
              color="error"
              variant="contained"
              sx={{ borderRadius: 2, textTransform: 'none' }}
            >
              Xóa
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
}
