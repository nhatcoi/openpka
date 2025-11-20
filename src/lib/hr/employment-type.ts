const normalizeString = (value: string) =>
    value
        .trim()
        .replace(/[\s-]+/g, '_')
        .toUpperCase();

/**
 * Chuẩn hoá giá trị employment_type trước khi lưu DB.
 */
export function normalizeEmploymentType(
    value?: string | null
): string | undefined {
    if (!value) {
        return undefined;
    }

    return normalizeString(value);
}

/**
 * Định dạng lại giá trị employment_type trả về cho client
 * để khớp với UI (lowercase + dấu gạch ngang).
 */
export function formatEmploymentTypeForClient(
    value?: string | null
): string | null {
    if (!value) {
        return value ?? null;
    }

    return value.trim().toLowerCase().replace(/_/g, '-');
}

