import { db } from '@/lib/db';
import type { Prisma } from '@prisma/client';

export class ProgramService {
  /**
   * Get list of programs with optional filtering.
   */
  static async getPrograms(options: {
    status?: string;
    org_unit_id?: bigint;
    search?: string;
    page?: number;
    limit?: number;
  } = {}) {
    const { status, org_unit_id, search, page = 1, limit = 50 } = options;
    const skip = (page - 1) * limit;

    const where: Prisma.ProgramWhereInput = {
      ...(status ? { status } : {}),
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
      db.program.findMany({
        where,
        skip,
        take: limit,
        include: {
          OrgUnit: true,
        },
        orderBy: { updated_at: 'desc' },
      }),
      db.program.count({ where }),
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
   * Get single program by ID with relationships.
   */
  static async getProgramById(id: bigint) {
    return db.program.findUnique({
      where: { id },
      include: {
        OrgUnit: true,
        ProgramCourseMap: {
          include: {
            Course: true,
          },
          orderBy: { display_order: 'asc' },
        },
      },
    });
  }
}
