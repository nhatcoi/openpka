'use client';

import { Security as SecurityIcon } from '@mui/icons-material';
import { FeaturePlaceholder } from '@/components/misc/feature-placeholder';

export default function UsersPage() {
  return (
    <FeaturePlaceholder
      title="Quản lý người dùng & phân quyền"
      description="Tài khoản, role/permission, phân quyền theo đơn vị, bảo mật & audit log"
      features={[
        'Quản lý tài khoản người dùng',
        'Quản lý vai trò & quyền hạn',
        'Phân quyền theo đơn vị',
        'Bảo mật & audit log',
        'Xác thực đa yếu tố',
      ]}
      icon={<SecurityIcon sx={{ fontSize: 64 }} />}
      gradient="linear-gradient(135deg, #5d4037 0%, #8d6e63 100%)"
    />
  );
}
