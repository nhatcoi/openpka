'use client';

import React from 'react';
import {
  Paper,
  Stack,
  Typography,
  Avatar,
  Chip,
  Box,
  Fade,
} from '@mui/material';

interface ProgressIndicatorProps {
  title: string;
  description?: string;
  icon: React.ReactNode;
  status?: string;
  statusColor?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  statusVariant?: 'filled' | 'outlined';
}

export default function ProgressIndicator({
  title,
  description,
  icon,
  status,
  statusColor = 'primary',
  statusVariant = 'outlined'
}: ProgressIndicatorProps) {
  return (
    <Fade in={true} timeout={1000}>
      <Paper 
        elevation={0} 
        sx={{ 
          p: 3, 
          mb: 4, 
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          background: 'linear-gradient(90deg, rgba(25, 118, 210, 0.1) 0%, rgba(255,255,255,0.8) 100%)'
        }}
      >
        <Stack direction="row" alignItems="center" spacing={3}>
          <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}>
            {icon}
          </Avatar>
          
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" fontWeight="bold" color="text.primary">
              {title}
            </Typography>
            {description && (
              <Typography variant="body2" color="text.secondary">
                {description}
              </Typography>
            )}
          </Box>
          
          {status && (
            <Chip 
              label={status}
              color={statusColor}
              variant={statusVariant}
              sx={{ fontWeight: 600 }}
            />
          )}
        </Stack>
      </Paper>
    </Fade>
  );
}
