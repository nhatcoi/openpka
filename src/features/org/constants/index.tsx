import React from 'react';
import {
  Business as BusinessIcon,
  RateReview as ReviewIcon,
  CheckCircle as ApproveIcon,
  RocketLaunch as ActiveIcon,
  Timeline as MonitorIcon,
  Description as DescriptionIcon,
  School as SchoolIcon,
  CheckCircle as CheckCircleIcon,
  RocketLaunch as RocketLaunchIcon,
  AccountTree as AccountTreeIcon,
  Gavel as GavelIcon,
  Support as SupportIcon,
  Handshake as HandshakeIcon,
} from '@mui/icons-material';
import { OrgUnitWorkflowStage } from '@/constants/org-units';
import { UnitType } from '../api/api';

export const RELATION_TYPES = [
  { value: 'direct', label: 'Trực tiếp', icon: AccountTreeIcon },
  { value: 'advisory', label: 'Tư vấn', icon: GavelIcon },
  { value: 'support', label: 'Hỗ trợ', icon: SupportIcon },
  { value: 'collab', label: 'Hợp tác', icon: HandshakeIcon },
];

export const UNIT_TYPES: UnitType[] = [
  { value: 'UNIVERSITY', label: 'Đại học', description: 'Cấp trường đại học' },
  { value: 'FACULTY', label: 'Khoa', description: 'Cấp khoa' },
  { value: 'DEPARTMENT', label: 'Bộ môn', description: 'Cấp bộ môn' },
  { value: 'DIVISION', label: 'Phòng ban', description: 'Cấp phòng ban' },
  { value: 'CENTER', label: 'Trung tâm', description: 'Cấp trung tâm' },
  { value: 'INSTITUTE', label: 'Viện', description: 'Cấp viện' },
  { value: 'OFFICE', label: 'Văn phòng', description: 'Cấp văn phòng' },
];

export const WORKFLOW_STEPS = [
  {
    key: 'draft',
    label: 'Khởi tạo (Draft)',
    icon: <BusinessIcon />,
    description: 'Nhập thông tin cơ bản của đơn vị',
    color: 'primary',
  },
  {
    key: 'review',
    label: 'Xem xét/Thẩm định (Review)',
    icon: <ReviewIcon />,
    description: 'Kiểm tra tính hợp lệ và nguồn lực',
    color: 'warning',
  },
  {
    key: 'approve',
    label: 'Phê duyệt (Approve)',
    icon: <ApproveIcon />,
    description: 'Quyết định chính thức thành lập',
    color: 'success',
  },
  {
    key: 'active',
    label: 'Kích hoạt (Active)',
    icon: <ActiveIcon />,
    description: 'Kích hoạt và bổ nhiệm nhân sự',
    color: 'info',
  },
  {
    key: 'monitor',
    label: 'Theo dõi & Biến đổi',
    icon: <MonitorIcon />,
    description: 'Quản lý trạng thái và lịch sử',
    color: 'secondary',
  },
];

export const ORG_UNIT_PROCESS_STAGES = [
  { stage: OrgUnitWorkflowStage.DRAFT, label: 'Soạn thảo', Icon: DescriptionIcon },
  { stage: OrgUnitWorkflowStage.REVIEWING, label: 'Đang xem xét', Icon: SchoolIcon },
  { stage: OrgUnitWorkflowStage.APPROVED, label: 'Đã phê duyệt', Icon: CheckCircleIcon },
  { stage: OrgUnitWorkflowStage.PUBLISHED, label: 'Đã kích hoạt', Icon: RocketLaunchIcon },
];

export const WORKFLOW_ACTIONS = {
  SUBMIT: 'SUBMIT',
  APPROVE: 'APPROVE',
  REJECT: 'REJECT',
  ACTIVATE: 'ACTIVATE',
  RETURN: 'RETURN',
  SUSPEND: 'SUSPEND',
  CANCEL: 'CANCEL',
  ARCHIVE: 'ARCHIVE',
} as const;
