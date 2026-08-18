'use client';

import React, { ReactNode } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Stack,
} from '@mui/material';

export interface FeaturePlaceholderProps {
  title: string;
  description: string;
  features: string[];
  icon: ReactNode;
  gradient?: string;
}

export function FeaturePlaceholder({
  title,
  description,
  features,
  icon,
  gradient = 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
}: FeaturePlaceholderProps) {
  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default', py: 4 }}>
      <Container maxWidth="lg">
        <Paper
          elevation={0}
          sx={{
            p: 4,
            background: gradient,
            color: 'white',
            borderRadius: 2,
            mb: 4,
          }}
        >
          <Stack spacing={2} alignItems="center" textAlign="center">
            {icon}
            <Typography variant="h3" component="h1" sx={{ fontWeight: 'bold' }}>
              {title}
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9 }}>
              {description}
            </Typography>
          </Stack>
        </Paper>

        <Paper sx={{ p: 4 }}>
          <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold' }}>
            Tính năng sắp có:
          </Typography>
          <Stack spacing={2}>
            {features.map((feature, index) => (
              <Typography key={index}>• {feature}</Typography>
            ))}
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}

export default FeaturePlaceholder;
