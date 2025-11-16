/**
 * Validation schemas bridge - Re-exports backend Zod schemas
 * This creates a single source of truth for validation across frontend and backend
 */

import { z } from 'zod';

// ============================================================================
// SHIFT ASSIGNMENT SCHEMAS (Phase 1 - New Entity)
// ============================================================================

export const createShiftAssignmentSchema = z.object({
  location_id: z.number().int(),
  employee_id: z.number().int(),
  job_position_id: z.number().int(),
  template_shift_id: z.number().int().optional(),
  shift_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be ISO date in YYYY-MM-DD format (e.g., \"2025-10-26\")"),
  start_time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Must be UTC time in HH:mm format (e.g., \"14:30\", \"09:00\")"),
  end_time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Must be UTC time in HH:mm format (e.g., \"14:30\", \"09:00\")"),
  notes: z.string().optional(),
  assigned_by: z.number().int().optional(),
  confirmed_by: z.number().int().optional(),
  confirmed_at: z.string().datetime().optional(),
});

export const updateShiftAssignmentSchema = z.object({
  location_id: z.number().int().optional(),
  employee_id: z.number().int().optional(),
  job_position_id: z.number().int().optional(),
  template_shift_id: z.number().int().optional(),
  shift_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be ISO date in YYYY-MM-DD format (e.g., \"2025-10-26\")").optional(),
  start_time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Must be UTC time in HH:mm format (e.g., \"14:30\", \"09:00\")").optional(),
  end_time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Must be UTC time in HH:mm format (e.g., \"14:30\", \"09:00\")").optional(),
  notes: z.string().optional(),
  assigned_by: z.number().int().optional(),
  confirmed_by: z.number().int().optional(),
  confirmed_at: z.string().datetime().optional(),
});

export const shiftAssignmentFiltersSchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  search: z.string().optional(),
  status: z.enum(['pending', 'confirmed', 'cancelled']).optional(),
  employee_id: z.string().optional(),
  location_id: z.string().optional(),
  shift_date: z.string().optional(),
  sort_by: z.string().optional(),
  sort_order: z.enum(['asc', 'desc']).optional(),
});

export const bulkCreateShiftAssignmentSchema = z.object({
  items: z.array(createShiftAssignmentSchema).min(1).max(100),
});

export const bulkUpdateShiftAssignmentSchema = z.object({
  ids: z.array(z.number().int()).min(1).max(100),
  data: updateShiftAssignmentSchema,
});

export const bulkDeleteShiftAssignmentSchema = z.object({
  ids: z.array(z.number().int()).min(1).max(100),
});

// ============================================================================
// DAY TEMPLATE SCHEMAS (Phase 1 - New Entity)
// ============================================================================

export const createDayTemplateSchema = z.object({
  company_id: z.number().int(),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  is_active: z.boolean(),
  created_by: z.number().int().optional(),
});

export const updateDayTemplateSchema = z.object({
  company_id: z.number().int().optional(),
  name: z.string().min(1, "Name is required").optional(),
  description: z.string().optional(),
  is_active: z.boolean().optional(),
  created_by: z.number().int().optional(),
});

export const dayTemplateFiltersSchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  search: z.string().optional(),
  is_active: z.enum(['true', 'false']).optional(),
  sort_by: z.string().optional(),
  sort_order: z.enum(['asc', 'desc']).optional(),
});

export const bulkCreateDayTemplateSchema = z.object({
  items: z.array(createDayTemplateSchema).min(1).max(100),
});

// ============================================================================
// TEMPLATE SHIFT SCHEMAS (Phase 1 - New Entity)
// ============================================================================

export const createTemplateShiftSchema = z.object({
  day_template_id: z.number().int(),
  name: z.string().optional(),
  start_time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Must be UTC time in HH:mm format (e.g., \"14:30\", \"09:00\")"),
  end_time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Must be UTC time in HH:mm format (e.g., \"14:30\", \"09:00\")"),
  color: z.string().optional(),
  sort_order: z.number().int().optional(),
});

export const updateTemplateShiftSchema = z.object({
  day_template_id: z.number().int().optional(),
  name: z.string().optional(),
  start_time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Must be UTC time in HH:mm format (e.g., \"14:30\", \"09:00\")").optional(),
  end_time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Must be UTC time in HH:mm format (e.g., \"14:30\", \"09:00\")").optional(),
  color: z.string().optional(),
  sort_order: z.number().int().optional(),
});

// ============================================================================
// COMMON SCHEMAS (Used across entities)
// ============================================================================

// Pagination schema
export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

// Sort schema
export const sortSchema = z.object({
  sort_by: z.string().optional(),
  sort_order: z.enum(['asc', 'desc']).default('asc'),
});

// Date range schema
export const dateRangeSchema = z.object({
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

// Time range schema (UTC HH:mm format)
export const timeRangeSchema = z.object({
  start_time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  end_time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
});

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validate shift time range (end_time must be after start_time)
 */
export const validateTimeRange = (data: { start_time: string; end_time: string }) => {
  const [startHour, startMin] = data.start_time.split(':').map(Number);
  const [endHour, endMin] = data.end_time.split(':').map(Number);

  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;

  if (endMinutes <= startMinutes) {
    throw new Error('End time must be after start time');
  }

  return true;
};

/**
 * Validate date range (end_date must be after start_date)
 */
export const validateDateRange = (data: { start_date: string; end_date: string }) => {
  const startDate = new Date(data.start_date);
  const endDate = new Date(data.end_date);

  if (endDate <= startDate) {
    throw new Error('End date must be after start date');
  }

  return true;
};
