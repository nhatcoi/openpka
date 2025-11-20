import { MajorJSONHelper, SimplifiedMajor } from '@/types/major';

/**
 * Helper functions for working with simplified Major structure
 */

export class MajorAPIHelper {
  /**
   * Transform Prisma Major to SimplifiedMajor format
   */
  static transformFromPrisma(prismaMajor: any): SimplifiedMajor {
    return {
      id: prismaMajor.id,
      code: prismaMajor.code,
      name_vi: prismaMajor.name_vi,
      name_en: prismaMajor.name_en,
      short_name: prismaMajor.short_name,
      slug: prismaMajor.slug,
      national_code: prismaMajor.national_code,
      degree_level: prismaMajor.degree_level,
      field_cluster: prismaMajor.field_cluster,
      specialization_model: prismaMajor.specialization_model,
      org_unit_id: prismaMajor.org_unit_id,
      parent_major_id: prismaMajor.parent_major_id,
      duration_years: prismaMajor.duration_years,
      total_credits_min: prismaMajor.total_credits_min,
      total_credits_max: prismaMajor.total_credits_max,
      semesters_per_year: prismaMajor.semesters_per_year,
      start_terms: prismaMajor.start_terms,
      default_quota: prismaMajor.default_quota,
      status: prismaMajor.status,
      established_at: prismaMajor.established_at,
      closed_at: prismaMajor.closed_at,
      description: prismaMajor.description,
      notes: prismaMajor.notes,
      
      // Parse JSON fields
      campuses: prismaMajor.campuses ? JSON.parse(prismaMajor.campuses) : [],
      languages: prismaMajor.languages ? JSON.parse(prismaMajor.languages) : [],
      modalities: prismaMajor.modalities ? JSON.parse(prismaMajor.modalities) : [],
      accreditations: prismaMajor.accreditations ? JSON.parse(prismaMajor.accreditations) : [],
      aliases: prismaMajor.aliases ? JSON.parse(prismaMajor.aliases) : [],
      documents: prismaMajor.documents ? JSON.parse(prismaMajor.documents) : [],
      
      created_by: prismaMajor.created_by,
      updated_by: prismaMajor.updated_by,
      created_at: prismaMajor.created_at,
      updated_at: prismaMajor.updated_at,
    };
  }

  /**
   * Transform SimplifiedMajor to Prisma format for database operations
   */
  static transformToPrisma(major: SimplifiedMajor): any {
    return {
      code: major.code,
      name_vi: major.name_vi,
      name_en: major.name_en,
      short_name: major.short_name,
      slug: major.slug,
      national_code: major.national_code,
      degree_level: major.degree_level,
      field_cluster: major.field_cluster,
      specialization_model: major.specialization_model,
      org_unit_id: major.org_unit_id,
      parent_major_id: major.parent_major_id,
      duration_years: major.duration_years,
      total_credits_min: major.total_credits_min,
      total_credits_max: major.total_credits_max,
      semesters_per_year: major.semesters_per_year,
      start_terms: major.start_terms,
      default_quota: major.default_quota,
      status: major.status,
      established_at: major.established_at,
      closed_at: major.closed_at,
      description: major.description,
      notes: major.notes,
      
      // Stringify JSON fields
      campuses: JSON.stringify(major.campuses || []),
      languages: JSON.stringify(major.languages || []),
      modalities: JSON.stringify(major.modalities || []),
      accreditations: JSON.stringify(major.accreditations || []),
      aliases: JSON.stringify(major.aliases || []),
      documents: JSON.stringify(major.documents || []),
      
      created_by: major.created_by,
      updated_by: major.updated_by,
    };
  }

  /**
   * Validate major data before saving
   */
  static validate(major: Partial<SimplifiedMajor>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!major.code) errors.push('Code is required');
    if (!major.name_vi) errors.push('Vietnamese name is required');
    if (!major.degree_level) errors.push('Degree level is required');
    if (!major.org_unit_id) errors.push('Organization unit is required');

    // Validate JSON fields
    if (major.campuses && !Array.isArray(major.campuses)) {
      errors.push('Campuses must be an array');
    }

    if (major.languages && !Array.isArray(major.languages)) {
      errors.push('Languages must be an array');
    }

    if (major.modalities && !Array.isArray(major.modalities)) {
      errors.push('Modalities must be an array');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get display information for major
   */
  static getDisplayInfo(major: SimplifiedMajor) {
    const primaryCampus = MajorJSONHelper.getPrimaryCampus(major);
    const mainLanguage = MajorJSONHelper.getMainLanguage(major);
    const primaryModality = MajorJSONHelper.getPrimaryModality(major);
    const activeAccreditations = MajorJSONHelper.getActiveAccreditations(major);
    const activeAliases = MajorJSONHelper.getActiveAliases(major);

    return {
      primaryCampus,
      mainLanguage,
      primaryModality,
      activeAccreditations,
      activeAliases,
      campusCount: major.campuses?.length || 0,
      languageCount: major.languages?.length || 0,
      modalityCount: major.modalities?.length || 0,
      accreditationCount: activeAccreditations.length,
      aliasCount: activeAliases.length,
      documentCount: major.documents?.length || 0,
    };
  }

  /**
   * Search majors with simplified structure
   */
  static searchMajors(majors: SimplifiedMajor[], searchTerm: string): SimplifiedMajor[] {
    const term = searchTerm.toLowerCase();
    
    return majors.filter(major => 
      major.code.toLowerCase().includes(term) ||
      major.name_vi.toLowerCase().includes(term) ||
      (major.name_en && major.name_en.toLowerCase().includes(term)) ||
      (major.short_name && major.short_name.toLowerCase().includes(term)) ||
      // Search in aliases
      major.aliases?.some(alias => 
        alias.name.toLowerCase().includes(term)
      )
    );
  }

  /**
   * Filter majors by status
   */
  static filterByStatus(majors: SimplifiedMajor[], status: string): SimplifiedMajor[] {
    return majors.filter(major => major.status === status);
  }

  /**
   * Filter majors by degree level
   */
  static filterByDegreeLevel(majors: SimplifiedMajor[], degreeLevel: string): SimplifiedMajor[] {
    return majors.filter(major => major.degree_level === degreeLevel);
  }

  /**
   * Filter majors by organization unit
   */
  static filterByOrgUnit(majors: SimplifiedMajor[], orgUnitId: number): SimplifiedMajor[] {
    return majors.filter(major => major.org_unit_id === orgUnitId);
  }
}

