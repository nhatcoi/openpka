'use client';

import React from 'react';
import { Chip } from '@mui/material';
import {
  CheckCircle as ActiveIcon,
  EditNote as DraftIcon,
  Pending as ProposedIcon,
  PauseCircle as SuspendedIcon,
  Cancel as ClosedIcon,
} from '@mui/icons-material';

interface StatusChipProps {
  status: string;
  size?: 'small' | 'medium';
  variant?: 'filled' | 'outlined';
}

export default function StatusChip({ 
  status, 
  size = 'medium',
  variant = 'filled'
}: StatusChipProps) {
  const getStatusConfig = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return {
          color: 'success' as const,
          label: 'Hoạt động',
          icon: <ActiveIcon />,
          bgColor: 'rgba(76, 175, 80, 0.1)',
          textColor: '#2e7d32'
        };
      case 'draft':
        return {
          color: 'default' as const,
          label: 'Nháp',
          icon: <DraftIcon />,
          bgColor: 'rgba(158, 158, 158, 0.1)',
          textColor: '#616161'
        };
      case 'proposed':
        return {
          color: 'info' as const,
          label: 'Đề xuất',
          icon: <ProposedIcon />,
          bgColor: 'rgba(33, 150, 243, 0.1)',
          textColor: '#1976d2'
        };
      case 'suspended':
        return {
          color: 'warning' as const,
          label: 'Tạm dừng',
          icon: <SuspendedIcon />,
          bgColor: 'rgba(255, 152, 0, 0.1)',
          textColor: '#f57c00'
        };
      case 'closed':
        return {
          color: 'error' as const,
          label: 'Đã đóng',
          icon: <ClosedIcon />,
          bgColor: 'rgba(244, 67, 54, 0.1)',
          textColor: '#d32f2f'
        };
      default:
        return {
          color: 'default' as const,
          label: status,
          icon: <DraftIcon />,
          bgColor: 'rgba(158, 158, 158, 0.1)',
          textColor: '#616161'
        };
    }
  };

  const statusConfig = getStatusConfig(status);

  if (variant === 'outlined') {
    return (
      <Chip
        icon={statusConfig.icon}
        label={statusConfig.label}
        size={size}
        variant="outlined"
        sx={{
          borderColor: statusConfig.textColor,
          color: statusConfig.textColor,
          '& .MuiChip-icon': {
            color: statusConfig.textColor
          }
        }}
      />
    );
  }

  return (
    <Chip
      icon={statusConfig.icon}
      label={statusConfig.label}
      size={size}
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
  );
}
