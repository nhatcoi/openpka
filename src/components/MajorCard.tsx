'use client';

import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Chip,
  Stack,
  Typography,
  Button,
  Avatar,
  Divider,
  Paper,
  IconButton,
  Tooltip,
  Fade,
} from '@mui/material';
import {
  SchoolOutlined as SchoolOutlinedIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  Delete as DeleteIcon,
  People as PeopleIcon,
  BookmarkBorder as BookmarkIcon,
  Schedule as ScheduleIcon,
  AccountBalance as OrgIcon,
  AccessTime as TimeIcon,
  TrendingUp as TrendingIcon,
  AttachMoney as MoneyIcon,
  CheckCircle as ActiveIcon,
  EditNote as DraftIcon,
  Pending as ProposedIcon,
  PauseCircle as SuspendedIcon,
  Cancel as ClosedIcon,
  ArrowForward as ArrowIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';

interface Major {
  id: number;
  code: string;
  name_vi: string;
  name_en?: string;
  short_name?: string;
  degree_level: string;
  duration_years?: number;
  status: string;
  org_unit_id: number;
  OrgUnit?: {
    id: number;
    name: string;
    code: string;
    type?: string;
    parent_id?: number;
  };
  Program?: Array<{
    id: number;
    code?: string;
    name_vi?: string;
    name_en?: string;
    version: string;
    status: string;
    total_credits: number;
    effective_from?: string;
    effective_to?: string;
  }>;
  MajorOutcome?: Array<{
    id: number;
    code: string;
    content: string;
    version?: string;
    is_active?: boolean;
  }>;
  MajorQuotaYear?: Array<{
    id: number;
    year: number;
    quota: number;
    note?: string;
  }>;
  MajorTuition?: Array<{
    id: number;
    year: number;
    tuition_group: string;
    amount_vnd: number;
    note?: string;
  }>;
  _count?: {
    Program: number;
    MajorOutcome: number;
    MajorQuotaYear: number;
    MajorTuition: number;
    other_majors: number;
  };
}

interface MajorCardProps {
  major: Major;
  onDelete: (major: Major) => void;
}

// Helper functions for status
const getStatusConfig = (status: string) => {
  switch (status) {
    case 'active': 
      return { 
        color: 'success', 
        label: 'Hoạt động', 
        icon: <ActiveIcon />,
        bgColor: 'rgba(76, 175, 80, 0.1)',
        textColor: '#2e7d32'
      };
    case 'draft': 
      return { 
        color: 'default', 
        label: 'Nháp', 
        icon: <DraftIcon />,
        bgColor: 'rgba(158, 158, 158, 0.1)',
        textColor: '#616161'
      };
    case 'proposed': 
      return { 
        color: 'info', 
        label: 'Đề xuất', 
        icon: <ProposedIcon />,
        bgColor: 'rgba(33, 150, 243, 0.1)',
        textColor: '#1976d2'
      };
    case 'suspended': 
      return { 
        color: 'warning', 
        label: 'Tạm dừng', 
        icon: <SuspendedIcon />,
        bgColor: 'rgba(255, 152, 0, 0.1)',
        textColor: '#f57c00'
      };
    case 'closed': 
      return { 
        color: 'error', 
        label: 'Đóng', 
        icon: <ClosedIcon />,
        bgColor: 'rgba(244, 67, 54, 0.1)',
        textColor: '#d32f2f'
      };
    default: 
      return { 
        color: 'default', 
        label: status, 
        icon: <DraftIcon />,
        bgColor: 'rgba(158, 158, 158, 0.1)',
        textColor: '#616161'
      };
  }
};

export default function MajorCard({ major, onDelete }: MajorCardProps) {
  const router = useRouter();
  const statusConfig = getStatusConfig(major.status);

  const handleView = () => {
    router.push(`/tms/majors/${major.id}`);
  };

  const handleEdit = () => {
    router.push(`/tms/majors/${major.id}/edit`);
  };

  const handleDelete = () => {
    onDelete(major);
  };

  const StatCard = ({ 
    icon, 
    title, 
    value, 
    items, 
    color, 
    iconColor 
  }: {
    icon: React.ReactNode;
    title: string;
    value: number;
    items?: any[];
    color: string;
    iconColor: string;
  }) => (
    <Paper 
      elevation={0} 
      sx={{ 
        p: 2, 
        borderRadius: 2, 
        border: '1px solid', 
        borderColor: 'divider',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: 2,
          borderColor: iconColor,
        }
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1} mb={1}>
        <Avatar sx={{ bgcolor: `${iconColor}20`, width: 32, height: 32 }}>
          {icon}
        </Avatar>
        <Typography variant="body2" color="text.secondary" fontWeight={500}>
          {title}
        </Typography>
      </Stack>
      <Typography variant="h5" color={color} fontWeight="bold">
        {value}
      </Typography>
      {items && items.length > 0 && (
        <Stack spacing={0.5} mt={1.5}>
          {items.slice(0, 2).map((item, index) => (
            <Typography key={index} variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
              • {item.name_vi || item.code || item.year || item.code}: {item.version ? `v${item.version}` : item.content ? item.content.substring(0, 40) + '...' : item.quota ? `${item.quota.toLocaleString()} sinh viên` : `${item.amount_vnd.toLocaleString()} VNĐ`}
            </Typography>
          ))}
          {items.length > 2 && (
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem', fontStyle: 'italic' }}>
              +{items.length - 2} mục khác
            </Typography>
          )}
        </Stack>
      )}
    </Paper>
  );

  return (
    <Fade in={true} timeout={600}>
      <Card 
        sx={{ 
          borderRadius: 3,
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          border: '1px solid',
          borderColor: 'rgba(0,0,0,0.06)',
          transition: 'all 0.3s ease-in-out',
          overflow: 'hidden',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
            borderColor: 'primary.main',
          }
        }}
      >
        <CardContent sx={{ p: 0 }}>
          <Stack spacing={0}>
          {/* Header with Gradient */}
          <Box
            sx={{
              background: `linear-gradient(135deg, ${statusConfig.bgColor} 0%, rgba(255,255,255,0.8) 100%)`,
              p: 3,
              borderBottom: '1px solid',
              borderColor: 'divider'
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
              <Stack spacing={1} flex={1}>
                <Typography variant="h4" fontWeight="bold" color="text.primary">
                  {major.name_vi}
                </Typography>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Typography variant="body1" color="text.secondary" fontWeight={500}>
                    {major.code}
                  </Typography>
                  <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: 'text.secondary' }} />
                  <Typography variant="body1" color="text.secondary" fontWeight={500}>
                    {major.degree_level}
                  </Typography>
                </Stack>
                {major.name_en && (
                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    {major.name_en}
                  </Typography>
                )}
              </Stack>
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
          </Box>

          {/* Organization & Duration */}
          <Box sx={{ p: 3, bgcolor: 'rgba(0,0,0,0.02)' }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3}>
              {major.OrgUnit && (
                <Stack direction="row" alignItems="center" spacing={2} flex={1}>
                  <Avatar sx={{ bgcolor: 'primary.light', width: 40, height: 40 }}>
                    <OrgIcon color="primary" />
                  </Avatar>
                  <Box>
                    <Typography variant="body2" color="text.secondary" fontWeight={500}>
                      Đơn vị quản lý
                    </Typography>
                    <Typography variant="h6" fontWeight="bold" color="text.primary">
                      {major.OrgUnit.name}
                    </Typography>
                  </Box>
                </Stack>
              )}
              {major.duration_years && (
                <Stack direction="row" alignItems="center" spacing={2} flex={1}>
                  <Avatar sx={{ bgcolor: 'info.light', width: 40, height: 40 }}>
                    <TimeIcon color="info" />
                  </Avatar>
                  <Box>
                    <Typography variant="body2" color="text.secondary" fontWeight={500}>
                      Thời gian đào tạo
                    </Typography>
                    <Typography variant="h6" fontWeight="bold" color="text.primary">
                      {major.duration_years} năm
                    </Typography>
                  </Box>
                </Stack>
              )}
            </Stack>
          </Box>

          {/* Related Data */}
          <Box sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom color="text.primary" fontWeight="bold" mb={3}>
              Thông tin liên quan
            </Typography>
            <Stack 
              direction={{ xs: 'column', sm: 'row' }} 
              spacing={2}
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr',
                  sm: 'repeat(2, 1fr)',
                  md: 'repeat(4, 1fr)'
                },
                gap: 2
              }}
            >
              <StatCard
                icon={<BookmarkIcon />}
                title="Chương trình đào tạo"
                value={major._count?.Program || 0}
                items={major.Program}
                color="primary.main"
                iconColor="primary.main"
              />
              <StatCard
                icon={<PeopleIcon />}
                title="Chuẩn đầu ra"
                value={major._count?.MajorOutcome || 0}
                items={major.MajorOutcome}
                color="success.main"
                iconColor="success.main"
              />
              <StatCard
                icon={<ScheduleIcon />}
                title="Chỉ tiêu tuyển sinh"
                value={major._count?.MajorQuotaYear || 0}
                items={major.MajorQuotaYear}
                color="warning.main"
                iconColor="warning.main"
              />
              <StatCard
                icon={<MoneyIcon />}
                title="Học phí"
                value={major._count?.MajorTuition || 0}
                items={major.MajorTuition}
                color="info.main"
                iconColor="info.main"
              />
            </Stack>
          </Box>

          <Divider />
          {/* Actions */}
          <Box sx={{ p: 3, bgcolor: 'rgba(0,0,0,0.02)' }}>
            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Tooltip title="Xem chi tiết">
                <Button
                  variant="outlined"
                  startIcon={<VisibilityIcon />}
                  onClick={handleView}
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600,
                    px: 3,
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-1px)',
                      boxShadow: 2,
                    }
                  }}
                >
                  Xem chi tiết
                </Button>
              </Tooltip>
              <Tooltip title="Chỉnh sửa">
                <Button
                  variant="contained"
                  startIcon={<EditIcon />}
                  onClick={handleEdit}
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600,
                    px: 3,
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-1px)',
                      boxShadow: 3,
                    }
                  }}
                >
                  Chỉnh sửa
                </Button>
              </Tooltip>
              <Tooltip title="Xóa">
                <IconButton
                  onClick={handleDelete}
                  sx={{
                    bgcolor: 'error.light',
                    color: 'error.main',
                    borderRadius: 2,
                    width: 48,
                    height: 48,
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      bgcolor: 'error.main',
                      color: 'white',
                      transform: 'translateY(-1px)',
                      boxShadow: 2,
                    }
                  }}
                >
                  <DeleteIcon />
                </IconButton>
              </Tooltip>
            </Stack>
          </Box>
          </Stack>
        </CardContent>
      </Card>
    </Fade>
  );
}
