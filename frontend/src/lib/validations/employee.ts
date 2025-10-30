import { z } from 'zod';

/**
 * Backend employee creation schema
 * Note: Backend expects user_id (user must exist first)
 * For creating new users, use createUserSchema first, then create employee with returned user_id
 */
export const createEmployeeSchema = z.object({
  user_id: z.number().int().positive('User ID is required'),
  department_id: z.number().int().positive('Department ID is required'),
  company_role: z.enum(['OWNER', 'ADMIN', 'MANAGER', 'EMPLOYEE']).default('EMPLOYEE'),
  position: z.string().optional(),
  is_active: z.boolean().default(true),
});

/**
 * Schema for creating a new user (separate step before creating employee)
 */
export const createUserSchema = z.object({
  email: z.string().email('Email inválido'),
  first_name: z.string().min(2, 'Nombre debe tener al menos 2 caracteres'),
  last_name: z.string().min(2, 'Apellido debe tener al menos 2 caracteres'),
  password: z.string().min(6, 'Password debe tener al menos 6 caracteres'),
  user_type: z.enum(['SUPER_ADMIN', 'USER']).default('USER'),
});

/**
 * Combined schema for UI form that creates both user and employee
 * This will be split into two API calls: POST /user, then POST /employee
 */
export const createUserAndEmployeeSchema = z.object({
  // User fields
  email: z.string().email('Email inválido'),
  first_name: z.string().min(2, 'Nombre debe tener al menos 2 caracteres'),
  last_name: z.string().min(2, 'Apellido debe tener al menos 2 caracteres'),
  password: z.string().min(6, 'Password debe tener al menos 6 caracteres'),
  // Employee fields
  department_id: z.number().int().positive('Debe seleccionar un departamento'),
  company_role: z.enum(['OWNER', 'ADMIN', 'MANAGER', 'EMPLOYEE']).default('EMPLOYEE'),
  position: z.string().optional(),
  is_active: z.boolean().default(true),
});

export const updateEmployeeSchema = z.object({
  department_id: z.number().int().positive('Department ID must be valid').optional(),
  company_role: z.enum(['OWNER', 'ADMIN', 'MANAGER', 'EMPLOYEE']).optional(),
  position: z.string().optional(),
  is_active: z.boolean().optional(),
});

export const employeeFiltersSchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  search: z.string().optional(),
  is_active: z.enum(['true', 'false']).optional(),
  sort_by: z.string().optional(),
  sort_order: z.enum(['asc', 'desc']).optional(),
  include: z.enum(['shifts']).optional(),
  shift_start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  shift_end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  created_after: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  created_before: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  updated_after: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  updated_before: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export type CreateEmployeeFormData = z.infer<typeof createEmployeeSchema>;
export type CreateUserFormData = z.infer<typeof createUserSchema>;
export type CreateUserAndEmployeeFormData = z.infer<typeof createUserAndEmployeeSchema>;
export type UpdateEmployeeFormData = z.infer<typeof updateEmployeeSchema>;
export type EmployeeFiltersFormData = z.infer<typeof employeeFiltersSchema>;
