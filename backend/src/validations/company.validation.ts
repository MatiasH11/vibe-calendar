import { z } from 'zod';

// Create company schema
export const create_company_schema = z.object({
  name: z.string().min(1, 'Name is required'),
  business_name: z.string().optional(),
  email: z.string().email('Invalid email format'),
  phone: z.string().optional(),
  is_active: z.boolean().optional(),
});

// Update company schema (all fields optional)
export const update_company_schema = z.object({
  name: z.string().optional(),
  business_name: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  is_active: z.boolean().optional(),
});

// Query filters schema
export const company_filters_schema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  search: z.string().optional(),
  is_active: z.enum(['true', 'false']).optional(),
  sort_by: z.string().optional(),
  sort_order: z.enum(['asc', 'desc']).optional(),
});

// Bulk create schema
export const bulk_create_company_schema = z.object({
  items: z.array(create_company_schema).min(1).max(100),
});

// Bulk update schema
export const bulk_update_company_schema = z.object({
  ids: z.array(z.number().int()).min(1).max(100),
  data: update_company_schema,
});

// Bulk delete schema
export const bulk_delete_company_schema = z.object({
  ids: z.array(z.number().int()).min(1).max(100),
});

// Export types
export type create_company_body = z.infer<typeof create_company_schema>;
export type update_company_body = z.infer<typeof update_company_schema>;
export type company_filters = z.infer<typeof company_filters_schema>;
export type bulk_create_company_body = z.infer<typeof bulk_create_company_schema>;
export type bulk_update_company_body = z.infer<typeof bulk_update_company_schema>;
export type bulk_delete_company_body = z.infer<typeof bulk_delete_company_schema>;
