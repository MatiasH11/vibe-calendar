import { z } from 'zod';

// Create template_shift_position schema
export const create_template_shift_position_schema = z.object({
  required_count: z.number().int(),
});

// Update template_shift_position schema (all fields optional)
export const update_template_shift_position_schema = z.object({
  required_count: z.number().int().optional(),
});

// Query filters schema
export const template_shift_position_filters_schema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  search: z.string().optional(),
  is_active: z.enum(['true', 'false']).optional(),
  sort_by: z.string().optional(),
  sort_order: z.enum(['asc', 'desc']).optional(),
});

// Bulk create schema
export const bulk_create_template_shift_position_schema = z.object({
  items: z.array(create_template_shift_position_schema).min(1).max(100),
});

// Bulk update schema
export const bulk_update_template_shift_position_schema = z.object({
  ids: z.array(z.number().int()).min(1).max(100),
  data: update_template_shift_position_schema,
});

// Bulk delete schema
export const bulk_delete_template_shift_position_schema = z.object({
  ids: z.array(z.number().int()).min(1).max(100),
});

// Export types
export type create_template_shift_position_body = z.infer<typeof create_template_shift_position_schema>;
export type update_template_shift_position_body = z.infer<typeof update_template_shift_position_schema>;
export type template_shift_position_filters = z.infer<typeof template_shift_position_filters_schema>;
export type bulk_create_template_shift_position_body = z.infer<typeof bulk_create_template_shift_position_schema>;
export type bulk_update_template_shift_position_body = z.infer<typeof bulk_update_template_shift_position_schema>;
export type bulk_delete_template_shift_position_body = z.infer<typeof bulk_delete_template_shift_position_schema>;
