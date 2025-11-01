import { z } from 'zod';
import { validateDateFormat } from '../utils/time.utils';

/**
 * Date schema for ISO date validation
 *
 * Enforces strict ISO date format:
 * - Format: YYYY-MM-DD (e.g., "2025-10-26")
 * - NO time component, NO timezone indicators
 *
 * Backend ONLY accepts ISO dates. Frontend handles timezone conversions.
 */
const dateSchema = z.string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Must be ISO date in YYYY-MM-DD format (e.g., \"2025-10-26\")")
  .refine((date) => validateDateFormat(date), {
    message: "Invalid ISO date format. Must be YYYY-MM-DD.",
  });

// Create employee schema
// Note: company_id is automatically set from authenticated user's company
export const create_employee_schema = z.object({
  user_id: z.number().int().positive('User ID is required'),
  location_id: z.number().int().positive('Location ID is required'),
  department_id: z.number().int().positive('Department ID is required'),
  company_role: z.enum(['OWNER', 'ADMIN', 'MANAGER', 'EMPLOYEE']).default('EMPLOYEE'),
  position: z.string().optional(),
  is_active: z.boolean().default(true),
});

// Update employee schema (all fields optional)
export const update_employee_schema = z.object({
  department_id: z.number().int().positive('Department ID must be valid').optional(),
  company_role: z.enum(['OWNER', 'ADMIN', 'MANAGER', 'EMPLOYEE']).optional(),
  position: z.string().optional(),
  is_active: z.boolean().optional(),
});

// Query filters schema
export const employee_filters_schema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  search: z.string().optional(),
  is_active: z.enum(['true', 'false']).optional(),
  sort_by: z.string().optional(),
  sort_order: z.enum(['asc', 'desc']).optional(),
  // Location filter (for gerentes to see only their location employees)
  location_id: z.string().optional(),
  // Include related resources
  include: z.enum(['shifts']).optional(),
  // Shift date filters (only used when include=shifts)
  shift_start_date: dateSchema.optional(),
  shift_end_date: dateSchema.optional(),
  // Employee date filters (filter which employees are returned)
  created_after: dateSchema.optional(),
  created_before: dateSchema.optional(),
  updated_after: dateSchema.optional(),
  updated_before: dateSchema.optional(),
});

// Bulk create schema
export const bulk_create_employee_schema = z.object({
  items: z.array(create_employee_schema).min(1).max(100),
});

// Bulk update schema
export const bulk_update_employee_schema = z.object({
  ids: z.array(z.number().int()).min(1).max(100),
  data: update_employee_schema,
});

// Bulk delete schema
export const bulk_delete_employee_schema = z.object({
  ids: z.array(z.number().int()).min(1).max(100),
});

// Export types
export type create_employee_body = z.infer<typeof create_employee_schema>;
export type update_employee_body = z.infer<typeof update_employee_schema>;
export type employee_filters = z.infer<typeof employee_filters_schema>;
export type bulk_create_employee_body = z.infer<typeof bulk_create_employee_schema>;
export type bulk_update_employee_body = z.infer<typeof bulk_update_employee_schema>;
export type bulk_delete_employee_body = z.infer<typeof bulk_delete_employee_schema>;
