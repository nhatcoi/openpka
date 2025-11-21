'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar,
  CircularProgress,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useRouter, useParams } from 'next/navigation';
import { API_ROUTES } from '@/constants/routes';
import { WorkflowStatus } from '@/constants/workflow-statuses';
import { useConfirmDialog } from '@/components/dialogs/ConfirmDialogProvider';

interface CourseVersion {
  id: string;
  course_id: string;
  version: string;
  status: string;
  effective_from?: string;
  effective_to?: string;
  created_at: string;
  updated_at: string;
}

interface CourseDetail {
  id: string;
  code: string;
  name_vi: string;
}

export default function CourseVersionsPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.id as string;
  const confirmDialog = useConfirmDialog();

  const [courseDetail, setCourseDetail] = useState<CourseDetail | null>(null);
  const [versions, setVersions] = useState<CourseVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingVersion, setEditingVersion] = useState<CourseVersion | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const [formData, setFormData] = useState({
    version: '',
    status: WorkflowStatus.DRAFT as WorkflowStatus,
    effective_from: '',
    effective_to: '',
  });

  useEffect(() => {
    fetchCourseDetail();
    fetchVersions();
  }, [courseId]);

  const fetchCourseDetail = async () => {
    try {
      const response = await fetch(API_ROUTES.TMS.COURSES_BY_ID(courseId));
      const result = await response.json();
      if (result.success && result.data) {
        setCourseDetail({
          id: result.data.id.toString(),
          code: result.data.code,
          name_vi: result.data.name_vi,
        });
      }
    } catch (error) {
      console.error('Error fetching course:', error);
    }
  };

  const fetchVersions = async () => {
    try {
      setLoading(true);
      const response = await fetch(API_ROUTES.TMS.COURSES_VERSIONS(courseId));
      const result = await response.json();
      if (result.success && result.data?.versions) {
        setVersions(result.data.versions);
      }
    } catch (error) {
      console.error('Error fetching versions:', error);
      showSnackbar('Lỗi khi tải danh sách versions', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error' = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleOpenDialog = (version?: CourseVersion) => {
    if (version) {
      setEditingVersion(version);
      setFormData({
        version: version.version,
        status: version.status as WorkflowStatus,
        effective_from: version.effective_from ? version.effective_from.split('T')[0] : '',
        effective_to: version.effective_to ? version.effective_to.split('T')[0] : '',
      });
    } else {
      setEditingVersion(null);
      setFormData({
        version: '',
        status: WorkflowStatus.DRAFT,
        effective_from: '',
        effective_to: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingVersion(null);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const url = editingVersion
        ? API_ROUTES.TMS.COURSES_VERSION_BY_ID(courseId, editingVersion.id)
        : API_ROUTES.TMS.COURSES_VERSIONS(courseId);

      const method = editingVersion ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          version: formData.version || undefined,
          status: formData.status,
          effective_from: formData.effective_from || undefined,
          effective_to: formData.effective_to || undefined,
        }),
      });

      const result = await response.json();

      if (result.success) {
        showSnackbar(editingVersion ? 'Cập nhật version thành công' : 'Tạo version thành công');
        handleCloseDialog();
        fetchVersions();
      } else {
        showSnackbar(result.error || 'Có lỗi xảy ra', 'error');
      }
    } catch (error) {
      console.error('Error saving version:', error);
      showSnackbar('Lỗi khi lưu version', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (version: CourseVersion) => {
    const confirmed = await confirmDialog({
      title: 'Xóa version',
      message: `Bạn có chắc chắn muốn xóa version ${version.version}?`,
      confirmText: 'Xóa',
      cancelText: 'Hủy',
    });

    if (!confirmed) return;

    try {
      setSaving(true);
      const response = await fetch(API_ROUTES.TMS.COURSES_VERSION_BY_ID(courseId, version.id), {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        showSnackbar('Xóa version thành công');
        fetchVersions();
      } else {
        showSnackbar(result.error || 'Có lỗi xảy ra', 'error');
      }
    } catch (error) {
      console.error('Error deleting version:', error);
      showSnackbar('Lỗi khi xóa version', 'error');
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case WorkflowStatus.APPROVED:
        return 'success';
      case WorkflowStatus.DRAFT:
        return 'default';
      case WorkflowStatus.REVIEWING:
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => router.push(`/tms/courses/${courseId}`)}>
          Quay lại
        </Button>
      </Box>

      <Paper sx={{ p: 3 }}>
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h5" gutterBottom>
              Quản lý Versions
            </Typography>
            {courseDetail && (
              <Typography variant="body2" color="text.secondary">
                {courseDetail.code} - {courseDetail.name_vi}
              </Typography>
            )}
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            disabled={saving}
          >
            Tạo Version
          </Button>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Version</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Effective From</TableCell>
                  <TableCell>Effective To</TableCell>
                  <TableCell>Created At</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {versions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography color="text.secondary">Chưa có version nào</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  versions.map((version) => (
                    <TableRow key={version.id}>
                      <TableCell>{version.version}</TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          sx={{
                            color: getStatusColor(version.status) === 'success' ? 'success.main' : 'text.secondary',
                          }}
                        >
                          {version.status}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {version.effective_from
                          ? new Date(version.effective_from).toLocaleDateString('vi-VN')
                          : '-'}
                      </TableCell>
                      <TableCell>
                        {version.effective_to
                          ? new Date(version.effective_to).toLocaleDateString('vi-VN')
                          : '-'}
                      </TableCell>
                      <TableCell>
                        {new Date(version.created_at).toLocaleDateString('vi-VN')}
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog(version)}
                          disabled={saving}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(version)}
                          disabled={saving}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Create/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingVersion ? 'Chỉnh sửa Version' : 'Tạo Version Mới'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <TextField
              label="Version Number"
              value={formData.version}
              onChange={(e) => setFormData({ ...formData, version: e.target.value })}
              placeholder="Để trống để tự động tăng"
              helperText="Để trống để tự động tăng version number"
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as WorkflowStatus })}
                label="Status"
              >
                <MenuItem value={WorkflowStatus.DRAFT}>DRAFT</MenuItem>
                <MenuItem value={WorkflowStatus.REVIEWING}>REVIEWING</MenuItem>
                <MenuItem value={WorkflowStatus.APPROVED}>APPROVED</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Effective From"
              type="date"
              value={formData.effective_from}
              onChange={(e) => setFormData({ ...formData, effective_from: e.target.value })}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <TextField
              label="Effective To"
              type="date"
              value={formData.effective_to}
              onChange={(e) => setFormData({ ...formData, effective_to: e.target.value })}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={saving}>
            Hủy
          </Button>
          <Button onClick={handleSave} variant="contained" disabled={saving}>
            {saving ? <CircularProgress size={20} /> : editingVersion ? 'Cập nhật' : 'Tạo'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}

