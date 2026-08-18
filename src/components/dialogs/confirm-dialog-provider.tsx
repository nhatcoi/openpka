'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from '@mui/material';

interface ConfirmDialogOptions {
  title?: string;
  message: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
}

type ConfirmDialogFn = (options: ConfirmDialogOptions) => Promise<boolean>;

interface ConfirmDialogContextValue {
  confirm: ConfirmDialogFn;
}

const ConfirmDialogContext = createContext<ConfirmDialogContextValue | null>(null);

interface DialogState extends ConfirmDialogOptions {
  open: boolean;
  resolve?: (value: boolean) => void;
}

const defaultState: DialogState = {
  open: false,
  title: 'Xác nhận',
  message: '',
  confirmText: 'Đồng ý',
  cancelText: 'Hủy',
  destructive: false,
};

export function ConfirmDialogProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<DialogState>(defaultState);

  const handleClose = useCallback((result: boolean) => {
    setState(prev => {
      prev.resolve?.(result);
      return { ...defaultState, open: false };
    });
  }, []);

  const confirm = useCallback<ConfirmDialogFn>((options) => {
    return new Promise<boolean>((resolve) => {
      setState({
        ...defaultState,
        ...options,
        open: true,
        resolve,
      });
    });
  }, []);

  const value = useMemo(() => ({ confirm }), [confirm]);

  return (
    <ConfirmDialogContext.Provider value={value}>
      {children}
      <Dialog
        open={state.open}
        onClose={() => handleClose(false)}
        maxWidth="xs"
        fullWidth
      >
        {state.title && <DialogTitle>{state.title}</DialogTitle>}
        <DialogContent>
          {typeof state.message === 'string' ? (
            <Typography>{state.message}</Typography>
          ) : (
            state.message
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => handleClose(false)}>
            {state.cancelText || 'Hủy'}
          </Button>
          <Button
            onClick={() => handleClose(true)}
            color={state.destructive ? 'error' : 'primary'}
            variant="contained"
          >
            {state.confirmText || 'Đồng ý'}
          </Button>
        </DialogActions>
      </Dialog>
    </ConfirmDialogContext.Provider>
  );
}

export function useConfirmDialog(): ConfirmDialogFn {
  const context = useContext(ConfirmDialogContext);
  if (!context) {
    throw new Error('useConfirmDialog must be used within ConfirmDialogProvider');
  }
  return context.confirm;
}

