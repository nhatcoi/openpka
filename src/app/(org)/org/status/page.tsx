'use client';

import React, { useState, useEffect } from 'react';
import { API_ROUTES } from '@/constants/routes';
import { buildUrl } from '@/lib/api/api-handler';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Stack,
  Alert,
  CircularProgress,
  Chip,
  Breadcrumbs,
  Link as MuiLink,
  Switch,
  FormControlLabel,
  InputAdornment,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Close as CloseIcon,
} from '@mui/icons-material';

interface OrgUnitStatus {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  color: string;
  is_active: boolean;
  workflow_step: number;
  created_at: string;
  updated_at: string;
}

export default function OrgStatusPage() {
  const [statuses, setStatuses] = useState<OrgUnitStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingStatus, setEditingStatus] = useState<OrgUnitStatus | null>(null);
  const [deleteStatus, setDeleteStatus] = useState<OrgUnitStatus | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    color: '#757575',
    workflow_step: 0,
    is_active: true,
  });

  useEffect(() => {
    fetchStatuses();
  }, []);

  const fetchStatuses = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(buildUrl(API_ROUTES.ORG.STATUSES, { include_inactive: true }));
      const result = await response.json();

      if (result.success) {
        setStatuses(result.data || []);
      } else {
        setError(result.error || 'Failed to fetch statuses');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch statuses');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDialog = (status?: OrgUnitStatus) => {
    if (status) {
      setEditingStatus(status);
      setFormData({
        code: status.code,
        name: status.name,
        description: status.description || '',
        color: status.color,
        workflow_step: status.workflow_step,
        is_active: status.is_active,
      });
    } else {
      setEditingStatus(null);
      setFormData({
        code: '',
        name: '',
        description: '',
        color: '#757575',
        workflow_step: 0,
        is_active: true,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingStatus(null);
    setFormData({
      code: '',
      name: '',
      description: '',
      color: '#757575',
      workflow_step: 0,
      is_active: true,
    });
  };

  const handleSave = async () => {
    if (!formData.code || !formData.name) {
      setError('Mã và tên trạng thái đơn vị là bắt buộc');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);

      const url = editingStatus
        ? API_ROUTES.ORG.STATUSES_BY_ID(editingStatus.id)
        : API_ROUTES.ORG.STATUSES;

      const method = editingStatus ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        setSuccess(editingStatus ? 'Chỉnh sửa thành công!' : 'Thêm trạng thái đơn vị thành công!');
        handleCloseDialog();
        await fetchStatuses();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(result.error || 'Thao tác không thành công');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Thao tác không thành công, vui lòng thử lại sau.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClick = (status: OrgUnitStatus) => {
    setDeleteStatus(status);
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setDeleteStatus(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteStatus) return;

    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);

      const response = await fetch(API_ROUTES.ORG.STATUSES_BY_ID(deleteStatus.id), {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        setSuccess('Xóa trạng thái đơn vị thành công!');
        handleCloseDeleteDialog();
        await fetchStatuses();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(result.error || 'Xóa không thành công');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Thao tác không thành công, vui lòng thử lại sau.');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredStatuses = statuses.filter(status =>
    status.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    status.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (status.description && status.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <Box sx={{ py: 4, px: 3, width: '100%' }}>
      <Breadcrumbs sx={{ mb: 3 }}>
        <MuiLink
          component="button"
          variant="body1"
          onClick={() => window.history.back()}
          sx={{ textDecoration: 'none' }}
        >
          Tổ chức
        </MuiLink>
        <Typography color="text.primary">Quản lý trạng thái đơn vị</Typography>
      </Breadcrumbs>

      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 1 }}>
            Quản lý trạng thái đơn vị
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Thêm, chỉnh sửa hoặc xóa các trạng thái đơn vị trong hệ thống (Nháp, Đang xem xét, Đã phê duyệt...)
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={fetchStatuses}
          disabled={isLoading}
        >
          Làm mới
        </Button>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
            <TextField
              size="small"
              placeholder="Tìm kiếm theo tên, mã hoặc mô tả..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
              sx={{ width: 400 }}
            />
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
            >
              Thêm trạng thái
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          {isLoading && statuses.length === 0 ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : filteredStatuses.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <CheckCircleIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                {searchTerm ? 'Không tìm thấy kết quả' : 'Chưa có trạng thái đơn vị nào'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {searchTerm ? 'Thử tìm kiếm với từ khóa khác' : 'Bắt đầu bằng cách thêm trạng thái đơn vị mới'}
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Mã</TableCell>
                    <TableCell>Tên</TableCell>
                    <TableCell>Mô tả</TableCell>
                    <TableCell>Bước workflow</TableCell>
                    <TableCell>Trạng thái</TableCell>
                    <TableCell align="right">Thao tác</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredStatuses.map((status) => (
                    <TableRow key={status.id} hover>
                      <TableCell>
                        <Chip
                          label={status.code}
                          size="small"
                          variant="outlined"
                          sx={{
                            bgcolor: status.is_active ? `${status.color}15` : 'transparent',
                            borderColor: status.color,
                            color: status.color,
                            fontWeight: 'medium',
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {status.name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {status.description || '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {status.workflow_step}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={status.is_active ? 'Hoạt động' : 'Tạm dừng'}
                          size="small"
                          color={status.is_active ? 'success' : 'default'}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Tooltip title="Chỉnh sửa">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenDialog(status)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Xóa">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDeleteClick(status)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6">
              {editingStatus ? 'Chỉnh sửa trạng thái đơn vị' : 'Thêm trạng thái đơn vị mới'}
            </Typography>
            <IconButton onClick={handleCloseDialog} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              label="Mã trạng thái"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              fullWidth
              required
              disabled={!!editingStatus}
              helperText="Mã trạng thái (ví dụ: DRAFT, APPROVED, ACTIVE)"
            />
            <TextField
              label="Tên trạng thái"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
              required
              helperText="Tên trạng thái (ví dụ: Nháp, Đã phê duyệt, Đang hoạt động)"
            />
            <TextField
              label="Mô tả"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              fullWidth
              multiline
              rows={3}
              helperText="Mô tả về trạng thái đơn vị (tùy chọn)"
            />
            <TextField
              label="Màu sắc"
              type="color"
              value={formData.color}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              fullWidth
              InputProps={{ style: { height: '56px' } }}
              helperText="Màu sắc để hiển thị trạng thái đơn vị"
            />
            <TextField
              label="Bước workflow"
              type="number"
              value={formData.workflow_step}
              onChange={(e) => setFormData({ ...formData, workflow_step: parseInt(e.target.value) || 0 })}
              fullWidth
              helperText="Thứ tự trong quy trình workflow (số nhỏ hơn sẽ thực hiện trước)"
            />
            {editingStatus && (
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  />
                }
                label="Trạng thái hoạt động"
              />
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Hủy</Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={isLoading || !formData.code || !formData.name}
          >
            {isLoading ? 'Đang lưu...' : editingStatus ? 'Lưu thay đổi' : 'Thêm mới'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Xác nhận xóa</DialogTitle>
        <DialogContent>
          <Typography>
            Bạn có chắc chắn muốn xóa trạng thái đơn vị <strong>{deleteStatus?.name}</strong> ({deleteStatus?.code}) không?
          </Typography>
          <Alert severity="warning" sx={{ mt: 2 }}>
            Không thể xóa trạng thái đơn vị đang được sử dụng bởi các đơn vị trong hệ thống.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Hủy</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmDelete}
            disabled={isLoading}
          >
            {isLoading ? 'Đang xóa...' : 'Xóa'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

