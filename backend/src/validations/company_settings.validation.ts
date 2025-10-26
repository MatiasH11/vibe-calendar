import { z } from 'zod';

// Create company_settings schema
// Note: company_id is automatically set from authenticated user's company
export const create_company_settings_schema = z.object({
  max_daily_hours: z.number().positive('Must be positive').default(12.0),
  max_weekly_hours: z.number().positive('Must be positive').default(40.0),
  min_break_hours: z.number().nonnegative('Must be non-negative').default(11.0),
  allow_overnight_shifts: z.boolean().default(false),
  timezone: z.string().min(1, 'Timezone is required').default('UTC'),
});

// Update company_settings schema (all fields optional)
export const update_company_settings_schema = z.object({
  max_daily_hours: z.number().positive('Must be positive').optional(),
  max_weekly_hours: z.number().positive('Must be positive').optional(),
  min_break_hours: z.number().nonnegative('Must be non-negative').optional(),
  allow_overnight_shifts: z.boolean().optional(),
  timezone: z.string().min(1, 'Timezone is required').optional(),
});

// Query filters schema
// Note: company_settings is a simple entity with one record per company
export const company_settings_filters_schema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  sort_by: z.string().optional(),
  sort_order: z.enum(['asc', 'desc']).optional(),
});

// Bulk create schema
export const bulk_create_company_settings_schema = z.object({
  items: z.array(create_company_settings_schema).min(1).max(100),
});

// Bulk update schema
export const bulk_update_company_settings_schema = z.object({
  ids: z.array(z.number().int()).min(1).max(100),
  data: update_company_settings_schema,
});

// Bulk delete schema
export const bulk_delete_company_settings_schema = z.object({
  ids: z.array(z.number().int()).min(1).max(100),
});

// Export types
export type create_company_settings_body = z.infer<typeof create_company_settings_schema>;
export type update_company_settings_body = z.infer<typeof update_company_settings_schema>;
export type company_settings_filters = z.infer<typeof company_settings_filters_schema>;
export type bulk_create_company_settings_body = z.infer<typeof bulk_create_company_settings_schema>;
export type bulk_update_company_settings_body = z.infer<typeof bulk_update_company_settings_schema>;
export type bulk_delete_company_settings_body = z.infer<typeof bulk_delete_company_settings_schema>;
