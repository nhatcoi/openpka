'use client';

import { Assignment as AssignmentIcon } from '@mui/icons-material';
import { FeaturePlaceholder } from '@/components/misc/feature-placeholder';

export default function StudentsPage() {
  return (
    <FeaturePlaceholder
      title="Quản lý học vụ & sinh viên"
      description="Hồ sơ sinh viên, lớp học phần, đăng ký tín chỉ, điểm số, xét tốt nghiệp"
      features={[
        'Quản lý hồ sơ sinh viên',
        'Quản lý lớp học phần',
        'Đăng ký tín chỉ',
        'Quản lý điểm số',
        'Xét tốt nghiệp',
      ]}
      icon={<AssignmentIcon sx={{ fontSize: 64 }} />}
      gradient="linear-gradient(135deg, #9c27b0 0%, #e91e63 100%)"
    />
  );
}
