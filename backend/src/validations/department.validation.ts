import { z } from 'zod';

// Create department schema
// Note: company_id is automatically set from authenticated user's company
export const create_department_schema = z.object({
  name: z.string().min(1, 'Department name is required'),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').default('#3B82F6'),
  is_active: z.boolean().default(true),
});

// Update department schema (all fields optional)
export const update_department_schema = z.object({
  name: z.string().min(1, 'Department name is required').optional(),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').optional(),
  is_active: z.boolean().optional(),
});

// Query filters schema
export const department_filters_schema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  search: z.string().optional(),
  is_active: z.enum(['true', 'false']).optional(),
  sort_by: z.string().optional(),
  sort_order: z.enum(['asc', 'desc']).optional(),
});

// Bulk create schema
export const bulk_create_department_schema = z.object({
  items: z.array(create_department_schema).min(1).max(100),
});

// Bulk update schema
export const bulk_update_department_schema = z.object({
  ids: z.array(z.number().int()).min(1).max(100),
  data: update_department_schema,
});

// Bulk delete schema
export const bulk_delete_department_schema = z.object({
  ids: z.array(z.number().int()).min(1).max(100),
});

// Export types
export type create_department_body = z.infer<typeof create_department_schema>;
export type update_department_body = z.infer<typeof update_department_schema>;
export type department_filters = z.infer<typeof department_filters_schema>;
export type bulk_create_department_body = z.infer<typeof bulk_create_department_schema>;
export type bulk_update_department_body = z.infer<typeof bulk_update_department_schema>;
export type bulk_delete_department_body = z.infer<typeof bulk_delete_department_schema>;
