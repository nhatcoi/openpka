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
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  Delete as DeleteIcon,
  CheckCircle as ActiveIcon,
  EditNote as DraftIcon,
  Pending as ProposedIcon,
  PauseCircle as SuspendedIcon,
  Cancel as ClosedIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { 
  MajorStatus, 
  getMajorStatusColor, 
  getMajorStatusLabel,
  formatMajorDuration,
  formatMajorCredits
} from '@/constants/majors';

interface Major {
  id: number;
  code: string;
  name_vi: string;
  name_en?: string;
  short_name?: string;
  degree_level: string;
  duration_years?: number;
  total_credits_min?: number;
  total_credits_max?: number;
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
  const color = getMajorStatusColor(status);
  const label = getMajorStatusLabel(status);
  
  let icon = <DraftIcon />;
  switch (status) {
    case MajorStatus.ACTIVE: 
      icon = <ActiveIcon />;
      break;
    case MajorStatus.DRAFT: 
      icon = <DraftIcon />;
      break;
    case MajorStatus.PROPOSED: 
      icon = <ProposedIcon />;
      break;
    case MajorStatus.SUSPENDED: 
      icon = <SuspendedIcon />;
      break;
    case MajorStatus.CLOSED: 
    case MajorStatus.ARCHIVED:
      icon = <ClosedIcon />;
      break;
    default: 
      icon = <DraftIcon />;
  }
  
  return { color, label, icon };
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

  return (
    <Card variant="outlined" sx={{ mb: 2 }}>
      <CardContent>
        <Stack spacing={2}>
          {/* Header */}
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
            <Box flex={1}>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                {major.name_vi}
              </Typography>
              <Stack direction="row" spacing={2} alignItems="center">
                <Typography variant="body2" color="text.secondary">
                  {major.code}
                </Typography>
                <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  {major.degree_level}
                </Typography>
                {major.duration_years && (
                  <>
                    <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      {formatMajorDuration(major.duration_years)}
                    </Typography>
                  </>
                )}
              </Stack>
              {major.name_en && (
                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', mt: 0.5 }}>
                  {major.name_en}
                </Typography>
              )}
            </Box>
            <Chip
              icon={statusConfig.icon}
              label={statusConfig.label}
              color={statusConfig.color}
              size="small"
            />
          </Stack>

          {/* Organization & Credits */}
          <Stack direction="row" spacing={4} flexWrap="wrap">
            {major.OrgUnit && (
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Đơn vị quản lý
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {major.OrgUnit.name}
                </Typography>
              </Box>
            )}
            {(major.total_credits_min || major.total_credits_max) && (
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Tín chỉ
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {formatMajorCredits(major.total_credits_min, major.total_credits_max)}
                </Typography>
              </Box>
            )}
          </Stack>

          {/* Stats */}
          <Stack direction="row" spacing={3} flexWrap="wrap">
            <Box>
              <Typography variant="h6" color="primary.main" fontWeight="bold">
                {major._count?.Program || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Chương trình đào tạo
              </Typography>
            </Box>
            <Box>
              <Typography variant="h6" color="success.main" fontWeight="bold">
                {major._count?.MajorOutcome || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Chuẩn đầu ra
              </Typography>
            </Box>
            <Box>
              <Typography variant="h6" color="warning.main" fontWeight="bold">
                {major._count?.MajorQuotaYear || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Chỉ tiêu tuyển sinh
              </Typography>
            </Box>
            <Box>
              <Typography variant="h6" color="info.main" fontWeight="bold">
                {major._count?.MajorTuition || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Học phí
              </Typography>
            </Box>
          </Stack>

          {/* Actions */}
          <Stack direction="row" spacing={1} justifyContent="flex-end">
            <Button
              variant="outlined"
              size="small"
              startIcon={<VisibilityIcon />}
              onClick={handleView}
            >
              Xem
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<EditIcon />}
              onClick={handleEdit}
            >
              Sửa
            </Button>
            <Tooltip title="Xóa">
              <IconButton
                size="small"
                onClick={handleDelete}
                sx={{ color: 'error.main' }}
              >
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}
