import { z } from 'zod';

// Create location schema
// Note: company_id is automatically set from authenticated user's company
export const create_location_schema = z.object({
  name: z.string().min(1, 'Location name is required'),
  address: z.string().optional(),
  city: z.string().optional(),
  phone: z.string().optional(),
});

// Update location schema (all fields optional)
export const update_location_schema = z.object({
  company_id: z.number().int().optional(),
  name: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  phone: z.string().optional(),
  is_active: z.boolean().optional(),
});

// Query filters schema
export const location_filters_schema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  search: z.string().optional(),
  is_active: z.enum(['true', 'false']).optional(),
  sort_by: z.string().optional(),
  sort_order: z.enum(['asc', 'desc']).optional(),
});

// Bulk create schema
export const bulk_create_location_schema = z.object({
  items: z.array(create_location_schema).min(1).max(100),
});

// Bulk update schema
export const bulk_update_location_schema = z.object({
  ids: z.array(z.number().int()).min(1).max(100),
  data: update_location_schema,
});

// Bulk delete schema
export const bulk_delete_location_schema = z.object({
  ids: z.array(z.number().int()).min(1).max(100),
});

// Export types
export type create_location_body = z.infer<typeof create_location_schema>;
export type update_location_body = z.infer<typeof update_location_schema>;
export type location_filters = z.infer<typeof location_filters_schema>;
export type bulk_create_location_body = z.infer<typeof bulk_create_location_schema>;
export type bulk_update_location_body = z.infer<typeof bulk_update_location_schema>;
export type bulk_delete_location_body = z.infer<typeof bulk_delete_location_schema>;
