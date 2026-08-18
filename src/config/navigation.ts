import type { ModuleKey } from '@/types/common';
import { PERMISSIONS } from './permissions';

export interface NavigationItem {
  key: string;
  label: string;
  href?: string;
  iconName: string;
  permission?: string;
  children?: NavigationItem[];
  badge?: string;
}

export interface ModuleConfig {
  key: ModuleKey;
  label: string;
  basePath: string;
  iconName: string;
  defaultPermission?: string;
  items: NavigationItem[];
}

export const MODULE_NAVIGATION: Record<ModuleKey, NavigationItem[]> = {
  hr: [
    {
      key: 'hr-dashboard',
      label: 'Dashboard',
      href: '/hr/dashboard',
      iconName: 'Dashboard',
      permission: PERMISSIONS.HR.VIEW,
    },
    {
      key: 'hr-leave-requests',
      label: 'Đơn xin nghỉ',
      href: '/hr/leave-requests',
      iconName: 'EventNote',
      permission: PERMISSIONS.HR.LEAVE_REQUEST_VIEW,
    },
    {
      key: 'hr-evaluations',
      label: 'Đánh giá của tôi',
      href: '/hr/my-evaluations',
      iconName: 'Assessment',
      permission: PERMISSIONS.HR.PERFORMANCE_REVIEW_VIEW,
    },
    {
      key: 'hr-management',
      label: 'Quản lý Nhân sự',
      iconName: 'Group',
      permission: PERMISSIONS.HR.EMPLOYEE_VIEW,
      children: [
        {
          key: 'hr-employees',
          label: 'Nhân viên',
          href: '/hr/employees',
          iconName: 'People',
          permission: PERMISSIONS.HR.EMPLOYEE_VIEW,
        },
        {
          key: 'hr-assignments',
          label: 'Phân công công việc',
          href: '/hr/assignments',
          iconName: 'AssignmentInd',
          permission: PERMISSIONS.HR.ASSIGNMENT_VIEW,
        },
        {
          key: 'hr-qualifications',
          label: 'Bằng cấp',
          href: '/hr/qualifications',
          iconName: 'School',
          permission: PERMISSIONS.HR.QUALIFICATION_VIEW,
        },
        {
          key: 'hr-employee-qualifications',
          label: 'Bằng cấp nhân viên',
          href: '/hr/employee-qualifications',
          iconName: 'School',
          permission: PERMISSIONS.HR.QUALIFICATION_VIEW,
        },
        {
          key: 'hr-employments',
          label: 'Hợp đồng lao động',
          href: '/hr/employments',
          iconName: 'Work',
          permission: PERMISSIONS.HR.EMPLOYMENT_VIEW,
        },
        {
          key: 'hr-performance-reviews',
          label: 'Đánh giá hiệu quả',
          href: '/hr/performance-reviews',
          iconName: 'Assessment',
          permission: PERMISSIONS.HR.PERFORMANCE_REVIEW_VIEW,
        },
        {
          key: 'hr-academic-titles',
          label: 'Học hàm/Học vị',
          href: '/hr/academic-titles',
          iconName: 'School',
          permission: PERMISSIONS.HR.ACADEMIC_TITLE_VIEW,
        },
        {
          key: 'hr-employee-academic-titles',
          label: 'Học hàm nhân viên',
          href: '/hr/employee-academic-titles',
          iconName: 'School',
          permission: PERMISSIONS.HR.ACADEMIC_TITLE_VIEW,
        },
        {
          key: 'hr-trainings',
          label: 'Khóa đào tạo',
          href: '/hr/trainings',
          iconName: 'CastForEducation',
          permission: PERMISSIONS.HR.TRAINING_VIEW,
        },
        {
          key: 'hr-employee-trainings',
          label: 'Đào tạo nhân viên',
          href: '/hr/employee-trainings',
          iconName: 'CastForEducation',
          permission: PERMISSIONS.HR.TRAINING_VIEW,
        },
        {
          key: 'hr-employee-logs',
          label: 'Nhật ký thay đổi',
          href: '/hr/employee-logs',
          iconName: 'History',
          permission: PERMISSIONS.HR.EMPLOYEE_VIEW,
        },
      ],
    },
    {
      key: 'hr-rbac',
      label: 'Phân quyền & Vai trò',
      iconName: 'Security',
      permission: PERMISSIONS.HR.RBAC_VIEW,
      children: [
        {
          key: 'hr-roles',
          label: 'Vai trò (Roles)',
          href: '/hr/roles',
          iconName: 'AdminPanelSettings',
          permission: PERMISSIONS.HR.RBAC_VIEW,
        },
        {
          key: 'hr-permissions',
          label: 'Quyền hạn (Permissions)',
          href: '/hr/permissions',
          iconName: 'VpnKey',
          permission: PERMISSIONS.HR.RBAC_VIEW,
        },
        {
          key: 'hr-role-permissions',
          label: 'Gán quyền cho vai trò',
          href: '/hr/role-permissions',
          iconName: 'Assignment',
          permission: PERMISSIONS.HR.RBAC_VIEW,
        },
        {
          key: 'hr-user-roles',
          label: 'Gán vai trò người dùng',
          href: '/hr/user-roles',
          iconName: 'Person',
          permission: PERMISSIONS.HR.RBAC_VIEW,
        },
      ],
    },
    {
      key: 'hr-reports',
      label: 'Báo cáo Thống kê',
      href: '/hr/reports',
      iconName: 'Assessment',
      permission: PERMISSIONS.HR.REPORT_VIEW,
    },
  ],

  org: [
    {
      key: 'org-dashboard',
      label: 'Dashboard',
      href: '/org/dashboard',
      iconName: 'Dashboard',
      permission: PERMISSIONS.ORG.UNIT_VIEW,
    },
    {
      key: 'org-tree-management',
      label: 'Cây tổ chức',
      iconName: 'AccountTree',
      permission: PERMISSIONS.ORG.UNIT_VIEW,
      children: [
        {
          key: 'org-tree-view',
          label: 'Xem cây tổ chức',
          href: '/org/tree',
          iconName: 'AccountTree',
          permission: PERMISSIONS.ORG.UNIT_VIEW,
        },
        {
          key: 'org-tree-diagram',
          label: 'Sơ đồ cây',
          href: '/org/diagram',
          iconName: 'Share',
          permission: PERMISSIONS.ORG.UNIT_VIEW,
        },
      ],
    },
    {
      key: 'org-unit-management',
      label: 'Quản lý đơn vị',
      iconName: 'Apartment',
      permission: PERMISSIONS.ORG.UNIT_VIEW,
      children: [
        {
          key: 'org-unit-list',
          label: 'Danh sách đơn vị',
          href: '/org/unit',
          iconName: 'ListAlt',
          permission: PERMISSIONS.ORG.UNIT_VIEW,
        },
        {
          key: 'org-unit-create',
          label: 'Tạo đơn vị mới',
          href: '/org/unit/new',
          iconName: 'Add',
          permission: PERMISSIONS.ORG.UNIT_CREATE,
        },
        {
          key: 'org-unit-audit',
          label: 'Lịch sử tạo đơn vị',
          href: '/org/unit/create/audit',
          iconName: 'History',
          permission: PERMISSIONS.ORG.UNIT_VIEW,
        },
      ],
    },
    {
      key: 'org-assignments',
      label: 'Phân công đơn vị',
      href: '/org/assignments',
      iconName: 'AssignmentInd',
      permission: PERMISSIONS.ORG.ASSIGNMENT_VIEW,
    },
    {
      key: 'org-config',
      label: 'Cấu hình tổ chức',
      href: '/org/config',
      iconName: 'Settings',
      permission: PERMISSIONS.ORG.TYPE_ADMIN,
    },
    {
      key: 'org-reports',
      label: 'Báo cáo',
      href: '/org/reports',
      iconName: 'Assessment',
      permission: PERMISSIONS.ORG.REPORT_VIEW,
    },
  ],

  tms: [
    {
      key: 'tms-dashboard',
      label: 'Dashboard',
      href: '/tms/dashboard',
      iconName: 'Dashboard',
      permission: PERMISSIONS.TMS.PROGRAM_VIEW,
    },
    {
      key: 'tms-programs',
      label: 'Chương trình đào tạo',
      iconName: 'School',
      permission: PERMISSIONS.TMS.PROGRAM_VIEW,
      children: [
        {
          key: 'tms-programs-list',
          label: 'Danh sách chương trình',
          href: '/tms/programs',
          iconName: 'LibraryBooks',
          permission: PERMISSIONS.TMS.PROGRAM_VIEW,
        },
        {
          key: 'tms-programs-create',
          label: 'Tạo chương trình mới',
          href: '/tms/programs/new',
          iconName: 'Add',
          permission: PERMISSIONS.TMS.PROGRAM_CREATE,
        },
        {
          key: 'tms-programs-review',
          label: 'Duyệt chương trình',
          href: '/tms/programs/review',
          iconName: 'Approval',
          permission: PERMISSIONS.TMS.PROGRAM_APPROVE,
        },
      ],
    },
    {
      key: 'tms-courses',
      label: 'Học phần',
      iconName: 'Class',
      permission: PERMISSIONS.TMS.COURSE_VIEW,
      children: [
        {
          key: 'tms-courses-list',
          label: 'Danh sách học phần',
          href: '/tms/courses',
          iconName: 'Subject',
          permission: PERMISSIONS.TMS.COURSE_VIEW,
        },
        {
          key: 'tms-courses-create',
          label: 'Tạo học phần mới',
          href: '/tms/courses/new',
          iconName: 'Add',
          permission: PERMISSIONS.TMS.COURSE_CREATE,
        },
        {
          key: 'tms-courses-approval',
          label: 'Duyệt học phần',
          href: '/tms/courses/approval',
          iconName: 'Approval',
          permission: PERMISSIONS.TMS.COURSE_APPROVE,
        },
      ],
    },
    {
      key: 'tms-majors',
      label: 'Ngành & Chuyên ngành',
      iconName: 'SchoolOutlined',
      permission: PERMISSIONS.TMS.MAJOR_VIEW,
      children: [
        {
          key: 'tms-majors-list',
          label: 'Danh sách ngành',
          href: '/tms/majors',
          iconName: 'ListAlt',
          permission: PERMISSIONS.TMS.MAJOR_VIEW,
        },
        {
          key: 'tms-majors-create',
          label: 'Tạo ngành mới',
          href: '/tms/majors/new',
          iconName: 'Add',
          permission: PERMISSIONS.TMS.MAJOR_CREATE,
        },
        {
          key: 'tms-majors-review',
          label: 'Duyệt ngành',
          href: '/tms/majors/review',
          iconName: 'Approval',
          permission: PERMISSIONS.TMS.MAJOR_APPROVE,
        },
      ],
    },
    {
      key: 'tms-reports',
      label: 'Báo cáo',
      href: '/tms/reports',
      iconName: 'Assessment',
      permission: PERMISSIONS.TMS.REPORT_VIEW,
    },
  ],

  finance: [
    {
      key: 'finance-tuition',
      label: 'Đơn giá tín chỉ CTĐT',
      href: '/finance',
      iconName: 'Dashboard',
    },
  ],

  academic: [
    {
      key: 'academic-history',
      label: 'Lịch sử học tập',
      href: '/academic/history',
      iconName: 'History',
    },
  ],

  students: [
    {
      key: 'students-list',
      label: 'Danh sách sinh viên',
      href: '/students',
      iconName: 'People',
    },
  ],

  schedule: [
    {
      key: 'schedule-view',
      label: 'Thời khóa biểu',
      href: '/schedule',
      iconName: 'EventNote',
    },
  ],

  reports: [
    {
      key: 'reports-general',
      label: 'Báo cáo tổng hợp',
      href: '/reports',
      iconName: 'Assessment',
    },
  ],
};

/**
 * Detect the current active module from the pathname.
 */
export function getActiveModuleFromPathname(pathname: string): ModuleKey {
  const segments = pathname.split('/').filter(Boolean);
  const firstSegment = segments[0] as ModuleKey;

  if (firstSegment && firstSegment in MODULE_NAVIGATION) {
    return firstSegment;
  }

  return 'hr'; // Default fallback
}
