import { z } from 'zod';
import { validateTimeFormat, validateDateFormat } from '../utils/time.utils';

/**
 * Date schema for ISO date validation
 *
 * Enforces strict ISO date format:
 * - Format: YYYY-MM-DD (e.g., "2025-10-26")
 * - NO time component, NO timezone indicators
 *
 * Backend ONLY accepts ISO dates. Frontend handles timezone conversions.
 */
const dateSchema = z.string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Must be ISO date in YYYY-MM-DD format (e.g., \"2025-10-26\")")
  .refine((date) => validateDateFormat(date), {
    message: "Invalid ISO date format. Must be YYYY-MM-DD.",
  });

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
 * Shift status enum
 *
 * Matches Prisma shift_status enum:
 * - draft: Shift is being planned
 * - confirmed: Shift is confirmed
 * - cancelled: Shift has been cancelled
 */
const shiftStatusEnum = z.enum(['draft', 'confirmed', 'cancelled']);

/**
 * Create shift schema
 *
 * Validates shift creation with UTC date and time fields.
 * All dates must be in ISO format, all times in UTC HH:mm format.
 */
export const create_shift_schema = z.object({
  employee_id: z.number().int().positive(),
  location_id: z.number().int().positive('Location ID is required'),
  shift_date: dateSchema,
  start_time: timeSchema,
  end_time: timeSchema,
  notes: z.string().optional(),
  status: shiftStatusEnum.optional().default('confirmed'),
}).refine((data) => data.start_time !== data.end_time, {
  message: "Start time and end time cannot be the same",
  path: ["end_time"],
});

/**
 * Update shift schema
 *
 * All fields optional for partial updates.
 * Dates and times must still be in proper formats if provided.
 */
export const update_shift_schema = z.object({
  employee_id: z.number().int().positive().optional(),
  shift_date: dateSchema.optional(),
  start_time: timeSchema.optional(),
  end_time: timeSchema.optional(),
  notes: z.string().optional(),
  status: shiftStatusEnum.optional(),
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
export const shift_filters_schema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  search: z.string().optional(),
  is_active: z.enum(['true', 'false']).optional(),
  sort_by: z.string().optional(),
  sort_order: z.enum(['asc', 'desc']).optional(),
  // Location filter (for gerentes to see shifts only for their location)
  location_id: z.string().optional(),
});

// Bulk create schema
export const bulk_create_shift_schema = z.object({
  items: z.array(create_shift_schema).min(1).max(100),
});

// Bulk update schema
export const bulk_update_shift_schema = z.object({
  ids: z.array(z.number().int()).min(1).max(100),
  data: update_shift_schema,
});

// Bulk delete schema
export const bulk_delete_shift_schema = z.object({
  ids: z.array(z.number().int()).min(1).max(100),
});

// Export types
export type create_shift_body = z.infer<typeof create_shift_schema>;
export type update_shift_body = z.infer<typeof update_shift_schema>;
export type shift_filters = z.infer<typeof shift_filters_schema>;
export type bulk_create_shift_body = z.infer<typeof bulk_create_shift_schema>;
export type bulk_update_shift_body = z.infer<typeof bulk_update_shift_schema>;
export type bulk_delete_shift_body = z.infer<typeof bulk_delete_shift_schema>;
