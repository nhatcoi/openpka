// Centralized course-related enums and helpers

export enum CoursePrerequisiteType {
    PREREQUISITE = 'prerequisite',
    PRIOR = 'prior',
    COREQUISITE = 'corequisite',
}

export enum CourseStatus {
    DRAFT = 'DRAFT',
    SUBMITTED = 'SUBMITTED',
    REVIEWING = 'REVIEWING',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
    PUBLISHED = 'PUBLISHED',
}

export enum WorkflowStage {
    FACULTY = 'FACULTY',
    ACADEMIC_OFFICE = 'ACADEMIC_OFFICE',
    ACADEMIC_BOARD = 'ACADEMIC_BOARD',
}

export enum CoursePriority {
    HIGH = 'HIGH',
    MEDIUM = 'MEDIUM',
    LOW = 'LOW',
}

export enum CourseType {
    THEORY = 'theory',
    PRACTICE = 'practice',
    MIXED = 'mixed',
    THESIS = 'thesis',
    INTERNSHIP = 'internship',
}

export const COURSE_STATUSES: CourseStatus[] = [
    CourseStatus.DRAFT,
    CourseStatus.SUBMITTED,
    CourseStatus.REVIEWING,
    CourseStatus.APPROVED,
    CourseStatus.REJECTED,
    CourseStatus.PUBLISHED,
];

export const COURSE_PRIORITIES: CoursePriority[] = [
    CoursePriority.HIGH,
    CoursePriority.MEDIUM,
    CoursePriority.LOW,
];

export const COURSE_TYPES: CourseType[] = [
    CourseType.THEORY,
    CourseType.PRACTICE,
    CourseType.MIXED,
    CourseType.THESIS,
    CourseType.INTERNSHIP,
];

export const WORKFLOW_STAGES: WorkflowStage[] = [
    WorkflowStage.FACULTY,
    WorkflowStage.ACADEMIC_OFFICE,
    WorkflowStage.ACADEMIC_BOARD,
];

export const COURSE_PERMISSIONS = {
    VIEW: 'tms.course.view',
    CREATE: 'tms.course.create',
    UPDATE: 'tms.course.update',
    DELETE: 'tms.course.delete',
    REVIEW: 'tms.course.review',
    APPROVE: 'tms.course.approve',
    REJECT: 'tms.course.reject',
    PUBLISH: 'tms.course.publish',
    MANAGE: 'tms.course.manage'
} as const;

export function normalizeCoursePriority(priority?: string | null): CoursePriority {
    switch ((priority || '').toUpperCase()) {
        case CoursePriority.HIGH:
            return CoursePriority.HIGH;
        case CoursePriority.LOW:
            return CoursePriority.LOW;
        case CoursePriority.MEDIUM:
        default:
            return CoursePriority.MEDIUM;
    }
}

export function getPrereqLabelVi(type: string): string {
    switch (type) {
        case CoursePrerequisiteType.PREREQUISITE:
            return 'Bắt buộc';
        case CoursePrerequisiteType.PRIOR:
            return 'Khuyến nghị';
        case CoursePrerequisiteType.COREQUISITE:
            return 'Song hành';
        default:
            return type;
    }
}

// Returns MUI Chip color keyword
export function getPrereqChipColor(type: string): 'error' | 'warning' | 'info' | 'default' {
    switch (type) {
        case CoursePrerequisiteType.PREREQUISITE:
            return 'error';
        case CoursePrerequisiteType.PRIOR:
            return 'warning';
        case CoursePrerequisiteType.COREQUISITE:
            return 'info';
        default:
            return 'default';
    }
}

export function getStatusColor(status: CourseStatus | string): 'default' | 'info' | 'warning' | 'success' | 'error' {
    switch (status) {
        case CourseStatus.PUBLISHED:
        case CourseStatus.APPROVED:
            return 'success';
        case CourseStatus.REVIEWING:
            return 'warning';
        case CourseStatus.SUBMITTED:
            return 'info';
        case CourseStatus.DRAFT:
            return 'default';
        case CourseStatus.REJECTED:
            return 'error';
        default:
            return 'default';
    }
}

export function getStatusLabel(status: CourseStatus | string): string {
    switch (status) {
        case CourseStatus.PUBLISHED: return 'Đã xuất bản';
        case CourseStatus.APPROVED: return 'Đã phê duyệt';
        case CourseStatus.REVIEWING: return 'Đang xem xét';
        case CourseStatus.SUBMITTED: return 'Đã nộp';
        case CourseStatus.DRAFT: return 'Bản nháp';
        case CourseStatus.REJECTED: return 'Bị từ chối';
        default: return status;
    }
}

export function getWorkflowStageLabel(stage: WorkflowStage | string): string {
    switch (stage) {
        case WorkflowStage.FACULTY: return 'Khoa';
        case WorkflowStage.ACADEMIC_OFFICE: return 'Phòng đào tạo';
        case WorkflowStage.ACADEMIC_BOARD: return 'Hội đồng khoa học';
        default: return stage;
    }
}

export function getPriorityLabel(priority: CoursePriority | string): string {
    switch ((priority || '').toUpperCase()) {
        case CoursePriority.HIGH: return 'Cao';
        case CoursePriority.LOW: return 'Thấp';
        case CoursePriority.MEDIUM:
        default: return 'Trung bình';
    }
}

export function getPriorityColor(priority: CoursePriority | string): 'error' | 'warning' | 'success' | 'default' {
    switch ((priority || '').toUpperCase()) {
        case CoursePriority.HIGH: return 'error';
        case CoursePriority.MEDIUM: return 'warning';
        case CoursePriority.LOW: return 'success';
        default: return 'default';
    }
}

export function getCourseTypeLabel(type: CourseType | string): string {
    switch (type) {
        case CourseType.THEORY: return 'Lý thuyết';
        case CourseType.PRACTICE: return 'Thực hành';
        case CourseType.MIXED: return 'Lý thuyết + Thực hành';
        case CourseType.THESIS: return 'Khóa luận/Đồ án';
        case CourseType.INTERNSHIP: return 'Thực tập';
        default: return type;
    }
}
