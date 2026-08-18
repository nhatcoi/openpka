import { db } from '@/lib/db';
import type { Prisma } from '@prisma/client';

export class CourseService {
  /**
   * Get courses with pagination and filters.
   */
  static async getCourses(options: {
    status?: string;
    type?: string;
    org_unit_id?: bigint;
    search?: string;
    page?: number;
    limit?: number;
  } = {}) {
    const { status, type, org_unit_id, search, page = 1, limit = 50 } = options;
    const skip = (page - 1) * limit;

    const where: Prisma.CourseWhereInput = {
      ...(status ? { status } : {}),
      ...(type ? { type } : {}),
      ...(org_unit_id ? { org_unit_id } : {}),
      ...(search
        ? {
            OR: [
              { code: { contains: search, mode: 'insensitive' } },
              { name_vi: { contains: search, mode: 'insensitive' } },
              { name_en: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      db.course.findMany({
        where,
        skip,
        take: limit,
        orderBy: { code: 'asc' },
      }),
      db.course.count({ where }),
    ]);

    return {
      items,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get single course by ID.
   */
  static async getCourseById(id: bigint) {
    return db.course.findUnique({
      where: { id },
    });
  }
}
