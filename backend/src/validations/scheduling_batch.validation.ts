import { z } from 'zod';

// Create scheduling_batch schema
export const create_scheduling_batch_schema = z.object({
  location_id: z.number().int().positive('Location ID is required'),
  template_id: z.number().int().positive('Template ID is required'),
  period_type: z.string().min(1, 'Period type is required'),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be ISO date in YYYY-MM-DD format (e.g., \"2025-10-26\")"),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be ISO date in YYYY-MM-DD format (e.g., \"2025-10-26\")"),
  name: z.string().min(1, 'Name is required'),
});

// Update scheduling_batch schema (all fields optional)
export const update_scheduling_batch_schema = z.object({
  location_id: z.number().int().positive('Location ID is required').optional(),
  template_id: z.number().int().positive('Template ID is required').optional(),
  period_type: z.string().min(1, 'Period type is required').optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be ISO date in YYYY-MM-DD format (e.g., \"2025-10-26\")").optional(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be ISO date in YYYY-MM-DD format (e.g., \"2025-10-26\")").optional(),
  name: z.string().min(1, 'Name is required').optional(),
});

// Query filters schema
export const scheduling_batch_filters_schema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  search: z.string().optional(),
  is_active: z.enum(['true', 'false']).optional(),
  sort_by: z.string().optional(),
  sort_order: z.enum(['asc', 'desc']).optional(),
});

// Bulk create schema
export const bulk_create_scheduling_batch_schema = z.object({
  items: z.array(create_scheduling_batch_schema).min(1).max(100),
});

// Bulk update schema
export const bulk_update_scheduling_batch_schema = z.object({
  ids: z.array(z.number().int()).min(1).max(100),
  data: update_scheduling_batch_schema,
});

// Bulk delete schema
export const bulk_delete_scheduling_batch_schema = z.object({
  ids: z.array(z.number().int()).min(1).max(100),
});

// Export types
export type create_scheduling_batch_body = z.infer<typeof create_scheduling_batch_schema>;
export type update_scheduling_batch_body = z.infer<typeof update_scheduling_batch_schema>;
export type scheduling_batch_filters = z.infer<typeof scheduling_batch_filters_schema>;
export type bulk_create_scheduling_batch_body = z.infer<typeof bulk_create_scheduling_batch_schema>;
export type bulk_update_scheduling_batch_body = z.infer<typeof bulk_update_scheduling_batch_schema>;
export type bulk_delete_scheduling_batch_body = z.infer<typeof bulk_delete_scheduling_batch_schema>;
