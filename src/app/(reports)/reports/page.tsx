'use client';

import { Analytics as AnalyticsIcon } from '@mui/icons-material';
import { FeaturePlaceholder } from '@/components/misc/feature-placeholder';

export default function ReportsPage() {
  return (
    <FeaturePlaceholder
      title="Báo cáo & phân tích"
      description="Báo cáo đào tạo, nhân sự, xu hướng ngành/học phần, dashboard KPI"
      features={[
        'Báo cáo đào tạo',
        'Báo cáo nhân sự',
        'Phân tích xu hướng ngành/học phần',
        'Dashboard KPI',
        'Xuất báo cáo Excel/PDF',
      ]}
      icon={<AnalyticsIcon sx={{ fontSize: 64 }} />}
      gradient="linear-gradient(135deg, #00695c 0%, #009688 100%)"
    />
  );
}
