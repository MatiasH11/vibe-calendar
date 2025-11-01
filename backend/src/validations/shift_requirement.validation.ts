import { z } from 'zod';

// Create shift_requirement schema
export const create_shift_requirement_schema = z.object({
  location_id: z.number().int().positive('Location ID is required'),
  department_id: z.number().int().positive('Department ID is required'),
  shift_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be ISO date in YYYY-MM-DD format (e.g., \"2025-10-26\")"),
  start_time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Must be UTC time in HH:mm format (e.g., \"14:30\", \"09:00\")"),
  end_time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Must be UTC time in HH:mm format (e.g., \"14:30\", \"09:00\")"),
  notes: z.string().optional(),
});

// Update shift_requirement schema (all fields optional)
export const update_shift_requirement_schema = z.object({
  location_id: z.number().int().positive('Location ID is required').optional(),
  department_id: z.number().int().positive('Department ID is required').optional(),
  shift_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be ISO date in YYYY-MM-DD format (e.g., \"2025-10-26\")").optional(),
  start_time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Must be UTC time in HH:mm format (e.g., \"14:30\", \"09:00\")").optional(),
  end_time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Must be UTC time in HH:mm format (e.g., \"14:30\", \"09:00\")").optional(),
  notes: z.string().optional(),
});

// Query filters schema
export const shift_requirement_filters_schema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  search: z.string().optional(),
  is_active: z.enum(['true', 'false']).optional(),
  sort_by: z.string().optional(),
  sort_order: z.enum(['asc', 'desc']).optional(),
});

// Bulk create schema
export const bulk_create_shift_requirement_schema = z.object({
  items: z.array(create_shift_requirement_schema).min(1).max(100),
});

// Bulk update schema
export const bulk_update_shift_requirement_schema = z.object({
  ids: z.array(z.number().int()).min(1).max(100),
  data: update_shift_requirement_schema,
});

// Bulk delete schema
export const bulk_delete_shift_requirement_schema = z.object({
  ids: z.array(z.number().int()).min(1).max(100),
});

// Export types
export type create_shift_requirement_body = z.infer<typeof create_shift_requirement_schema>;
export type update_shift_requirement_body = z.infer<typeof update_shift_requirement_schema>;
export type shift_requirement_filters = z.infer<typeof shift_requirement_filters_schema>;
export type bulk_create_shift_requirement_body = z.infer<typeof bulk_create_shift_requirement_schema>;
export type bulk_update_shift_requirement_body = z.infer<typeof bulk_update_shift_requirement_schema>;
export type bulk_delete_shift_requirement_body = z.infer<typeof bulk_delete_shift_requirement_schema>;
