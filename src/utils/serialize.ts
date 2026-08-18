/**
 * Serialize BigInt and other complex types to standard JSON primitives.
 */
export function serializeBigInt<T = unknown>(obj: T): unknown {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'bigint') return obj.toString();
  if (Array.isArray(obj)) return obj.map((item) => serializeBigInt(item));
  if (typeof obj === 'object') {
    const serialized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      serialized[key] = serializeBigInt(value);
    }
    return serialized;
  }
  return obj;
}

export function serializeBigIntArray<T>(arr: T[]): T[] {
  return arr.map((item) => serializeBigInt(item) as T);
}
