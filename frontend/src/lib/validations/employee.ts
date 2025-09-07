import { z } from 'zod';

export const createEmployeeSchema = z.object({
  email: z.string().email('Email inválido'),
  first_name: z.string().min(2, 'Nombre debe tener al menos 2 caracteres'),
  last_name: z.string().min(2, 'Apellido debe tener al menos 2 caracteres'),
  role_id: z.number().positive('Debe seleccionar un rol'),
});

export const updateEmployeeSchema = z.object({
  role_id: z.number().positive('Debe seleccionar un rol').optional(),
  is_active: z.boolean().optional(),
});

export const employeeFiltersSchema = z.object({
  search: z.string().optional(),
  role_id: z.number().positive().optional(),
  is_active: z.boolean().optional(),
  page: z.number().positive().optional(),
  limit: z.number().positive().max(100).optional(),
});

export type CreateEmployeeFormData = z.infer<typeof createEmployeeSchema>;
export type UpdateEmployeeFormData = z.infer<typeof updateEmployeeSchema>;
export type EmployeeFiltersFormData = z.infer<typeof employeeFiltersSchema>;
