import { z } from 'zod';
import { validateTimeFormat } from '../utils/time.utils';

/**
 * Time schema for UTC time validation
 *
 * Enforces strict UTC-only time format:
 * - Format: HH:mm (24-hour, e.g., "14:30", "09:00")
 * - NO seconds, NO timezone indicators (Z, +00:00, etc.)
 * - Hours: 00-23
 * - Minutes: 00-59
 *
 * Backend ONLY accepts UTC times. Frontend handles timezone conversions.
 */
const timeSchema = z.string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Must be UTC time in HH:mm format (e.g., \"14:30\", \"09:00\")")
  .refine((time) => validateTimeFormat(time), {
    message: "Invalid UTC time format. Must be HH:mm without timezone information.",
  });

/**
 * Create shift_template schema
 *
 * Validates shift template creation with UTC time fields.
 * All times must be in UTC HH:mm format.
 */
export const create_shift_template_schema = z.object({
  company_id: z.number().int(),
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  start_time: timeSchema,
  end_time: timeSchema,
  usage_count: z.number().int().default(0),
  created_by: z.number().int().optional(),
}).refine((data) => data.start_time !== data.end_time, {
  message: "Start time and end time cannot be the same",
  path: ["end_time"],
});

/**
 * Update shift_template schema
 *
 * All fields optional for partial updates.
 * Times must still be in UTC HH:mm format if provided.
 */
export const update_shift_template_schema = z.object({
  company_id: z.number().int().optional(),
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  start_time: timeSchema.optional(),
  end_time: timeSchema.optional(),
  usage_count: z.number().int().optional(),
  created_by: z.number().int().optional(),
}).refine((data) => {
  // If both times are provided, ensure they are different
  if (data.start_time && data.end_time) {
    return data.start_time !== data.end_time;
  }
  return true;
}, {
  message: "Start time and end time cannot be the same",
  path: ["end_time"],
});

// Query filters schema
export const shift_template_filters_schema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  search: z.string().optional(),
  is_active: z.enum(['true', 'false']).optional(),
  sort_by: z.string().optional(),
  sort_order: z.enum(['asc', 'desc']).optional(),
});

// Bulk create schema
export const bulk_create_shift_template_schema = z.object({
  items: z.array(create_shift_template_schema).min(1).max(100),
});

// Bulk update schema
export const bulk_update_shift_template_schema = z.object({
  ids: z.array(z.number().int()).min(1).max(100),
  data: update_shift_template_schema,
});

// Bulk delete schema
export const bulk_delete_shift_template_schema = z.object({
  ids: z.array(z.number().int()).min(1).max(100),
});

// Export types
export type create_shift_template_body = z.infer<typeof create_shift_template_schema>;
export type update_shift_template_body = z.infer<typeof update_shift_template_schema>;
export type shift_template_filters = z.infer<typeof shift_template_filters_schema>;
export type bulk_create_shift_template_body = z.infer<typeof bulk_create_shift_template_schema>;
export type bulk_update_shift_template_body = z.infer<typeof bulk_update_shift_template_schema>;
export type bulk_delete_shift_template_body = z.infer<typeof bulk_delete_shift_template_schema>;
