'use client';

import React from 'react';
import {
  Paper,
  Box,
  Stack,
  Button,
  Fade,
  CircularProgress,
} from '@mui/material';

interface FormContainerProps {
  children: React.ReactNode;
  onSubmit?: () => void;
  onCancel?: () => void;
  submitText?: string;
  cancelText?: string;
  loading?: boolean;
  submitDisabled?: boolean;
}

export default function FormContainer({
  children,
  onSubmit,
  onCancel,
  submitText = 'Lưu thay đổi',
  cancelText = 'Hủy',
  loading = false,
  submitDisabled = false
}: FormContainerProps) {
  return (
    <Fade in={true} timeout={1200}>
      <Paper 
        elevation={0} 
        sx={{ 
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          overflow: 'hidden'
        }}
      >
        {children}
        
        {(onSubmit || onCancel) && (
          <Box sx={{ p: 4, bgcolor: 'rgba(0,0,0,0.02)' }}>
            <Stack direction="row" spacing={2} justifyContent="flex-end">
              {onCancel && (
                <Button
                  onClick={onCancel}
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600,
                    px: 3
                  }}
                >
                  {cancelText}
                </Button>
              )}
              {onSubmit && (
                <Button
                  variant="contained"
                  startIcon={loading ? <CircularProgress size={20} /> : undefined}
                  onClick={onSubmit}
                  disabled={loading || submitDisabled}
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600,
                    px: 3,
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-1px)',
                      boxShadow: 3
                    }
                  }}
                >
                  {loading ? 'Đang lưu...' : submitText}
                </Button>
              )}
            </Stack>
          </Box>
        )}
      </Paper>
    </Fade>
  );
}
