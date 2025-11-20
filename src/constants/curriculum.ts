export enum CurriculumStatus {
  DRAFT = 'DRAFT',
  REVIEWING = 'REVIEWING',
  APPROVED = 'APPROVED',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

export const DEFAULT_CURRICULUM_PAGE_SIZE = 10;

export function getCurriculumStatusLabel(status: CurriculumStatus | string | null | undefined): string {
  switch ((status || '').toUpperCase()) {
    case CurriculumStatus.APPROVED:
      return 'Đã phê duyệt';
    case CurriculumStatus.PUBLISHED:
      return 'Đã ban hành';
    case CurriculumStatus.REVIEWING:
      return 'Đang thẩm định';
    case CurriculumStatus.ARCHIVED:
      return 'Lưu trữ';
    case CurriculumStatus.DRAFT:
    default:
      return 'Bản nháp';
  }
}

export function getCurriculumStatusColor(status: CurriculumStatus | string | null | undefined): 'default' | 'info' | 'success' | 'warning' | 'error' {
  switch ((status || '').toUpperCase()) {
    case CurriculumStatus.APPROVED:
    case CurriculumStatus.PUBLISHED:
      return 'success';
    case CurriculumStatus.REVIEWING:
      return 'warning';
    case CurriculumStatus.ARCHIVED:
      return 'info';
    case CurriculumStatus.DRAFT:
    default:
      return 'default';
  }
}

export function normalizeCurriculumStatus(status?: string | null): CurriculumStatus {
  switch ((status || '').toUpperCase()) {
    case CurriculumStatus.APPROVED:
      return CurriculumStatus.APPROVED;
    case CurriculumStatus.PUBLISHED:
      return CurriculumStatus.PUBLISHED;
    case CurriculumStatus.REVIEWING:
      return CurriculumStatus.REVIEWING;
    case CurriculumStatus.ARCHIVED:
      return CurriculumStatus.ARCHIVED;
    case CurriculumStatus.DRAFT:
    default:
      return CurriculumStatus.DRAFT;
  }
}
