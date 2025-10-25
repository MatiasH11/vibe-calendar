import { z } from 'zod';

export const add_employee_schema = z.object({
  email: z.string().email(),
  first_name: z.string(),
  last_name: z.string(),
  role_id: z.number(),
  position: z.string(),
});

export type AddEmployeeBody = z.infer<typeof add_employee_schema>;

export const employee_filters_schema = z.object({
  search: z.string().optional(),
  role_id: z.number().optional(),
  is_active: z.boolean().optional(),
  user_id: z.number().optional(),
  page: z.number().default(1),
  limit: z.number().default(10),
  sort_by: z.string().default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
});

export type EmployeeFiltersQuery = z.infer<typeof employee_filters_schema>;

export const update_employee_schema = z.object({
  role_id: z.number().optional(),
  position: z.string().optional(),
  is_active: z.boolean().optional(),
});

export type UpdateEmployeeBody = z.infer<typeof update_employee_schema>;

export const bulk_update_employees_schema = z.object({
  employee_ids: z.array(z.number().int().positive()).min(1),
  action: z.enum(['activate', 'deactivate', 'change_role']),
  role_id: z.number().int().positive().optional(),
}).refine((data) => {
  if (data.action === 'change_role') {
    return data.role_id !== undefined;
  }
  return true;
}, {
  message: "role_id is required when action is 'change_role'",
  path: ["role_id"],
});

export type BulkUpdateEmployeesBody = z.infer<typeof bulk_update_employees_schema>;