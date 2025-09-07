import { z } from 'zod';

// Schema existente mantenido
export const create_role_schema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).default('#FFFFFF'),
});

// NUEVO: Schema para filtros de roles
export const role_filters_schema = z.object({
  search: z.string().optional(),
  include: z.enum(['stats', 'employees']).optional(),
  page: z.number().positive().default(1),
  limit: z.number().positive().max(100).default(50),
  sort_by: z.enum(['created_at', 'name', 'employee_count']).default('name'),
  sort_order: z.enum(['asc', 'desc']).default('asc'),
});

// NUEVO: Schema para actualizar rol
export const update_role_schema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
});

export type CreateRoleBody = z.infer<typeof create_role_schema>;
export type RoleFiltersQuery = z.infer<typeof role_filters_schema>;
export type UpdateRoleBody = z.infer<typeof update_role_schema>;


