'use client';

import { Container, Typography, Box, Alert, Button, Stack } from '@mui/material';
import { 
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  AdminPanelSettings as AdminIcon
} from '@mui/icons-material';
import { useSession } from 'next-auth/react';
import { usePermissions } from '@/lib/auth/permission-utils';
import { UserPermissionInfo } from '@/components/auth/UserPermissionInfo';

export default function PermissionsPage() {
  const { data: session, status } = useSession();
  const { hasPermission } = usePermissions();

  if (status === 'loading') {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography>Đang tải...</Typography>
      </Container>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="warning">
          Bạn cần đăng nhập để xem trang này
        </Alert>
      </Container>
    );
  }

  // Check permissions directly
  const isAdmin = hasPermission('admin');
  const canViewUnits = hasPermission('org_unit.unit.view');
  const canCreateUnits = hasPermission('org_unit.unit.create');
  const canUpdateUnits = hasPermission('org_unit.unit.update');
  const canDeleteUnits = hasPermission('org_unit.unit.delete');
  const canAdminUnits = hasPermission('org_unit.admin') || hasPermission('org_unit.type.admin');
  const canCreate = hasPermission('org_unit.create');
  const canUpdate = hasPermission('org_unit.update');
  const canDelete = hasPermission('org_unit.delete');

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Demo Hệ thống Quyền
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Trang này demo cách hệ thống quyền hoạt động dựa trên NextAuth session.
        </Typography>
      </Box>

      {/* User Permission Info */}
      <Box sx={{ mb: 4 }}>
        <UserPermissionInfo />
      </Box>

      {/* Permission Examples */}
      <Stack spacing={3}>
        {/* Admin Only */}
        <Box>
          <Typography variant="h6" gutterBottom>
            Chỉ Admin mới thấy
          </Typography>
          {isAdmin ? (
            <Button variant="contained" startIcon={<AdminIcon />}>
              Cài đặt hệ thống
            </Button>
          ) : (
            <Alert severity="info">
              Bạn cần quyền admin để thấy nội dung này
            </Alert>
          )}
        </Box>

        {/* Org Unit Read Only */}
        <Box>
          <Typography variant="h6" gutterBottom>
            Chỉ người có quyền xem đơn vị
          </Typography>
          {canViewUnits ? (
            <Stack direction="row" spacing={2}>
              <Button variant="outlined" startIcon={<ViewIcon />}>
                Xem danh sách đơn vị
              </Button>
              <Button variant="outlined" startIcon={<ViewIcon />}>
                Xem sơ đồ tổ chức
              </Button>
            </Stack>
          ) : (
            <Alert severity="warning">
              Bạn cần quyền xem đơn vị để thấy các nút này
            </Alert>
          )}
        </Box>

        {/* Org Unit Admin Only */}
        <Box>
          <Typography variant="h6" gutterBottom>
            Chỉ người có quyền quản trị đơn vị
          </Typography>
          {canAdminUnits ? (
            <Stack direction="row" spacing={2}>
              <Button variant="contained" startIcon={<AddIcon />}>
                Tạo đơn vị mới
              </Button>
              <Button variant="outlined" startIcon={<EditIcon />}>
                Sửa đơn vị
              </Button>
              <Button variant="outlined" color="error" startIcon={<DeleteIcon />}>
                Xóa đơn vị
              </Button>
            </Stack>
          ) : (
            <Alert severity="warning">
              Bạn cần quyền quản trị đơn vị để thấy các nút này
            </Alert>
          )}
        </Box>

        {/* Custom Permission Check */}
        <Box>
          <Typography variant="h6" gutterBottom>
            Kiểm tra quyền tùy chỉnh
          </Typography>
          <Stack direction="row" spacing={2} flexWrap="wrap">
            {canCreate && (
              <Button variant="contained" startIcon={<AddIcon />}>
                Tạo đơn vị (org_unit.create)
              </Button>
            )}
            {canUpdate && (
              <Button variant="outlined" startIcon={<EditIcon />}>
                Sửa đơn vị (org_unit.update)
              </Button>
            )}
            {canDelete && (
              <Button variant="outlined" color="error" startIcon={<DeleteIcon />}>
                Xóa đơn vị (org_unit.delete)
              </Button>
            )}
          </Stack>
          {canCreate && canUpdate && canDelete ? (
            <Button variant="contained" color="secondary" sx={{ mt: 2 }}>
              Quản lý đầy đủ đơn vị
            </Button>
          ) : (
            <Alert severity="info" sx={{ mt: 2 }}>
              Bạn cần đầy đủ quyền tạo, sửa, xóa đơn vị để thấy nút "Quản lý đầy đủ"
            </Alert>
          )}
        </Box>

        {/* Current Permission Status */}
        <Box>
          <Typography variant="h6" gutterBottom>
            Trạng thái quyền hiện tại
          </Typography>
          <Stack spacing={1}>
            <Typography variant="body2">
              • Xem đơn vị (org_unit.unit.view): {canViewUnits ? '✅' : '❌'}
            </Typography>
            <Typography variant="body2">
              • Tạo đơn vị (org_unit.unit.create): {canCreateUnits ? '✅' : '❌'}
            </Typography>
            <Typography variant="body2">
              • Sửa đơn vị (org_unit.unit.update): {canUpdateUnits ? '✅' : '❌'}
            </Typography>
            <Typography variant="body2">
              • Xóa đơn vị (org_unit.unit.delete): {canDeleteUnits ? '✅' : '❌'}
            </Typography>
            <Typography variant="body2">
              • Quản trị đơn vị (org_unit.admin): {canAdminUnits ? '✅' : '❌'}
            </Typography>
            <Typography variant="body2">
              • Admin: {isAdmin ? '✅' : '❌'}
            </Typography>
          </Stack>
        </Box>
      </Stack>
    </Container>
  );
}
