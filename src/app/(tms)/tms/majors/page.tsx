'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import MajorCard from '@/components/cards/MajorCard';
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
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Add as AddIcon,
  HelpOutline as HelpOutlineIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
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
  const [helpDialogOpen, setHelpDialogOpen] = useState(false);


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
        setMajors(data.data?.items || []);
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
        <Paper 
          sx={{ 
            p: 4, 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
                Quản lý Ngành học
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9 }}>
                Quản lý thông tin các ngành học trong hệ thống
              </Typography>
            </Box>
            <Button
              variant="outlined"
              startIcon={<HelpOutlineIcon />}
              onClick={() => setHelpDialogOpen(true)}
              color="inherit"
              sx={{ color: '#fff', borderColor: 'rgba(255,255,255,0.7)' }}
            >
              Hướng dẫn
            </Button>
          </Stack>
        </Paper>

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

        {/* Help Dialog */}
        <Dialog open={helpDialogOpen} onClose={() => setHelpDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white', display: 'flex', alignItems: 'center', gap: 1 }}>
            <InfoIcon />
            Hướng dẫn quản lý Ngành học
          </DialogTitle>
          <DialogContent dividers sx={{ pt: 3 }}>
            <Stack spacing={3}>
              <Box>
                <Typography variant="h6" gutterBottom color="primary" sx={{ fontWeight: 'bold' }}>
                  1. Tạo Ngành học mới
                </Typography>
                <Typography variant="body1" paragraph>
                  Khoa hoặc phòng ban được ủy quyền có thể tạo ngành học mới bằng cách nhập các thông tin cơ bản như mã ngành, tên tiếng Việt, tên tiếng Anh, bậc đào tạo, và các thông tin liên quan khác.
                </Typography>
                <Alert severity="info" sx={{ mt: 1 }}>
                  <strong>Lưu ý:</strong> Mã ngành phải là duy nhất trong đơn vị tổ chức. Khuyến khích sử dụng mã ngành theo tiêu chuẩn của Bộ Giáo dục.
                </Alert>
              </Box>

              <Box>
                <Typography variant="h6" gutterBottom color="primary" sx={{ fontWeight: 'bold' }}>
                  2. Quản lý thông tin Ngành học
                </Typography>
                <Typography variant="body1" paragraph>
                  Mỗi ngành học có thể bao gồm nhiều thông tin quan trọng:
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircleIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Chương trình đào tạo (CTĐT)" 
                      secondary="Các chương trình đào tạo thuộc ngành, bao gồm các phiên bản khác nhau"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircleIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Chuẩn đầu ra (CĐR)" 
                      secondary="Các chuẩn đầu ra của ngành học theo từng phiên bản"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircleIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Chỉ tiêu tuyển sinh" 
                      secondary="Chỉ tiêu tuyển sinh theo từng năm học"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircleIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Học phí" 
                      secondary="Mức học phí theo năm và nhóm học phí"
                    />
                  </ListItem>
                </List>
              </Box>

              <Box>
                <Typography variant="h6" gutterBottom color="primary" sx={{ fontWeight: 'bold' }}>
                  3. Trạng thái Ngành học
                </Typography>
                <Typography variant="body1" paragraph>
                  Ngành học có các trạng thái khác nhau trong vòng đời:
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemIcon>
                      <InfoIcon sx={{ color: 'grey.500' }} />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Draft (Bản nháp)" 
                      secondary="Ngành học đang được soạn thảo, chưa đưa vào sử dụng"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <InfoIcon sx={{ color: 'warning.main' }} />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Proposed (Đề xuất)" 
                      secondary="Ngành học đã được đề xuất, đang chờ phê duyệt"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircleIcon color="success" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Active (Đang hoạt động)" 
                      secondary="Ngành học đang được sử dụng để đào tạo"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <InfoIcon sx={{ color: 'error.main' }} />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Suspended/Closed (Tạm ngưng/Đóng)" 
                      secondary="Ngành học tạm ngưng hoặc không còn đào tạo"
                    />
                  </ListItem>
                </List>
              </Box>

              <Box>
                <Typography variant="h6" gutterBottom color="primary" sx={{ fontWeight: 'bold' }}>
                  4. Liên kết với Chương trình đào tạo
                </Typography>
                <Typography variant="body1" paragraph>
                  Sau khi tạo ngành học, bạn có thể tạo các chương trình đào tạo cho ngành. Mỗi ngành có thể có nhiều phiên bản CTĐT khác nhau phục vụ cho các khóa học khác nhau.
                </Typography>
                <Alert severity="success" sx={{ mt: 1 }}>
                  <strong>Mẹo:</strong> Nên hoàn thiện đầy đủ thông tin ngành học trước khi tạo chương trình đào tạo.
                </Alert>
              </Box>

              <Box sx={{ bgcolor: 'grey.100', p: 2, borderRadius: 1, mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
                  Quy trình tổng quan:
                </Typography>
                <Typography variant="body2" component="div">
                  Tạo Ngành học → Cập nhật thông tin cơ bản → Tạo CTĐT → Quản lý CĐR, chỉ tiêu, học phí → Theo dõi & cập nhật
                </Typography>
              </Box>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={() => setHelpDialogOpen(false)} variant="contained">
              Đã hiểu
            </Button>
          </DialogActions>
        </Dialog>
      </Stack>
    </Container>
  );
}