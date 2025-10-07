import { db } from '@/lib/db';

interface OrgUnitType {
  id: string;
  code: string;
  name: string;
  description?: string;
  color: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

interface OrgUnitStatus {
  id: string;
  code: string;
  name: string;
  description?: string;
  color: string;
  is_active: boolean;
  workflow_step: number;
  created_at: string;
  updated_at: string;
}

class OrgConfigCache {
  private types: OrgUnitType[] = [];
  private statuses: OrgUnitStatus[] = [];
  private lastFetch: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  async getTypes(forceRefresh = false): Promise<OrgUnitType[]> {
    if (forceRefresh || this.shouldRefresh()) {
      await this.fetchTypes();
    }
    return this.types;
  }

  async getStatuses(forceRefresh = false): Promise<OrgUnitStatus[]> {
    if (forceRefresh || this.shouldRefresh()) {
      await this.fetchStatuses();
    }
    return this.statuses;
  }

  private shouldRefresh(): boolean {
    return Date.now() - this.lastFetch > this.CACHE_DURATION;
  }

  private async fetchTypes(): Promise<void> {
    try {
      const types = await db.orgUnitType.findMany({
        where: { is_active: true },
        orderBy: [
          { sort_order: 'asc' },
          { name: 'asc' }
        ]
      });

      this.types = types.map(type => ({
        ...type,
        id: type.id.toString(),
      }));
      this.lastFetch = Date.now();
    } catch (error) {
      console.error('Error fetching types:', error);
      // Fallback to empty array
      this.types = [];
    }
  }

  private async fetchStatuses(): Promise<void> {
    try {
      const statuses = await db.orgUnitStatus.findMany({
        where: { is_active: true },
        orderBy: [
          { workflow_step: 'asc' },
          { name: 'asc' }
        ]
      });

      this.statuses = statuses.map(status => ({
        ...status,
        id: status.id.toString(),
      }));
      this.lastFetch = Date.now();
    } catch (error) {
      console.error('Error fetching statuses:', error);
      // Fallback to empty array
      this.statuses = [];
    }
  }

  // Invalidate cache when data changes
  invalidate(): void {
    this.lastFetch = 0;
  }

  // Get cached data without fetching
  getCachedTypes(): OrgUnitType[] {
    return this.types;
  }

  getCachedStatuses(): OrgUnitStatus[] {
    return this.statuses;
  }
}

// Singleton instance
export const orgConfigCache = new OrgConfigCache();
