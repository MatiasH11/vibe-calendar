import { z } from 'zod';

export const createDepartmentSchema = z.object({
  name: z.string()
    .min(2, 'Nombre debe tener al menos 2 caracteres')
    .max(50, 'Nombre no puede exceder 50 caracteres')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'Solo letras y espacios permitidos'),
  description: z.string()
    .max(200, 'Descripción no puede exceder 200 caracteres')
    .optional(),
  color: z.string()
    .regex(/^#[0-9A-F]{6}$/i, 'Color debe ser un código hexadecimal válido'),
});

export const updateDepartmentSchema = createDepartmentSchema.partial();

export const departmentQuickCreateSchema = z.object({
  name: z.string().min(2, 'Nombre requerido'),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Color inválido'),
});

export type CreateDepartmentFormData = z.infer<typeof createDepartmentSchema>;
export type UpdateDepartmentFormData = z.infer<typeof updateDepartmentSchema>;
export type DepartmentQuickCreateFormData = z.infer<typeof departmentQuickCreateSchema>;

// Colores predefinidos para departamentos
export const DEPARTMENT_COLORS = [
  { name: 'Azul', value: '#3B82F6', category: 'primary' },
  { name: 'Verde', value: '#10B981', category: 'success' },
  { name: 'Rojo', value: '#EF4444', category: 'danger' },
  { name: 'Naranja', value: '#F97316', category: 'warning' },
  { name: 'Púrpura', value: '#8B5CF6', category: 'info' },
  { name: 'Rosa', value: '#EC4899', category: 'accent' },
  { name: 'Cian', value: '#06B6D4', category: 'secondary' },
  { name: 'Lima', value: '#84CC16', category: 'nature' },
] as const;
