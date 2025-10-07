'use client';

import React from 'react';
import {
  Paper,
  Stack,
  Typography,
  IconButton,
  Chip,
  Tooltip,
  Box,
  Fade,
} from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';

interface StatusConfig {
  color: string;
  label: string;
  icon: React.ReactNode;
  bgColor: string;
  textColor: string;
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  statusConfig?: StatusConfig;
  onBack?: () => void;
  backTooltip?: string;
  children?: React.ReactNode;
}

export default function PageHeader({
  title,
  subtitle,
  statusConfig,
  onBack,
  backTooltip = 'Quay lại',
  children
}: PageHeaderProps) {
  return (
    <Fade in={true} timeout={800}>
      <Paper 
        elevation={0} 
        sx={{ 
          p: 4, 
          background: statusConfig 
            ? `linear-gradient(135deg, ${statusConfig.bgColor} 0%, rgba(255,255,255,0.95) 100%)`
            : 'linear-gradient(135deg, rgba(25, 118, 210, 0.1) 0%, rgba(255,255,255,0.95) 100%)',
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
            background: statusConfig 
              ? `linear-gradient(45deg, ${statusConfig.bgColor} 0%, transparent 50%)`
              : 'linear-gradient(45deg, rgba(25, 118, 210, 0.1) 0%, transparent 50%)',
            opacity: 0.1
          }
        }}
      >
        <Stack direction="row" alignItems="center" spacing={2} position="relative" zIndex={1}>
          {onBack && (
            <Tooltip title={backTooltip}>
              <IconButton
                onClick={onBack}
                sx={{ 
                  bgcolor: 'rgba(255,255,255,0.9)',
                  '&:hover': { bgcolor: 'white' },
                  transition: 'all 0.2s ease-in-out'
                }}
              >
                <ArrowBackIcon />
              </IconButton>
            </Tooltip>
          )}
          
          <Stack spacing={1} sx={{ flexGrow: 1 }}>
            <Typography variant="h3" component="h1" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
              {title}
            </Typography>
            {subtitle && (
              <Stack direction="row" alignItems="center" spacing={2}>
                <Typography variant="h6" sx={{ color: 'text.secondary' }}>
                  {subtitle}
                </Typography>
              </Stack>
            )}
          </Stack>
          
          {statusConfig && (
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
          )}
          
          {children}
        </Stack>
      </Paper>
    </Fade>
  );
}
