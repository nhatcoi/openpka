import { db } from '@/lib/db';

export interface AcademicHistoryFilters {
  entityType?: string;
  entityId?: bigint;
  action?: string;
  actorId?: bigint;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export class AcademicHistoryService {
  /**
   * Query academic audit logs from audit_logs table.
   */
  static async getHistory(filters: AcademicHistoryFilters = {}) {
    const {
      entityType,
      entityId,
      action,
      actorId,
      startDate,
      endDate,
      page = 1,
      limit = 20,
    } = filters;

    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (entityType) where.entity_type = entityType;
    if (entityId) where.entity_id = entityId;
    if (action) where.action = action;
    if (actorId) where.actor_id = actorId;

    if (startDate || endDate) {
      const dateFilter: Record<string, Date> = {};
      if (startDate) dateFilter.gte = new Date(startDate);
      if (endDate) dateFilter.lte = new Date(endDate);
      where.created_at = dateFilter;
    }

    const [items, total] = await Promise.all([
      db.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      db.auditLog.count({ where }),
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
}
