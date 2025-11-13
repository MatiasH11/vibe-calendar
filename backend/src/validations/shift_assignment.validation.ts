import { z } from 'zod';

// Create shift_assignment schema
export const create_shift_assignment_schema = z.object({
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

// Update shift_assignment schema (all fields optional)
export const update_shift_assignment_schema = z.object({
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

// Query filters schema
export const shift_assignment_filters_schema = z.object({
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

// Bulk create schema
export const bulk_create_shift_assignment_schema = z.object({
  items: z.array(create_shift_assignment_schema).min(1).max(100),
});

// Bulk update schema
export const bulk_update_shift_assignment_schema = z.object({
  ids: z.array(z.number().int()).min(1).max(100),
  data: update_shift_assignment_schema,
});

// Bulk delete schema
export const bulk_delete_shift_assignment_schema = z.object({
  ids: z.array(z.number().int()).min(1).max(100),
});

// Export types
export type create_shift_assignment_body = z.infer<typeof create_shift_assignment_schema>;
export type update_shift_assignment_body = z.infer<typeof update_shift_assignment_schema>;
export type shift_assignment_filters = z.infer<typeof shift_assignment_filters_schema>;
export type bulk_create_shift_assignment_body = z.infer<typeof bulk_create_shift_assignment_schema>;
export type bulk_update_shift_assignment_body = z.infer<typeof bulk_update_shift_assignment_schema>;
export type bulk_delete_shift_assignment_body = z.infer<typeof bulk_delete_shift_assignment_schema>;
