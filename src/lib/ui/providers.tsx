'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { useState } from 'react';
import { SessionProvider } from 'next-auth/react';
import { lightTheme } from './mui-theme';
import { ConfirmDialogProvider } from '@/components/dialogs/ConfirmDialogProvider';

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={lightTheme}>
          <CssBaseline />
          <ConfirmDialogProvider>
            {children}
          </ConfirmDialogProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
}
