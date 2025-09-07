# 🔗 FASE 1: Tipos y API Client para Empleados

## 🎯 Objetivo
Crear tipos TypeScript específicos para empleados y extender el ApiClient con métodos CRUD para la gestión de empleados.

## 📝 PASO 1: Tipos de Empleados

### `src/types/employee.ts`
```typescript
export interface Employee {
  id: number;
  company_id: number;
  user_id: number;
  role_id: number;
  position?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  user: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  };
  role: {
    id: number;
    name: string;
    description?: string;
    color: string;
  };
}

export interface CreateEmployeeRequest {
  email: string;
  first_name: string;
  last_name: string;
  role_id: number;
  position?: string;
}

export interface UpdateEmployeeRequest {
  role_id?: number;
  position?: string;
  is_active?: boolean;
}

export interface EmployeeFilters {
  search?: string;
  role_id?: number;
  is_active?: boolean;
  page?: number;
  limit?: number;
}

export interface EmployeeListResponse {
  employees: Employee[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
```

## 🌐 PASO 2: Extender ApiClient

### Actualizar `src/lib/api.ts`
```typescript
// Agregar estos métodos a la clase ApiClient

async getEmployees(filters?: EmployeeFilters): Promise<ApiResponse<EmployeeListResponse>> {
  const params = new URLSearchParams();
  if (filters?.search) params.append('search', filters.search);
  if (filters?.role_id) params.append('role_id', filters.role_id.toString());
  if (filters?.is_active !== undefined) params.append('is_active', filters.is_active.toString());
  if (filters?.page) params.append('page', filters.page.toString());
  if (filters?.limit) params.append('limit', filters.limit.toString());
  
  const queryString = params.toString();
  const endpoint = `/api/v1/employees${queryString ? `?${queryString}` : ''}`;
  
  return this.request(endpoint);
}

async getEmployee(id: number): Promise<ApiResponse<Employee>> {
  return this.request(`/api/v1/employees/${id}`);
}

async createEmployee(data: CreateEmployeeRequest): Promise<ApiResponse<Employee>> {
  return this.request('/api/v1/employees', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

async updateEmployee(id: number, data: UpdateEmployeeRequest): Promise<ApiResponse<Employee>> {
  return this.request(`/api/v1/employees/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

async deleteEmployee(id: number): Promise<ApiResponse<void>> {
  return this.request(`/api/v1/employees/${id}`, {
    method: 'DELETE',
  });
}

async getRoles(): Promise<ApiResponse<Role[]>> {
  return this.request('/api/v1/roles');
}
```

## 🔧 PASO 3: Validaciones con Zod

### `src/lib/validations/employee.ts`
```typescript
import { z } from 'zod';

export const createEmployeeSchema = z.object({
  email: z.string().email('Email inválido'),
  first_name: z.string().min(2, 'Nombre debe tener al menos 2 caracteres'),
  last_name: z.string().min(2, 'Apellido debe tener al menos 2 caracteres'),
  role_id: z.number().positive('Debe seleccionar un rol'),
  position: z.string().optional(),
});

export const updateEmployeeSchema = z.object({
  role_id: z.number().positive('Debe seleccionar un rol').optional(),
  position: z.string().optional(),
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
```

## 📋 PASO 4: Constantes y Utilidades

### Actualizar `src/lib/constants.ts`
```typescript
// Agregar estas constantes

export const EMPLOYEE_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
} as const;

export const EMPLOYEE_STATUS_LABELS = {
  [EMPLOYEE_STATUS.ACTIVE]: 'Activo',
  [EMPLOYEE_STATUS.INACTIVE]: 'Inactivo',
} as const;

export const EMPLOYEE_STATUS_COLORS = {
  [EMPLOYEE_STATUS.ACTIVE]: 'bg-green-100 text-green-800',
  [EMPLOYEE_STATUS.INACTIVE]: 'bg-red-100 text-red-800',
} as const;

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
} as const;
```

## ✅ Validación de la Fase 1

```bash
# 1. Verificar que los archivos se crearon correctamente
ls src/types/employee.ts
ls src/lib/validations/employee.ts

# 2. OBLIGATORIO: Verificar que no hay errores de TypeScript
npm run build
# Si falla: DETENTE y corrige errores antes de continuar

# 3. Verificar que los métodos API estén disponibles
# En src/lib/api.ts debe existir: getEmployees, createEmployee, updateEmployee, deleteEmployee, getRoles
```

## 🎯 Resultado de la Fase 1

- ✅ **Tipos TypeScript** para empleados creados
- ✅ **ApiClient extendido** con métodos CRUD
- ✅ **Esquemas de validación** con Zod
- ✅ **Constantes** para estados y paginación
- ✅ **Build sin errores** de TypeScript

**No se crean componentes ni hooks** - Solo la base de tipos y API para la siguiente fase.
