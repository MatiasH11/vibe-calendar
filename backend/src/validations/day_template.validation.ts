import { z } from 'zod';

// Create day_template schema
export const create_day_template_schema = z.object({
  company_id: z.number().int(),
  name: z.string(),
  description: z.string().optional(),
  is_active: z.boolean(),
  created_by: z.number().int().optional(),
});

// Update day_template schema (all fields optional)
export const update_day_template_schema = z.object({
  company_id: z.number().int().optional(),
  name: z.string().optional(),
  description: z.string().optional(),
  is_active: z.boolean().optional(),
  created_by: z.number().int().optional(),
});

// Query filters schema
export const day_template_filters_schema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  search: z.string().optional(),
  is_active: z.enum(['true', 'false']).optional(),
  sort_by: z.string().optional(),
  sort_order: z.enum(['asc', 'desc']).optional(),
});

// Bulk create schema
export const bulk_create_day_template_schema = z.object({
  items: z.array(create_day_template_schema).min(1).max(100),
});

// Bulk update schema
export const bulk_update_day_template_schema = z.object({
  ids: z.array(z.number().int()).min(1).max(100),
  data: update_day_template_schema,
});

// Bulk delete schema
export const bulk_delete_day_template_schema = z.object({
  ids: z.array(z.number().int()).min(1).max(100),
});

// Export types
export type create_day_template_body = z.infer<typeof create_day_template_schema>;
export type update_day_template_body = z.infer<typeof update_day_template_schema>;
export type day_template_filters = z.infer<typeof day_template_filters_schema>;
export type bulk_create_day_template_body = z.infer<typeof bulk_create_day_template_schema>;
export type bulk_update_day_template_body = z.infer<typeof bulk_update_day_template_schema>;
export type bulk_delete_day_template_body = z.infer<typeof bulk_delete_day_template_schema>;
