import { NextResponse } from 'next/server';
import type { ApiResponse } from '@/types/common';

/**
 * Serialize complex database types (BigInt, Prisma Decimal, Date) safely to standard JSON primitives.
 */
export function serializeData<T>(data: T): T {
  if (data === null || data === undefined) {
    return data;
  }

  return JSON.parse(
    JSON.stringify(data, (_, value) => {
      if (typeof value === 'bigint') {
        return value.toString();
      }
      // Handle Prisma Decimal objects
      if (value && typeof value === 'object' && 's' in value && 'e' in value && 'd' in value) {
        if (typeof (value as { toNumber?: () => number }).toNumber === 'function') {
          return (value as { toNumber: () => number }).toNumber();
        }
      }
      return value;
    })
  );
}

/**
 * Return a standardized success JSON response with serialized payload.
 */
export function apiSuccess<T>(data: T, message?: string, status = 200): NextResponse<ApiResponse<T>> {
  const body: ApiResponse<T> = {
    success: true,
    data: serializeData(data),
    ...(message ? { message } : {}),
  };
  return NextResponse.json(body, { status });
}

/**
 * Return a standardized error JSON response.
 */
export function apiError(
  error: string | Error,
  status = 500,
  details?: unknown
): NextResponse<ApiResponse<never>> {
  const errorMessage = error instanceof Error ? error.message : error;
  const body: ApiResponse<never> = {
    success: false,
    error: errorMessage,
    ...(details ? { details } : {}),
  };
  return NextResponse.json(body, { status });
}
