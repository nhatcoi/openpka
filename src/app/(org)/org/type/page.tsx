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
  Business as BusinessIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Close as CloseIcon,
} from '@mui/icons-material';

interface OrgUnitType {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  color: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export default function OrgTypePage() {
  const [types, setTypes] = useState<OrgUnitType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState<OrgUnitType | null>(null);
  const [deleteType, setDeleteType] = useState<OrgUnitType | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    color: '#1976d2',
    sort_order: 0,
    is_active: true,
  });

  useEffect(() => {
    fetchTypes();
  }, []);

  const fetchTypes = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(buildUrl(API_ROUTES.ORG.TYPES, { include_inactive: true }));
      const result = await response.json();

      if (result.success) {
        setTypes(result.data || []);
      } else {
        setError(result.error || 'Failed to fetch types');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch types');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDialog = (type?: OrgUnitType) => {
    if (type) {
      setEditingType(type);
      setFormData({
        code: type.code,
        name: type.name,
        description: type.description || '',
        color: type.color,
        sort_order: type.sort_order,
        is_active: type.is_active,
      });
    } else {
      setEditingType(null);
      setFormData({
        code: '',
        name: '',
        description: '',
        color: '#1976d2',
        sort_order: 0,
        is_active: true,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingType(null);
    setFormData({
      code: '',
      name: '',
      description: '',
      color: '#1976d2',
      sort_order: 0,
      is_active: true,
    });
  };

  const handleSave = async () => {
    if (!formData.code || !formData.name) {
      setError('Mã và tên loại đơn vị là bắt buộc');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);

      const url = editingType
        ? API_ROUTES.ORG.TYPES + `/${editingType.id}`
        : API_ROUTES.ORG.TYPES;

      const method = editingType ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        setSuccess(editingType ? 'Chỉnh sửa thành công!' : 'Thêm loại đơn vị thành công!');
        handleCloseDialog();
        await fetchTypes();
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

  const handleDeleteClick = (type: OrgUnitType) => {
    setDeleteType(type);
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setDeleteType(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteType) return;

    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);

      const response = await fetch(API_ROUTES.ORG.TYPES + `/${deleteType.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        setSuccess('Xóa loại đơn vị thành công!');
        handleCloseDeleteDialog();
        await fetchTypes();
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

  const filteredTypes = types.filter(type =>
    type.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    type.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (type.description && type.description.toLowerCase().includes(searchTerm.toLowerCase()))
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
        <Typography color="text.primary">Quản lý loại đơn vị</Typography>
      </Breadcrumbs>

      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 1 }}>
            Quản lý loại đơn vị
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Thêm, chỉnh sửa hoặc xóa các loại đơn vị trong hệ thống (Khoa, Phòng, Bộ môn, Viện...)
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={fetchTypes}
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
              Thêm loại đơn vị
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          {isLoading && types.length === 0 ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : filteredTypes.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <BusinessIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                {searchTerm ? 'Không tìm thấy kết quả' : 'Chưa có loại đơn vị nào'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {searchTerm ? 'Thử tìm kiếm với từ khóa khác' : 'Bắt đầu bằng cách thêm loại đơn vị mới'}
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
                    <TableCell>Thứ tự</TableCell>
                    <TableCell>Trạng thái</TableCell>
                    <TableCell align="right">Thao tác</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredTypes.map((type) => (
                    <TableRow key={type.id} hover>
                      <TableCell>
                        <Chip
                          label={type.code}
                          size="small"
                          variant="outlined"
                          sx={{
                            bgcolor: type.is_active ? `${type.color}15` : 'transparent',
                            borderColor: type.color,
                            color: type.color,
                            fontWeight: 'medium',
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {type.name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {type.description || '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {type.sort_order}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={type.is_active ? 'Hoạt động' : 'Tạm dừng'}
                          size="small"
                          color={type.is_active ? 'success' : 'default'}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Tooltip title="Chỉnh sửa">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenDialog(type)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Xóa">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDeleteClick(type)}
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
              {editingType ? 'Chỉnh sửa loại đơn vị' : 'Thêm loại đơn vị mới'}
            </Typography>
            <IconButton onClick={handleCloseDialog} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              label="Mã loại đơn vị"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              fullWidth
              required
              disabled={!!editingType}
              helperText="Mã loại đơn vị (ví dụ: FACULTY, DEPARTMENT)"
            />
            <TextField
              label="Tên loại đơn vị"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
              required
              helperText="Tên loại đơn vị (ví dụ: Khoa, Phòng, Bộ môn)"
            />
            <TextField
              label="Mô tả"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              fullWidth
              multiline
              rows={3}
              helperText="Mô tả về loại đơn vị (tùy chọn)"
            />
            <TextField
              label="Màu sắc"
              type="color"
              value={formData.color}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              fullWidth
              InputProps={{ style: { height: '56px' } }}
              helperText="Màu sắc để hiển thị loại đơn vị"
            />
            <TextField
              label="Thứ tự sắp xếp"
              type="number"
              value={formData.sort_order}
              onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
              fullWidth
              helperText="Thứ tự hiển thị (số nhỏ hơn sẽ hiển thị trước)"
            />
            {editingType && (
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
            {isLoading ? 'Đang lưu...' : editingType ? 'Lưu thay đổi' : 'Thêm mới'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Xác nhận xóa</DialogTitle>
        <DialogContent>
          <Typography>
            Bạn có chắc chắn muốn xóa loại đơn vị <strong>{deleteType?.name}</strong> ({deleteType?.code}) không?
          </Typography>
          <Alert severity="warning" sx={{ mt: 2 }}>
            Không thể xóa loại đơn vị đang được sử dụng bởi các đơn vị trong hệ thống.
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

