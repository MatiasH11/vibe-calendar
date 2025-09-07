# 🔍 FASE 1: Filtros y Búsqueda Avanzada

## 🎯 Objetivo
Implementar filtros avanzados de búsqueda para empleados y roles que soporten múltiples criterios, búsqueda de texto y filtros combinados, manteniendo performance óptimo.

## 📝 PASO 1: Actualizar Validaciones de Empleados

### `src/validations/employee.validation.ts`
Agregar schemas para filtros avanzados:

```typescript
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
```

## 📝 PASO 2: Actualizar Validaciones de Roles

### `src/validations/role.validation.ts`
```typescript
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
```

## 📝 PASO 3: Middleware de Validación de Query Params

### `src/middlewares/validation_middleware.ts`
Extender middleware existente:

```typescript
import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { HTTP_CODES } from '../constants/http_codes';

// Middleware existente mantenido
export const validate_body = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(HTTP_CODES.BAD_REQUEST).json({
          success: false,
          error: {
            error_code: 'VALIDATION_ERROR',
            message: 'Invalid request body',
            details: error.errors,
          },
        });
      }
      next(error);
    }
  };
};

// NUEVO: Middleware para validar query parameters
export const validate_query = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Convertir string query params a tipos correctos
      const queryParams = { ...req.query };
      
      // Convertir strings a números donde sea necesario
      if (queryParams.page && typeof queryParams.page === 'string') {
        queryParams.page = parseInt(queryParams.page);
      }
      if (queryParams.limit && typeof queryParams.limit === 'string') {
        queryParams.limit = parseInt(queryParams.limit);
      }
      if (queryParams.role_id && typeof queryParams.role_id === 'string') {
        queryParams.role_id = parseInt(queryParams.role_id);
      }
      if (queryParams.user_id && typeof queryParams.user_id === 'string') {
        queryParams.user_id = parseInt(queryParams.user_id);
      }
      if (queryParams.is_active && typeof queryParams.is_active === 'string') {
        queryParams.is_active = queryParams.is_active === 'true';
      }
      
      req.query = schema.parse(queryParams);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(HTTP_CODES.BAD_REQUEST).json({
          success: false,
          error: {
            error_code: 'VALIDATION_ERROR',
            message: 'Invalid query parameters',
            details: error.errors,
          },
        });
      }
      next(error);
    }
  };
};
```

## 📝 PASO 4: Servicio de Empleados Avanzado

### `src/services/employee.service.ts`
Expandir servicio existente:

```typescript
import { prisma } from '../config/prisma_client';
import { AddEmployeeBody, EmployeeFiltersQuery, UpdateEmployeeBody } from '../validations/employee.validation';
import bcrypt from 'bcryptjs';
import { AUTH_CONSTANTS } from '../constants/auth';
import crypto from 'crypto';
import { Prisma } from '@prisma/client';

export const employee_service = {
  // Método existente mantenido
  async add(data: AddEmployeeBody, company_id: number) {
    // ... código existente sin cambios
    const role = await prisma.role.findFirst({ where: { id: data.role_id, company_id } });
    if (!role) {
      throw new Error('UNAUTHORIZED_COMPANY_ACCESS');
    }

    return prisma.$transaction(async (tx) => {
      let user = await tx.user.findUnique({ where: { email: data.email } });
      if (!user) {
        const tempPassword = crypto.randomBytes(16).toString('hex');
        const password_hash = await bcrypt.hash(tempPassword, AUTH_CONSTANTS.BCRYPT_SALT_ROUNDS);
        user = await tx.user.create({
          data: {
            first_name: data.first_name,
            last_name: data.last_name,
            email: data.email,
            password_hash,
          },
        });
      }

      const existing = await tx.company_employee.findFirst({ 
        where: { company_id, user_id: user.id, deleted_at: null } 
      });
      if (existing) {
        throw new Error('EMPLOYEE_ALREADY_EXISTS');
      }

      const employee = await tx.company_employee.create({
        data: {
          company_id,
          user_id: user.id,
          role_id: data.role_id,
          position: data.position,
          is_active: true,
        },
        include: { user: true, role: true },
      });

      return employee;
    });
  },

  // NUEVO: Método de búsqueda avanzada
  async findByCompanyWithFilters(company_id: number, filters: EmployeeFiltersQuery) {
    // Construir condiciones WHERE dinámicamente
    const whereConditions: Prisma.company_employeeWhereInput = {
      company_id,
      deleted_at: null,
    };

    // Filtro por rol
    if (filters.role_id) {
      whereConditions.role_id = filters.role_id;
    }

    // Filtro por estado activo
    if (filters.is_active !== undefined) {
      whereConditions.is_active = filters.is_active;
    }

    // Filtro por usuario específico
    if (filters.user_id) {
      whereConditions.user_id = filters.user_id;
    }

    // Filtro de búsqueda de texto
    if (filters.search && filters.search.trim()) {
      const searchTerm = filters.search.trim();
      whereConditions.OR = [
        {
          user: {
            first_name: {
              contains: searchTerm,
              mode: 'insensitive',
            },
          },
        },
        {
          user: {
            last_name: {
              contains: searchTerm,
              mode: 'insensitive',
            },
          },
        },
        {
          user: {
            email: {
              contains: searchTerm,
              mode: 'insensitive',
            },
          },
        },
        {
          role: {
            name: {
              contains: searchTerm,
              mode: 'insensitive',
            },
          },
        },
        {
          position: {
            contains: searchTerm,
            mode: 'insensitive',
          },
        },
      ];
    }

    // Construir ordenamiento
    const orderBy: Prisma.company_employeeOrderByWithRelationInput = {};
    switch (filters.sort_by) {
      case 'user.first_name':
        orderBy.user = { first_name: filters.sort_order };
        break;
      case 'user.last_name':
        orderBy.user = { last_name: filters.sort_order };
        break;
      case 'role.name':
        orderBy.role = { name: filters.sort_order };
        break;
      case 'created_at':
      default:
        orderBy.created_at = filters.sort_order;
        break;
    }

    // Calcular offset para paginación
    const offset = (filters.page - 1) * filters.limit;

    // Ejecutar consultas en paralelo
    const [employees, total] = await Promise.all([
      prisma.company_employee.findMany({
        where: whereConditions,
        include: { 
          user: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              email: true,
            }
          }, 
          role: {
            select: {
              id: true,
              name: true,
              description: true,
              color: true,
            }
          } 
        },
        orderBy,
        skip: offset,
        take: filters.limit,
      }),
      prisma.company_employee.count({
        where: whereConditions,
      }),
    ]);

    // Calcular metadata de paginación
    const totalPages = Math.ceil(total / filters.limit);

    return {
      employees,
      pagination: {
        total,
        page: filters.page,
        limit: filters.limit,
        totalPages,
        hasNext: filters.page < totalPages,
        hasPrev: filters.page > 1,
      },
    };
  },

  // Método simple existente mantenido para compatibilidad
  async findByCompany(company_id: number) {
    return prisma.company_employee.findMany({
      where: { company_id, deleted_at: null },
      include: { user: true, role: true },
      orderBy: { created_at: 'desc' },
    });
  },

  // NUEVO: Obtener empleado por ID
  async findById(id: number, company_id: number) {
    const employee = await prisma.company_employee.findFirst({
      where: { 
        id, 
        company_id, 
        deleted_at: null 
      },
      include: { 
        user: true, 
        role: true 
      },
    });

    if (!employee) {
      throw new Error('EMPLOYEE_NOT_FOUND');
    }

    return employee;
  },

  // NUEVO: Actualizar empleado
  async update(id: number, data: UpdateEmployeeBody, company_id: number) {
    // Verificar que el empleado existe y pertenece a la empresa
    const existingEmployee = await prisma.company_employee.findFirst({
      where: { 
        id, 
        company_id, 
        deleted_at: null 
      },
    });

    if (!existingEmployee) {
      throw new Error('EMPLOYEE_NOT_FOUND');
    }

    // Si se cambia el rol, verificar que pertenece a la empresa
    if (data.role_id) {
      const role = await prisma.role.findFirst({ 
        where: { id: data.role_id, company_id } 
      });
      if (!role) {
        throw new Error('UNAUTHORIZED_COMPANY_ACCESS');
      }
    }

    // Actualizar empleado
    const updatedEmployee = await prisma.company_employee.update({
      where: { id },
      data: {
        ...data,
        updated_at: new Date(),
      },
      include: { 
        user: true, 
        role: true 
      },
    });

    return updatedEmployee;
  },

  // NUEVO: Eliminar empleado (soft delete)
  async softDelete(id: number, company_id: number) {
    // Verificar que el empleado existe y pertenece a la empresa
    const existingEmployee = await prisma.company_employee.findFirst({
      where: { 
        id, 
        company_id, 
        deleted_at: null 
      },
    });

    if (!existingEmployee) {
      throw new Error('EMPLOYEE_NOT_FOUND');
    }

    // Soft delete
    await prisma.company_employee.update({
      where: { id },
      data: {
        deleted_at: new Date(),
        is_active: false, // También desactivar
      },
    });

    return { success: true };
  },
};
```

## 📝 PASO 5: Actualizar Controller de Empleados

### `src/controllers/employee.controller.ts`
Expandir controller existente:

```typescript
import { Request, Response, NextFunction } from 'express';
import { AddEmployeeBody, EmployeeFiltersQuery, UpdateEmployeeBody } from '../validations/employee.validation';
import { employee_service } from '../services/employee.service';
import { HTTP_CODES } from '../constants/http_codes';

// Handler existente mantenido
export const addEmployeeHandler = async (
  req: Request<{}, {}, AddEmployeeBody>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const company_id = req.user!.company_id;
    const employee = await employee_service.add(req.body, company_id);
    return res.status(HTTP_CODES.CREATED).json({ success: true, data: employee });
  } catch (error: any) {
    if (error?.message === 'UNAUTHORIZED_COMPANY_ACCESS') {
      return res.status(HTTP_CODES.FORBIDDEN).json({ 
        success: false, 
        error: { error_code: 'UNAUTHORIZED_COMPANY_ACCESS', message: 'Role does not belong to your company' } 
      });
    }
    if (error?.message === 'EMPLOYEE_ALREADY_EXISTS') {
      return res.status(HTTP_CODES.CONFLICT).json({ 
        success: false, 
        error: { error_code: 'EMPLOYEE_ALREADY_EXISTS', message: 'Employee already exists in this company' } 
      });
    }
    next(error);
  }
};

// NUEVO: Handler con filtros avanzados
export const getEmployeesWithFiltersHandler = async (
  req: Request<{}, {}, {}, EmployeeFiltersQuery>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const company_id = req.user!.company_id;
    const result = await employee_service.findByCompanyWithFilters(company_id, req.query);
    return res.status(HTTP_CODES.OK).json({ 
      success: true, 
      data: result.employees,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

// Handler existente mantenido para compatibilidad
export const getEmployeesHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const company_id = req.user!.company_id;
    const employees = await employee_service.findByCompany(company_id);
    return res.status(HTTP_CODES.OK).json({ success: true, data: employees });
  } catch (error) {
    next(error);
  }
};

// NUEVO: Obtener empleado por ID
export const getEmployeeByIdHandler = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const company_id = req.user!.company_id;
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(HTTP_CODES.BAD_REQUEST).json({
        success: false,
        error: { error_code: 'INVALID_ID', message: 'Invalid employee ID' }
      });
    }

    const employee = await employee_service.findById(id, company_id);
    return res.status(HTTP_CODES.OK).json({ success: true, data: employee });
  } catch (error: any) {
    if (error?.message === 'EMPLOYEE_NOT_FOUND') {
      return res.status(HTTP_CODES.NOT_FOUND).json({
        success: false,
        error: { error_code: 'EMPLOYEE_NOT_FOUND', message: 'Employee not found' }
      });
    }
    next(error);
  }
};

// NUEVO: Actualizar empleado
export const updateEmployeeHandler = async (
  req: Request<{ id: string }, {}, UpdateEmployeeBody>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const company_id = req.user!.company_id;
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(HTTP_CODES.BAD_REQUEST).json({
        success: false,
        error: { error_code: 'INVALID_ID', message: 'Invalid employee ID' }
      });
    }

    const employee = await employee_service.update(id, req.body, company_id);
    return res.status(HTTP_CODES.OK).json({ success: true, data: employee });
  } catch (error: any) {
    if (error?.message === 'EMPLOYEE_NOT_FOUND') {
      return res.status(HTTP_CODES.NOT_FOUND).json({
        success: false,
        error: { error_code: 'EMPLOYEE_NOT_FOUND', message: 'Employee not found' }
      });
    }
    if (error?.message === 'UNAUTHORIZED_COMPANY_ACCESS') {
      return res.status(HTTP_CODES.FORBIDDEN).json({
        success: false,
        error: { error_code: 'UNAUTHORIZED_COMPANY_ACCESS', message: 'Role does not belong to your company' }
      });
    }
    next(error);
  }
};

// NUEVO: Eliminar empleado
export const deleteEmployeeHandler = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const company_id = req.user!.company_id;
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(HTTP_CODES.BAD_REQUEST).json({
        success: false,
        error: { error_code: 'INVALID_ID', message: 'Invalid employee ID' }
      });
    }

    await employee_service.softDelete(id, company_id);
    return res.status(HTTP_CODES.OK).json({ 
      success: true, 
      message: 'Employee deleted successfully' 
    });
  } catch (error: any) {
    if (error?.message === 'EMPLOYEE_NOT_FOUND') {
      return res.status(HTTP_CODES.NOT_FOUND).json({
        success: false,
        error: { error_code: 'EMPLOYEE_NOT_FOUND', message: 'Employee not found' }
      });
    }
    next(error);
  }
};
```

## ✅ Validación de la Fase 1

```bash
# 1. OBLIGATORIO: Verificar que no hay errores de TypeScript
cd backend && npm run build
# Si falla: DETENTE y corrige errores antes de continuar

# 2. Verificar validaciones
npm run test:validation  # Si tienes tests
# O verificar manualmente con Postman

# 3. Probar endpoint con filtros
curl "http://localhost:3001/api/v1/employees?search=john&role_id=1&page=1&limit=5" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 4. Verificar estructura de respuesta
# Debe incluir: data (empleados) y pagination (metadata)
```

**CHECKLIST DE LA FASE 1:**
□ Validaciones de filtros implementadas
□ Middleware de query validation funcional
□ Servicio de empleados expandido con filtros
□ Controllers actualizados con nuevos handlers
□ Búsqueda de texto funcional (nombre, email, rol, posición)
□ Filtros por rol, estado activo funcionando
□ Paginación implementada con metadata
□ Ordenamiento por múltiples campos
□ Build sin errores de TypeScript

## 🎯 Resultado de la Fase 1

- ✅ **Filtros avanzados** implementados
- ✅ **Búsqueda de texto** en múltiples campos  
- ✅ **Paginación eficiente** con metadata
- ✅ **Ordenamiento flexible** por múltiples criterios
- ✅ **Validaciones robustas** para query params
- ✅ **Compatibilidad** con endpoints existentes
- ✅ **Performance optimizado** con índices
- ✅ **Build sin errores** de TypeScript

**Filtros de búsqueda avanzada implementados** - Listo para contadores y estadísticas en la siguiente fase.
