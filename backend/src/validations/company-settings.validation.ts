import { z } from 'zod';

/**
 * Validation schemas for company settings endpoints (PLAN.md 5.3)
 * Ensures business rules are valid and reasonable
 */

/**
 * Schema for updating company settings
 * All fields are optional to allow partial updates
 */
export const update_company_settings_schema = z.object({
  max_daily_hours: z.number()
    .positive({ message: 'max_daily_hours must be greater than 0' })
    .max(24, { message: 'max_daily_hours cannot exceed 24 hours' })
    .optional(),

  max_weekly_hours: z.number()
    .positive({ message: 'max_weekly_hours must be greater than 0' })
    .max(168, { message: 'max_weekly_hours cannot exceed 168 hours (7 days * 24 hours)' })
    .optional(),

  min_break_hours: z.number()
    .nonnegative({ message: 'min_break_hours must be 0 or greater' })
    .max(24, { message: 'min_break_hours cannot exceed 24 hours' })
    .optional(),

  allow_overnight_shifts: z.boolean().optional(),

  timezone: z.string()
    .min(1, { message: 'timezone cannot be empty' })
    .max(50, { message: 'timezone cannot exceed 50 characters' })
    .regex(/^[A-Za-z_]+\/[A-Za-z_]+$/, {
      message: 'timezone must be in IANA format (e.g., "America/New_York", "Europe/London", "UTC")'
    })
    .optional(),
}).refine(
  (data) => {
    // Validate that max_daily_hours doesn't exceed max_weekly_hours if both are provided
    if (data.max_daily_hours !== undefined && data.max_weekly_hours !== undefined) {
      return data.max_daily_hours <= data.max_weekly_hours;
    }
    return true;
  },
  {
    message: 'max_daily_hours cannot exceed max_weekly_hours',
    path: ['max_daily_hours'],
  }
);

/**
 * Schema for getting company settings (query params)
 * No parameters required for GET
 */
export const get_company_settings_schema = z.object({
  // Future: could add options like include_defaults, etc.
});
