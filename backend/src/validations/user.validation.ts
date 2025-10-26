import { z } from 'zod';

// Create user schema
// Note: password will be hashed before storing as password_hash
export const create_user_schema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  is_active: z.boolean().optional().default(true),
});

// Update user schema (all fields optional)
// Note: password_hash is intentionally excluded - use a dedicated password change endpoint
export const update_user_schema = z.object({
  first_name: z.string().min(1, 'First name is required').optional(),
  last_name: z.string().min(1, 'Last name is required').optional(),
  email: z.string().email('Invalid email format').optional(),
  is_active: z.boolean().optional(),
});

// Query filters schema
export const user_filters_schema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  search: z.string().optional(),
  is_active: z.enum(['true', 'false']).optional(),
  sort_by: z.string().optional(),
  sort_order: z.enum(['asc', 'desc']).optional(),
});

// Bulk create schema
export const bulk_create_user_schema = z.object({
  items: z.array(create_user_schema).min(1).max(100),
});

// Bulk update schema
export const bulk_update_user_schema = z.object({
  ids: z.array(z.number().int()).min(1).max(100),
  data: update_user_schema,
});

// Bulk delete schema
export const bulk_delete_user_schema = z.object({
  ids: z.array(z.number().int()).min(1).max(100),
});

// Export types
export type create_user_body = z.infer<typeof create_user_schema>;
export type update_user_body = z.infer<typeof update_user_schema>;
export type user_filters = z.infer<typeof user_filters_schema>;
export type bulk_create_user_body = z.infer<typeof bulk_create_user_schema>;
export type bulk_update_user_body = z.infer<typeof bulk_update_user_schema>;
export type bulk_delete_user_body = z.infer<typeof bulk_delete_user_schema>;
