import { z } from 'zod';

// Create job_position schema
export const create_job_position_schema = z.object({
  name: z.string().min(1, 'Name is required'),
  department_id: z.number().int().positive('Department ID is required'),
  description: z.string().optional(),
  color: z.string().optional(),
  is_active: z.boolean().default(true),
});

// Update job_position schema (all fields optional)
export const update_job_position_schema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  department_id: z.number().int().positive('Department ID is required').optional(),
  description: z.string().optional(),
  color: z.string().optional(),
  is_active: z.boolean().optional(),
});

// Query filters schema
export const job_position_filters_schema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  search: z.string().optional(),
  is_active: z.enum(['true', 'false']).optional(),
  sort_by: z.string().optional(),
  sort_order: z.enum(['asc', 'desc']).optional(),
});

// Bulk create schema
export const bulk_create_job_position_schema = z.object({
  items: z.array(create_job_position_schema).min(1).max(100),
});

// Bulk update schema
export const bulk_update_job_position_schema = z.object({
  ids: z.array(z.number().int()).min(1).max(100),
  data: update_job_position_schema,
});

// Bulk delete schema
export const bulk_delete_job_position_schema = z.object({
  ids: z.array(z.number().int()).min(1).max(100),
});

// Export types
export type create_job_position_body = z.infer<typeof create_job_position_schema>;
export type update_job_position_body = z.infer<typeof update_job_position_schema>;
export type job_position_filters = z.infer<typeof job_position_filters_schema>;
export type bulk_create_job_position_body = z.infer<typeof bulk_create_job_position_schema>;
export type bulk_update_job_position_body = z.infer<typeof bulk_update_job_position_schema>;
export type bulk_delete_job_position_body = z.infer<typeof bulk_delete_job_position_schema>;
