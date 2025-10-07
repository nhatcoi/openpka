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
import { PermissionGuard, AdminOnly, OrgUnitViewOnly, OrgUnitAdminOnly } from '@/components/auth/PermissionGuard';
import { usePermissions } from '@/lib/auth/permission-utils';
import { UserPermissionInfo } from '@/components/auth/UserPermissionInfo';

export default function PermissionsPage() {
  const { data: session, status } = useSession();
  const { 
    canReadOrgUnits, 
    canCreateOrgUnits, 
    canUpdateOrgUnits, 
    canDeleteOrgUnits, 
    canAdminOrgUnits,
    isAdmin 
  } = usePermissions();

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
          <AdminOnly 
            fallback={
              <Alert severity="info">
                Bạn cần quyền admin để thấy nội dung này
              </Alert>
            }
          >
            <Button variant="contained" startIcon={<AdminIcon />}>
              Cài đặt hệ thống
            </Button>
          </AdminOnly>
        </Box>

        {/* Org Unit Read Only */}
        <Box>
          <Typography variant="h6" gutterBottom>
            Chỉ người có quyền xem đơn vị
          </Typography>
          <OrgUnitViewOnly 
            fallback={
              <Alert severity="warning">
                Bạn cần quyền xem đơn vị để thấy các nút này
              </Alert>
            }
          >
            <Stack direction="row" spacing={2}>
              <Button variant="outlined" startIcon={<ViewIcon />}>
                Xem danh sách đơn vị
              </Button>
              <Button variant="outlined" startIcon={<ViewIcon />}>
                Xem sơ đồ tổ chức
              </Button>
            </Stack>
          </OrgUnitViewOnly>
        </Box>

        {/* Org Unit Admin Only */}
        <Box>
          <Typography variant="h6" gutterBottom>
            Chỉ người có quyền quản trị đơn vị
          </Typography>
          <OrgUnitAdminOnly 
            fallback={
              <Alert severity="warning">
                Bạn cần quyền quản trị đơn vị để thấy các nút này
              </Alert>
            }
          >
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
          </OrgUnitAdminOnly>
        </Box>

        {/* Custom Permission Check */}
        <Box>
          <Typography variant="h6" gutterBottom>
            Kiểm tra quyền tùy chỉnh
          </Typography>
          
          <PermissionGuard permission="org_unit.create">
            <Button variant="contained" startIcon={<AddIcon />} sx={{ mr: 2 }}>
              Tạo đơn vị (org_unit.create)
            </Button>
          </PermissionGuard>

          <PermissionGuard permission="org_unit.update">
            <Button variant="outlined" startIcon={<EditIcon />} sx={{ mr: 2 }}>
              Sửa đơn vị (org_unit.update)
            </Button>
          </PermissionGuard>

          <PermissionGuard permission="org_unit.delete">
            <Button variant="outlined" color="error" startIcon={<DeleteIcon />}>
              Xóa đơn vị (org_unit.delete)
            </Button>
          </PermissionGuard>

          <PermissionGuard 
            permissions={['org_unit.create', 'org_unit.update', 'org_unit.delete']}
            requireAll={true}
            fallback={
              <Alert severity="info" sx={{ mt: 2 }}>
                Bạn cần đầy đủ quyền tạo, sửa, xóa đơn vị để thấy nút "Quản lý đầy đủ"
              </Alert>
            }
          >
            <Button variant="contained" color="secondary" sx={{ mt: 2 }}>
              Quản lý đầy đủ đơn vị
            </Button>
          </PermissionGuard>
        </Box>

        {/* Current Permission Status */}
        <Box>
          <Typography variant="h6" gutterBottom>
            Trạng thái quyền hiện tại
          </Typography>
          <Stack spacing={1}>
            <Typography variant="body2">
              • Xem đơn vị: {canReadOrgUnits() ? '✅' : '❌'}
            </Typography>
            <Typography variant="body2">
              • Tạo đơn vị: {canCreateOrgUnits() ? '✅' : '❌'}
            </Typography>
            <Typography variant="body2">
              • Sửa đơn vị: {canUpdateOrgUnits() ? '✅' : '❌'}
            </Typography>
            <Typography variant="body2">
              • Xóa đơn vị: {canDeleteOrgUnits() ? '✅' : '❌'}
            </Typography>
            <Typography variant="body2">
              • Quản trị đơn vị: {canAdminOrgUnits() ? '✅' : '❌'}
            </Typography>
            <Typography variant="body2">
              • Admin: {isAdmin() ? '✅' : '❌'}
            </Typography>
          </Stack>
        </Box>
      </Stack>
    </Container>
  );
}
