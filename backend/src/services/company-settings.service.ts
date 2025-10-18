import { prisma } from '../config/prisma_client';
import { cacheService } from './cache.service';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * Company Settings Service (PLAN.md 5.2)
 * Manages per-company configuration for business rules and work hour limits
 *
 * Features:
 * - Automatic default settings creation for new companies
 * - Caching layer for performance (5 minute TTL)
 * - Validation against business rules
 */

interface CompanySettingsData {
  max_daily_hours?: number | Decimal;
  max_weekly_hours?: number | Decimal;
  min_break_hours?: number | Decimal;
  allow_overnight_shifts?: boolean;
  timezone?: string;
}

interface CompanySettings {
  id: number;
  company_id: number;
  max_daily_hours: Decimal;
  max_weekly_hours: Decimal;
  min_break_hours: Decimal;
  allow_overnight_shifts: boolean;
  timezone: string;
  created_at: Date;
  updated_at: Date;
}

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const DEFAULT_SETTINGS = {
  max_daily_hours: 12.0,
  max_weekly_hours: 40.0,
  min_break_hours: 11.0,
  allow_overnight_shifts: false,
  timezone: 'UTC',
};

export const company_settings_service = {
  /**
   * Get company settings by company_id with caching
   * Creates default settings if they don't exist
   *
   * @param company_id - Company ID
   * @returns Company settings object
   */
  async getSettings(company_id: number): Promise<CompanySettings> {
    // Check cache first
    const cacheKey = this.getCacheKey(company_id);
    const cached = cacheService.get<CompanySettings>(cacheKey);

    if (cached) {
      return cached;
    }

    // Try to find existing settings
    let settings = await prisma.company_settings.findUnique({
      where: { company_id },
    });

    // Create default settings if they don't exist
    if (!settings) {
      settings = await prisma.company_settings.create({
        data: {
          company_id,
          ...DEFAULT_SETTINGS,
        },
      });
    }

    // Cache the settings
    cacheService.set(cacheKey, settings, CACHE_TTL);

    return settings;
  },

  /**
   * Update company settings
   * Invalidates cache after update
   *
   * @param company_id - Company ID
   * @param data - Partial settings data to update
   * @returns Updated company settings
   */
  async updateSettings(company_id: number, data: CompanySettingsData): Promise<CompanySettings> {
    // Verify company exists
    const company = await prisma.company.findUnique({
      where: { id: company_id },
    });

    if (!company) {
      throw new Error('COMPANY_NOT_FOUND');
    }

    // Convert numbers to Decimal if provided
    const updateData: any = {};

    if (data.max_daily_hours !== undefined) {
      updateData.max_daily_hours = new Decimal(data.max_daily_hours);
    }
    if (data.max_weekly_hours !== undefined) {
      updateData.max_weekly_hours = new Decimal(data.max_weekly_hours);
    }
    if (data.min_break_hours !== undefined) {
      updateData.min_break_hours = new Decimal(data.min_break_hours);
    }
    if (data.allow_overnight_shifts !== undefined) {
      updateData.allow_overnight_shifts = data.allow_overnight_shifts;
    }
    if (data.timezone !== undefined) {
      updateData.timezone = data.timezone;
    }

    // Upsert (update or create)
    const settings = await prisma.company_settings.upsert({
      where: { company_id },
      update: updateData,
      create: {
        company_id,
        ...DEFAULT_SETTINGS,
        ...updateData,
      },
    });

    // Invalidate cache
    this.invalidateCache(company_id);

    return settings;
  },

  /**
   * Get default settings (used for comparison or initialization)
   *
   * @returns Default settings object
   */
  getDefaultSettings() {
    return { ...DEFAULT_SETTINGS };
  },

  /**
   * Validate if a shift configuration is allowed by company settings
   * Used by shift.service.ts for business rule validation
   *
   * @param company_id - Company ID
   * @param shift_duration_hours - Duration of the shift in hours
   * @param is_overnight - Whether the shift spans midnight
   * @returns Validation result with error details
   */
  async validateShiftAgainstSettings(
    company_id: number,
    shift_duration_hours: number,
    is_overnight: boolean = false
  ): Promise<{ valid: boolean; error?: string }> {
    const settings = await this.getSettings(company_id);

    // Check overnight shifts
    if (is_overnight && !settings.allow_overnight_shifts) {
      return {
        valid: false,
        error: 'Overnight shifts are not allowed for this company',
      };
    }

    // Check max daily hours
    const maxDailyHours = parseFloat(settings.max_daily_hours.toString());
    if (shift_duration_hours > maxDailyHours) {
      return {
        valid: false,
        error: `Shift duration (${shift_duration_hours}h) exceeds company maximum of ${maxDailyHours}h per day`,
      };
    }

    return { valid: true };
  },

  /**
   * Validate if weekly hours are within company limits
   *
   * @param company_id - Company ID
   * @param weekly_hours - Total weekly hours
   * @returns Validation result with error details
   */
  async validateWeeklyHours(
    company_id: number,
    weekly_hours: number
  ): Promise<{ valid: boolean; error?: string }> {
    const settings = await this.getSettings(company_id);
    const maxWeeklyHours = parseFloat(settings.max_weekly_hours.toString());

    if (weekly_hours > maxWeeklyHours) {
      return {
        valid: false,
        error: `Total weekly hours (${weekly_hours}h) exceeds company maximum of ${maxWeeklyHours}h per week`,
      };
    }

    return { valid: true };
  },

  /**
   * Get minimum break hours between shifts
   *
   * @param company_id - Company ID
   * @returns Minimum break hours as number
   */
  async getMinBreakHours(company_id: number): Promise<number> {
    const settings = await this.getSettings(company_id);
    return parseFloat(settings.min_break_hours.toString());
  },

  /**
   * Generate cache key for company settings
   *
   * @param company_id - Company ID
   * @returns Cache key string
   */
  getCacheKey(company_id: number): string {
    return `company_settings:${company_id}`;
  },

  /**
   * Invalidate cache for a specific company
   *
   * @param company_id - Company ID
   */
  invalidateCache(company_id: number): void {
    const cacheKey = this.getCacheKey(company_id);
    cacheService.delete(cacheKey);
  },

  /**
   * Bulk invalidate cache for multiple companies
   *
   * @param company_ids - Array of company IDs
   */
  invalidateBulkCache(company_ids: number[]): void {
    company_ids.forEach(id => this.invalidateCache(id));
  },
};
