'use client';

import React from 'react';
import {
  Box,
  Typography,
  Avatar,
  Stack,
  Paper,
  Divider,
} from '@mui/material';

interface FormSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  bgColor?: string;
  iconColor?: 'primary' | 'secondary' | 'info' | 'success' | 'warning' | 'error';
  showDivider?: boolean;
}

export default function FormSection({
  title,
  icon,
  children,
  bgColor = 'primary.light',
  iconColor = 'primary',
  showDivider = true
}: FormSectionProps) {
  return (
    <>
      <Box sx={{ p: 4 }}>
        <Stack direction="row" alignItems="center" spacing={2} mb={3}>
          <Avatar sx={{ bgcolor: bgColor, width: 40, height: 40 }}>
            {icon}
          </Avatar>
          <Typography variant="h5" fontWeight="bold" color="text.primary">
            {title}
          </Typography>
        </Stack>
        
        <Stack 
          spacing={3}
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)'
            },
            gap: 3
          }}
        >
          {children}
        </Stack>
      </Box>
      {showDivider && <Divider />}
    </>
  );
}
