import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  details?: string;
}

export type ApiHandler<T = unknown> = (
  request: NextRequest,
  context?: { params?: Promise<{ id: string }> }
) => Promise<NextResponse<ApiResponse<T>>>;

// Only stringify BigInt values for fields that look like identifiers or actor/size fields
function isIdKey(key: string): boolean {
  // normalize to lower-case and check common suffix/patterns
  const k = key.toLowerCase();
  return (
    k === 'id' ||
    k.endsWith('_id') ||
    k.endsWith('id') ||
    k.endsWith('_by') ||
    k.endsWith('_size')
  );
}

export function serializeIdsOnly<T extends Record<string, unknown>>(obj: T): T {
  const serialized = { ...obj } as Record<string, unknown>;
  for (const key in serialized) {
    const value = serialized[key] as unknown;
    if (typeof value === 'bigint') {
      if (isIdKey(key)) {
        serialized[key] = value.toString();
      } else {
        // leave non-id BigInt as-is (will surface quickly if present unexpected)
        serialized[key] = value;
      }
    } else if (value instanceof Date) {
      serialized[key] = value.toISOString();
    } else if (Array.isArray(value)) {
      serialized[key] = serializeIdsOnlyArray(value as unknown[]);
    } else if (value && typeof value === 'object') {
      // Prisma Decimal object detection — always convert to number
      if (value && 's' in (value as Record<string, unknown>) && 'e' in (value as Record<string, unknown>) && 'd' in (value as Record<string, unknown>)) {
        const decimal = value as unknown as { s: number; e: number; d: number[] };
        
        // Use Prisma Decimal's toNumber() method if available
        if (typeof (value as any).toNumber === 'function') {
          serialized[key] = (value as any).toNumber();
        } else {
          // Fallback to manual conversion
          const sign = decimal.s;
          const exponent = decimal.e;
          const digits = decimal.d;
          
          let result = 0;
          for (let i = 0; i < digits.length; i++) {
            result += digits[i] * Math.pow(10, exponent - i);
          }
          
          serialized[key] = sign * result;
        }
      } else {
        serialized[key] = serializeIdsOnly(value as Record<string, unknown>);
      }
    }
  }
  return serialized as T;
}

export function serializeIdsOnlyArray<T extends unknown[]>(arr: T): T {
  return arr.map((item: unknown) => {
    if (typeof item === 'bigint') {
      // No key context in arrays; stringify BigInt to avoid JSON errors
      return item.toString();
    } else if (item instanceof Date) {
      return item.toISOString();
    } else if (Array.isArray(item)) {
      return serializeIdsOnlyArray(item);
    } else if (item && typeof item === 'object') {
      // Prisma Decimal object detection — always convert to number
      if (item && 's' in (item as Record<string, unknown>) && 'e' in (item as Record<string, unknown>) && 'd' in (item as Record<string, unknown>)) {
        const decimal = item as unknown as { s: number; e: number; d: number[] };
        const sign = decimal.s;
        const exponent = decimal.e;
        const digits = decimal.d;
        let result = 0;
        for (let i = 0; i < digits.length; i++) {
          result += digits[i] * Math.pow(10, exponent - i);
        }
        if (exponent < 0) {
          result = result / Math.pow(10, Math.abs(exponent));
        }
        return sign * result;
      }
      return serializeIdsOnly(item as Record<string, unknown>);
    }
    return item;
  }) as T;
}

export function serializeBigInt<T extends Record<string, unknown>>(obj: T): T {
  const serialized = { ...obj } as Record<string, unknown>;
  
  for (const key in serialized) {
    if (typeof serialized[key] === 'bigint') {
      serialized[key] = serialized[key].toString();
    } else if (serialized[key] instanceof Date) {
      serialized[key] = serialized[key].toISOString();
    } else if (Array.isArray(serialized[key])) {
      serialized[key] = serializeBigIntArray(serialized[key] as unknown[]);
    } else if (serialized[key] && typeof serialized[key] === 'object' && !Array.isArray(serialized[key])) {
      // Check if it's a Decimal object (Prisma Decimal)
      if (serialized[key] && typeof serialized[key] === 'object' && 's' in serialized[key] && 'e' in serialized[key] && 'd' in serialized[key]) {
        // Use Prisma Decimal's toNumber() method if available
        if (typeof (serialized[key] as any).toNumber === 'function') {
          serialized[key] = (serialized[key] as any).toNumber();
        } else {
          // Fallback to manual conversion
          const decimal = serialized[key] as { s: number; e: number; d: number[] };
          const sign = decimal.s;
          const exponent = decimal.e;
          const digits = decimal.d;
          
          let result = 0;
          for (let i = 0; i < digits.length; i++) {
            result += digits[i] * Math.pow(10, exponent - i);
          }
          
          serialized[key] = sign * result;
        }
      } else {
        serialized[key] = serializeBigInt(serialized[key] as Record<string, unknown>);
      }
    }
  }
  
  return serialized as T;
}

export function serializeBigIntArray<T extends unknown[]>(arr: T): T {
  return arr.map((item: unknown) => {
    if (typeof item === 'bigint') {
      return item.toString();
    } else if (item instanceof Date) {
      return item.toISOString();
    } else if (Array.isArray(item)) {
      return serializeBigIntArray(item);
    } else if (item && typeof item === 'object') {
      // Check if it's a Decimal object (Prisma Decimal)
      if (item && typeof item === 'object' && 's' in item && 'e' in item && 'd' in item) {
        // Use Prisma Decimal's toNumber() method if available
        if (typeof (item as any).toNumber === 'function') {
          return (item as any).toNumber();
        } else {
          // Fallback to manual conversion
          const decimal = item as { s: number; e: number; d: number[] };
          const sign = decimal.s;
          const exponent = decimal.e;
          const digits = decimal.d;
          
          let result = 0;
          for (let i = 0; i < digits.length; i++) {
            result += digits[i] * Math.pow(10, exponent - i);
          }
          
          return sign * result;
        }
      } else {
        return serializeBigInt(item as Record<string, unknown>);
      }
    }
    return item;
  }) as T;
}

// Build URL with query parameters
export function buildUrl(base: string, params: Record<string, string | number | boolean | undefined | null> = {}): string {
  const url = new URL(base, typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, String(value));
    }
  });
  
  return url.toString();
}

// Success Res
export function createSuccessResponse<T>(
  data: T,
  message?: string,
  status: number = 200
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      message,
    },
    { status }
  );
}

// Error Res
export function createErrorResponse<T>(
  error: string,
  details?: string,
  status: number = 500
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: false,
      error,
      details,
    },
    { status }
  );
}

// Handle API errors
export function handleApiError(error: unknown, context: string): NextResponse<ApiResponse> {
  console.error(`[${context}] Error:`, error);
  
  if (error instanceof Error) {
    return createErrorResponse(
      `Failed to ${context}`,
      error.message,
      500
    );
  }
  
  return createErrorResponse(
    `Failed to ${context}`,
    'Unknown error occurred',
    500
  );
}

// error middleware
export function withErrorHandling<T>(
  handler: (request: NextRequest, context?: { params?: Promise<{ id: string }> }) => Promise<T>,
  context: string
): ApiHandler<T> {
  return async (request: NextRequest, handlerContext?: { params?: Promise<{ id: string }> }) => {
    try {
      const result = await handler(request, handlerContext);
      // Handle arrays separately to avoid converting to objects
      if (Array.isArray(result)) {
        const serializedResult = serializeIdsOnlyArray(result) as unknown as T;
        return createSuccessResponse<T>(serializedResult);
      } else {
        const serializedResult = serializeIdsOnly(result as Record<string, unknown>) as unknown as T;
        return createSuccessResponse<T>(serializedResult);
      }
    } catch (error) {
      return handleApiError(error, context) as NextResponse<ApiResponse<T>>;
    }
  };
}

// Zod validation
export function validateSchema<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessage = error.issues.map((e: z.ZodIssue) => `${e.path.join('.')}: ${e.message}`).join(', ');
      throw new Error(`Validation error: ${errorMessage}`);
    }
    throw error;
  }
}

// GET/DELETE
export function withIdParam<T>(
  handler: (id: string, request: Request) => Promise<T>,
  context: string
) {
  return withErrorHandling(
    async (request: Request, handlerContext?: { params?: Promise<{ id: string }> }) => {
      if (!handlerContext?.params) throw new Error('Missing params');
      
      const { id } = await handlerContext.params;
      return await handler(id, request);
    },
    context
  );
}

// POST
export function withBody<T>(
  handler: (body: unknown, request: Request) => Promise<T>,
  context: string
) {
  return withErrorHandling(
    async (request: Request) => {
      const body = await request.json();
      return await handler(body, request);
    },
    context
  );
}

// PUT/PATCH
export function withIdAndBody<T>(
  handler: (id: string, body: unknown, request: Request) => Promise<T>,
  context: string
) {
  return withErrorHandling(
    async (request: Request, handlerContext?: { params?: Promise<{ id: string }> }) => {
      if (!handlerContext?.params) throw new Error('Missing params');
      
      const { id } = await handlerContext.params;
      const body = await request.json();
      return await handler(id, body, request);
    },
    context
  );
}
