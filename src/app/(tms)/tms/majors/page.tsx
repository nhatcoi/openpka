'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import MajorCard from '@/components/MajorCard';
import {
  Box,
  Container,
  Typography,
  Paper,
  Stack,
  Button,
  Pagination,
  Skeleton,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Add as AddIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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
  Major?: {
    id: number;
    code: string;
    name_vi: string;
    name_en?: string;
    degree_level: string;
  };
  other_majors?: Array<{
    id: number;
    code: string;
    name_vi: string;
    name_en?: string;
    degree_level: string;
  }>;
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
  created_at?: string;
}

export default function MajorsPage() {
  const router = useRouter();
  const [majors, setMajors] = useState<Major[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const loadingDelayRef = useRef<NodeJS.Timeout | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; major: Major | null }>({
    open: false,
    major: null
  });


  // Fetch majors data
  const fetchMajors = useCallback(async () => {
    try {
      // Cancel in-flight fetch
      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      // Defer setting loading to avoid flicker on fast typings
      if (loadingDelayRef.current) clearTimeout(loadingDelayRef.current);
      loadingDelayRef.current = setTimeout(() => setLoading(true), 120);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
      });

      const response = await fetch(`/api/tms/majors?${params}`, { signal: controller.signal });
      const data = await response.json();

      if (data.success) {
        setMajors(data.data?.data || []);
        setTotalPages(data.data?.pagination?.pages || 1);
      } else {
        setError(data.error || 'Failed to fetch majors');
      }
    } catch (err: any) {
      if (err?.name !== 'AbortError') setError('Failed to fetch majors');
    } finally {
      if (loadingDelayRef.current) {
        clearTimeout(loadingDelayRef.current);
        loadingDelayRef.current = null;
      }
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchMajors();
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, [fetchMajors]);


  // Handle delete
  const handleDelete = async (major: Major) => {
    try {
      const response = await fetch(`/api/tms/majors/${major.id}`, {
        method: 'DELETE',
      });
      const data = await response.json();

      if (data.success) {
        fetchMajors();
        setDeleteDialog({ open: false, major: null });
      } else {
        setError(data.error || 'Failed to delete major');
      }
    } catch (err) {
      setError('Failed to delete major');
    }
  };


  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Stack spacing={3}>
          <Skeleton variant="rectangular" height={200} />
          <Skeleton variant="rectangular" height={200} />
          <Skeleton variant="rectangular" height={200} />
        </Stack>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Stack spacing={3}>
        {/* Header */}
        <Box>
          <Typography variant="h4" gutterBottom>
            Quản lý Ngành học
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Quản lý thông tin các ngành học trong hệ thống
          </Typography>
        </Box>

        {/* Add Button */}
        <Paper sx={{ p: 3 }}>
          <Stack direction="row" justifyContent="flex-end">
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => router.push('/tms/majors/create')}
            >
              Thêm ngành
            </Button>
          </Stack>
        </Paper>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Majors List */}
        <Stack spacing={3}>
          {(majors || []).map((major) => (
            <MajorCard
              key={major.id}
              major={major}
              onDelete={(major) => setDeleteDialog({ open: true, major })}
            />
          ))}
        </Stack>

        {/* Pagination */}
        {totalPages > 1 && (
          <Box display="flex" justifyContent="center">
            <Pagination
              count={totalPages}
              page={page}
              onChange={(_, value) => setPage(value)}
              color="primary"
            />
          </Box>
        )}

        {/* Delete Dialog */}
        <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, major: null })}>
          <DialogTitle>Xác nhận xóa</DialogTitle>
          <DialogContent>
            <Typography>
              Bạn có chắc chắn muốn xóa ngành học "{deleteDialog.major?.name_vi}"?
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialog({ open: false, major: null })}>
              Hủy
            </Button>
            <Button
              color="error"
              onClick={() => deleteDialog.major && handleDelete(deleteDialog.major)}
            >
              Xóa
            </Button>
          </DialogActions>
        </Dialog>
      </Stack>
    </Container>
  );
}