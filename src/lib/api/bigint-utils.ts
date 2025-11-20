/**
 * Utility functions for handling BigInt serialization in API responses
 */

/**
 * Recursively converts BigInt values to Numbers in an object
 * @param obj - Object to process
 * @returns Object with BigInt values converted to Numbers
 */
export function convertBigIntToNumber(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'bigint') {
    return Number(obj);
  }

  // Handle Prisma Decimal objects
  if (obj && typeof obj === 'object' && obj.constructor && obj.constructor.name === 'Decimal') {
    return Number(obj.toString());
  }

  // Handle Prisma Decimal objects (alternative check)
  if (obj && typeof obj === 'object' && obj.s !== undefined && obj.e !== undefined && obj.d !== undefined) {
    return Number(obj.toString());
  }

  // Handle Prisma DateTime objects
  if (obj && typeof obj === 'object' && obj instanceof Date) {
    return obj.toISOString();
  }

  if (Array.isArray(obj)) {
    return obj.map(convertBigIntToNumber);
  }

  if (typeof obj === 'object') {
    const converted: any = {};
    for (const [key, value] of Object.entries(obj)) {
      converted[key] = convertBigIntToNumber(value);
    }
    return converted;
  }

  return obj;
}

/**
 * Safely converts BigInt fields to Numbers for API responses
 * @param major - Major object from database
 * @returns Major object with BigInt fields converted to Numbers
 */
export function transformMajorForAPI(major: any): any {
  const transformed = convertBigIntToNumber(major);
  
  // Parse JSON fields if they exist
  if (transformed.campuses && typeof transformed.campuses === 'string') {
    transformed.campuses = JSON.parse(transformed.campuses);
  }
  if (transformed.languages && typeof transformed.languages === 'string') {
    transformed.languages = JSON.parse(transformed.languages);
  }
  if (transformed.modalities && typeof transformed.modalities === 'string') {
    transformed.modalities = JSON.parse(transformed.modalities);
  }
  if (transformed.accreditations && typeof transformed.accreditations === 'string') {
    transformed.accreditations = JSON.parse(transformed.accreditations);
  }
  if (transformed.aliases && typeof transformed.aliases === 'string') {
    transformed.aliases = JSON.parse(transformed.aliases);
  }
  if (transformed.documents && typeof transformed.documents === 'string') {
    transformed.documents = JSON.parse(transformed.documents);
  }

  return transformed;
}

/**
 * Transforms array of majors for API response
 * @param majors - Array of major objects from database
 * @returns Array of major objects with BigInt fields converted to Numbers
 */
export function transformMajorsForAPI(majors: any[]): any[] {
  return majors.map(transformMajorForAPI);
}
