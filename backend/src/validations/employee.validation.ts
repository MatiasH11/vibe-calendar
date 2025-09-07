import { z } from 'zod';

// Schema existente mantenido
export const add_employee_schema = z.object({
  email: z.string().email(),
  first_name: z.string().min(1),
  last_name: z.string().min(1), 
  role_id: z.number().positive(),
  position: z.string().optional(),
});

// NUEVO: Schema para filtros de empleados
export const employee_filters_schema = z.object({
  search: z.string().optional(),
  role_id: z.number().positive().optional(),
  is_active: z.boolean().optional(),
  user_id: z.number().positive().optional(),
  page: z.number().positive().default(1),
  limit: z.number().positive().max(100).default(10),
  sort_by: z.enum(['created_at', 'user.first_name', 'user.last_name', 'role.name']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
});

// NUEVO: Schema para actualizar empleado
export const update_employee_schema = z.object({
  role_id: z.number().positive().optional(),
  position: z.string().optional(),
  is_active: z.boolean().optional(),
});

export type AddEmployeeBody = z.infer<typeof add_employee_schema>;
export type EmployeeFiltersQuery = z.infer<typeof employee_filters_schema>;
export type UpdateEmployeeBody = z.infer<typeof update_employee_schema>;


