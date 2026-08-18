'use client';

import { Schedule as ScheduleIcon } from '@mui/icons-material';
import { FeaturePlaceholder } from '@/components/misc/feature-placeholder';

export default function SchedulePage() {
  return (
    <FeaturePlaceholder
      title="Quản lý lịch học – thi"
      description="Thời khóa biểu, lịch thi, phòng học"
      features={[
        'Quản lý thời khóa biểu',
        'Quản lý lịch thi',
        'Quản lý phòng học',
        'Xếp lịch tự động',
        'Báo cáo lịch học',
      ]}
      icon={<ScheduleIcon sx={{ fontSize: 64 }} />}
      gradient="linear-gradient(135deg, #d32f2f 0%, #f44336 100%)"
    />
  );
}
