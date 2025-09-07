# 📊 FASE 2: Contadores y Estadísticas

## 🎯 Objetivo
Implementar contadores automáticos, estadísticas agregadas y endpoints optimizados que proporcionen métricas en tiempo real para dashboards y análisis del frontend.

## 📝 PASO 1: Servicio de Estadísticas

### `src/services/statistics.service.ts`
Crear nuevo servicio especializado en estadísticas:

```typescript
import { prisma } from '../config/prisma_client';

export const statistics_service = {
  // Estadísticas generales de empleados por empresa
  async getEmployeeStats(company_id: number) {
    const [
      totalEmployees,
      activeEmployees,
      employeesByRole,
      recentHires,
    ] = await Promise.all([
      // Total de empleados
      prisma.company_employee.count({
        where: { 
          company_id, 
          deleted_at: null 
        },
      }),

      // Empleados activos
      prisma.company_employee.count({
        where: { 
          company_id, 
          deleted_at: null, 
          is_active: true 
        },
      }),

      // Empleados agrupados por rol
      prisma.company_employee.groupBy({
        by: ['role_id'],
        where: { 
          company_id, 
          deleted_at: null 
        },
        _count: {
          id: true,
        },
        _sum: {
          // Contar activos usando CASE WHEN en SQL
          is_active: true,
        },
      }),

      // Contrataciones recientes (último mes)
      prisma.company_employee.count({
        where: {
          company_id,
          deleted_at: null,
          created_at: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 días atrás
          },
        },
      }),
    ]);

    // Obtener información de roles para el agrupamiento
    const rolesInfo = await prisma.role.findMany({
      where: { 
        company_id,
        id: {
          in: employeesByRole.map(group => group.role_id),
        },
      },
      select: {
        id: true,
        name: true,
        color: true,
        description: true,
      },
    });

    // Combinar datos de empleados por rol con información del rol
    const distributionByRole = employeesByRole.map(group => {
      const roleInfo = rolesInfo.find(role => role.id === group.role_id);
      return {
        role_id: group.role_id,
        role_name: roleInfo?.name || 'Unknown',
        role_color: roleInfo?.color || '#FFFFFF',
        role_description: roleInfo?.description,
        total_employees: group._count.id,
        active_employees: group._sum.is_active || 0,
        inactive_employees: group._count.id - (group._sum.is_active || 0),
      };
    });

    return {
      total_employees: totalEmployees,
      active_employees: activeEmployees,
      inactive_employees: totalEmployees - activeEmployees,
      active_percentage: totalEmployees > 0 ? Math.round((activeEmployees / totalEmployees) * 100) : 0,
      recent_hires: recentHires,
      distribution_by_role: distributionByRole,
      roles_with_employees: distributionByRole.length,
      average_employees_per_role: distributionByRole.length > 0 
        ? Math.round(totalEmployees / distributionByRole.length) 
        : 0,
    };
  },

  // Estadísticas de roles con contadores de empleados
  async getRoleStats(company_id: number) {
    const [
      totalRoles,
      rolesWithEmployees,
      rolesData
    ] = await Promise.all([
      // Total de roles
      prisma.role.count({
        where: { company_id },
      }),

      // Roles que tienen empleados
      prisma.role.count({
        where: {
          company_id,
          employees: {
            some: {
              deleted_at: null,
            },
          },
        },
      }),

      // Datos detallados de roles con contadores
      prisma.role.findMany({
        where: { company_id },
        include: {
          _count: {
            select: {
              employees: {
                where: {
                  deleted_at: null,
                },
              },
            },
          },
        },
        orderBy: {
          employees: {
            _count: 'desc',
          },
        },
      }),
    ]);

    // Calcular estadísticas adicionales
    const employeeCounts = rolesData.map(role => role._count.employees);
    const maxEmployees = Math.max(...employeeCounts, 0);
    const minEmployees = Math.min(...employeeCounts, 0);
    const emptyRoles = rolesData.filter(role => role._count.employees === 0).length;

    return {
      total_roles: totalRoles,
      roles_with_employees: rolesWithEmployees,
      empty_roles: emptyRoles,
      utilization_percentage: totalRoles > 0 ? Math.round((rolesWithEmployees / totalRoles) * 100) : 0,
      max_employees_in_role: maxEmployees,
      min_employees_in_role: minEmployees,
      roles: rolesData.map(role => ({
        id: role.id,
        name: role.name,
        description: role.description,
        color: role.color,
        employee_count: role._count.employees,
        created_at: role.created_at,
        updated_at: role.updated_at,
      })),
    };
  },

  // Estadísticas avanzadas para dashboard
  async getDashboardStats(company_id: number) {
    const [employeeStats, roleStats, growthData] = await Promise.all([
      this.getEmployeeStats(company_id),
      this.getRoleStats(company_id),
      this.getGrowthStats(company_id),
    ]);

    return {
      employees: employeeStats,
      roles: roleStats,
      growth: growthData,
      summary: {
        total_employees: employeeStats.total_employees,
        total_roles: roleStats.total_roles,
        active_percentage: employeeStats.active_percentage,
        role_utilization: roleStats.utilization_percentage,
      },
    };
  },

  // Estadísticas de crecimiento/tendencias
  async getGrowthStats(company_id: number) {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const last3Months = new Date(now.getFullYear(), now.getMonth() - 3, 1);

    const [
      employeesLastMonth,
      employeesThisMonth,
      hires3Months,
      terminations3Months,
    ] = await Promise.all([
      // Empleados al final del mes pasado
      prisma.company_employee.count({
        where: {
          company_id,
          created_at: { lt: thisMonth },
          OR: [
            { deleted_at: null },
            { deleted_at: { gte: thisMonth } },
          ],
        },
      }),

      // Empleados actuales
      prisma.company_employee.count({
        where: {
          company_id,
          deleted_at: null,
        },
      }),

      // Contrataciones últimos 3 meses
      prisma.company_employee.count({
        where: {
          company_id,
          created_at: { gte: last3Months },
          deleted_at: null,
        },
      }),

      // Terminaciones últimos 3 meses
      prisma.company_employee.count({
        where: {
          company_id,
          deleted_at: {
            gte: last3Months,
            not: null,
          },
        },
      }),
    ]);

    // Calcular tasa de crecimiento mensual
    const monthlyGrowthRate = employeesLastMonth > 0 
      ? Math.round(((employeesThisMonth - employeesLastMonth) / employeesLastMonth) * 100)
      : 0;

    return {
      employees_last_month: employeesLastMonth,
      employees_this_month: employeesThisMonth,
      monthly_growth_rate: monthlyGrowthRate,
      hires_3_months: hires3Months,
      terminations_3_months: terminations3Months,
      net_growth_3_months: hires3Months - terminations3Months,
      turnover_rate_3_months: employeesThisMonth > 0 
        ? Math.round((terminations3Months / employeesThisMonth) * 100) 
        : 0,
    };
  },
};
```

## 📝 PASO 2: Actualizar Servicio de Roles

### `src/services/role.service.ts`
Expandir servicio existente con contadores:

```typescript
import { prisma } from '../config/prisma_client';
import { CreateRoleBody, RoleFiltersQuery, UpdateRoleBody } from '../validations/role.validation';

export const role_service = {
  // Método existente mantenido
  async create(data: CreateRoleBody, company_id: number) {
    const existing = await prisma.role.findFirst({ where: { company_id, name: data.name } });
    if (existing) {
      throw new Error('DUPLICATE_ROLE');
    }
    const role = await prisma.role.create({
      data: {
        company_id,
        name: data.name,
        description: data.description,
        color: data.color,
      },
    });
    return role;
  },

  // NUEVO: Método con filtros y opciones avanzadas
  async findByCompanyWithFilters(company_id: number, filters: RoleFiltersQuery) {
    const whereConditions: any = { company_id };

    // Filtro de búsqueda de texto
    if (filters.search && filters.search.trim()) {
      const searchTerm = filters.search.trim();
      whereConditions.OR = [
        {
          name: {
            contains: searchTerm,
            mode: 'insensitive',
          },
        },
        {
          description: {
            contains: searchTerm,
            mode: 'insensitive',
          },
        },
      ];
    }

    // Configurar includes según parámetros
    const includeConfig: any = {};
    
    if (filters.include === 'stats' || filters.include === 'employees') {
      includeConfig._count = {
        select: {
          employees: {
            where: {
              deleted_at: null,
            },
          },
        },
      };
    }

    if (filters.include === 'employees') {
      includeConfig.employees = {
        where: {
          deleted_at: null,
        },
        include: {
          user: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              email: true,
            },
          },
        },
        orderBy: {
          created_at: 'desc',
        },
      };
    }

    // Configurar ordenamiento
    let orderBy: any = {};
    switch (filters.sort_by) {
      case 'name':
        orderBy = { name: filters.sort_order };
        break;
      case 'employee_count':
        orderBy = {
          employees: {
            _count: filters.sort_order,
          },
        };
        break;
      case 'created_at':
      default:
        orderBy = { created_at: filters.sort_order };
        break;
    }

    // Calcular offset para paginación
    const offset = (filters.page - 1) * filters.limit;

    // Ejecutar consultas
    const [roles, total] = await Promise.all([
      prisma.role.findMany({
        where: whereConditions,
        include: includeConfig,
        orderBy,
        skip: offset,
        take: filters.limit,
      }),
      prisma.role.count({
        where: whereConditions,
      }),
    ]);

    // Calcular metadata de paginación
    const totalPages = Math.ceil(total / filters.limit);

    return {
      roles,
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
  async find_by_company(company_id: number) {
    return prisma.role.findMany({ 
      where: { company_id },
      orderBy: { name: 'asc' },
    });
  },

  // NUEVO: Obtener rol por ID con opciones de include
  async findById(id: number, company_id: number, includeEmployees = false) {
    const includeConfig: any = {
      _count: {
        select: {
          employees: {
            where: {
              deleted_at: null,
            },
          },
        },
      },
    };

    if (includeEmployees) {
      includeConfig.employees = {
        where: {
          deleted_at: null,
        },
        include: {
          user: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              email: true,
            },
          },
        },
        orderBy: {
          created_at: 'desc',
        },
      };
    }

    const role = await prisma.role.findFirst({
      where: { 
        id, 
        company_id 
      },
      include: includeConfig,
    });

    if (!role) {
      throw new Error('ROLE_NOT_FOUND');
    }

    return role;
  },

  // NUEVO: Actualizar rol
  async update(id: number, data: UpdateRoleBody, company_id: number) {
    // Verificar que el rol existe y pertenece a la empresa
    const existingRole = await prisma.role.findFirst({
      where: { 
        id, 
        company_id 
      },
    });

    if (!existingRole) {
      throw new Error('ROLE_NOT_FOUND');
    }

    // Verificar duplicados de nombre si se está cambiando
    if (data.name && data.name !== existingRole.name) {
      const nameExists = await prisma.role.findFirst({
        where: { 
          company_id, 
          name: data.name,
          id: { not: id },
        },
      });
      if (nameExists) {
        throw new Error('DUPLICATE_ROLE');
      }
    }

    // Actualizar rol
    const updatedRole = await prisma.role.update({
      where: { id },
      data: {
        ...data,
        updated_at: new Date(),
      },
      include: {
        _count: {
          select: {
            employees: {
              where: {
                deleted_at: null,
              },
            },
          },
        },
      },
    });

    return updatedRole;
  },

  // NUEVO: Eliminar rol (solo si no tiene empleados)
  async delete(id: number, company_id: number) {
    // Verificar que el rol existe y pertenece a la empresa
    const existingRole = await prisma.role.findFirst({
      where: { 
        id, 
        company_id 
      },
      include: {
        _count: {
          select: {
            employees: {
              where: {
                deleted_at: null,
              },
            },
          },
        },
      },
    });

    if (!existingRole) {
      throw new Error('ROLE_NOT_FOUND');
    }

    // Verificar que no tenga empleados asignados
    if (existingRole._count.employees > 0) {
      throw new Error('ROLE_HAS_EMPLOYEES');
    }

    // Eliminar rol
    await prisma.role.delete({
      where: { id },
    });

    return { success: true };
  },
};
```

## 📝 PASO 3: Controllers de Estadísticas

### `src/controllers/statistics.controller.ts`
Crear nuevo controller para estadísticas:

```typescript
import { Request, Response, NextFunction } from 'express';
import { statistics_service } from '../services/statistics.service';
import { HTTP_CODES } from '../constants/http_codes';

export const getEmployeeStatsHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const company_id = req.user!.company_id;
    const stats = await statistics_service.getEmployeeStats(company_id);
    return res.status(HTTP_CODES.OK).json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
};

export const getRoleStatsHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const company_id = req.user!.company_id;
    const stats = await statistics_service.getRoleStats(company_id);
    return res.status(HTTP_CODES.OK).json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
};

export const getDashboardStatsHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const company_id = req.user!.company_id;
    const stats = await statistics_service.getDashboardStats(company_id);
    return res.status(HTTP_CODES.OK).json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
};

export const getGrowthStatsHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const company_id = req.user!.company_id;
    const stats = await statistics_service.getGrowthStats(company_id);
    return res.status(HTTP_CODES.OK).json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
};
```

## 📝 PASO 4: Actualizar Controller de Roles

### `src/controllers/role.controller.ts`
Expandir controller existente:

```typescript
import { Request, Response, NextFunction } from 'express';
import { CreateRoleBody, RoleFiltersQuery, UpdateRoleBody } from '../validations/role.validation';
import { role_service } from '../services/role.service';
import { HTTP_CODES } from '../constants/http_codes';

// Handler existente mantenido
export const createRoleHandler = async (
  req: Request<{}, {}, CreateRoleBody>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const company_id = req.user!.company_id;
    const role = await role_service.create(req.body, company_id);
    return res.status(HTTP_CODES.CREATED).json({ success: true, data: role });
  } catch (error: any) {
    if (error?.message === 'DUPLICATE_ROLE') {
      return res.status(HTTP_CODES.CONFLICT).json({ 
        success: false, 
        error: { error_code: 'DUPLICATE_ROLE', message: 'Role name already exists for this company' } 
      });
    }
    next(error);
  }
};

// NUEVO: Handler con filtros y opciones avanzadas
export const getRolesWithFiltersHandler = async (
  req: Request<{}, {}, {}, RoleFiltersQuery>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const company_id = req.user!.company_id;
    const result = await role_service.findByCompanyWithFilters(company_id, req.query);
    return res.status(HTTP_CODES.OK).json({ 
      success: true, 
      data: result.roles,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

// Handler existente mantenido para compatibilidad
export const getRolesHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const company_id = req.user!.company_id;
    const roles = await role_service.find_by_company(company_id);
    return res.status(HTTP_CODES.OK).json({ success: true, data: roles });
  } catch (error) {
    next(error);
  }
};

// NUEVO: Obtener rol por ID
export const getRoleByIdHandler = async (
  req: Request<{ id: string }, {}, {}, { include?: 'employees' }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const company_id = req.user!.company_id;
    const id = parseInt(req.params.id);
    const includeEmployees = req.query.include === 'employees';
    
    if (isNaN(id)) {
      return res.status(HTTP_CODES.BAD_REQUEST).json({
        success: false,
        error: { error_code: 'INVALID_ID', message: 'Invalid role ID' }
      });
    }

    const role = await role_service.findById(id, company_id, includeEmployees);
    return res.status(HTTP_CODES.OK).json({ success: true, data: role });
  } catch (error: any) {
    if (error?.message === 'ROLE_NOT_FOUND') {
      return res.status(HTTP_CODES.NOT_FOUND).json({
        success: false,
        error: { error_code: 'ROLE_NOT_FOUND', message: 'Role not found' }
      });
    }
    next(error);
  }
};

// NUEVO: Actualizar rol
export const updateRoleHandler = async (
  req: Request<{ id: string }, {}, UpdateRoleBody>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const company_id = req.user!.company_id;
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(HTTP_CODES.BAD_REQUEST).json({
        success: false,
        error: { error_code: 'INVALID_ID', message: 'Invalid role ID' }
      });
    }

    const role = await role_service.update(id, req.body, company_id);
    return res.status(HTTP_CODES.OK).json({ success: true, data: role });
  } catch (error: any) {
    if (error?.message === 'ROLE_NOT_FOUND') {
      return res.status(HTTP_CODES.NOT_FOUND).json({
        success: false,
        error: { error_code: 'ROLE_NOT_FOUND', message: 'Role not found' }
      });
    }
    if (error?.message === 'DUPLICATE_ROLE') {
      return res.status(HTTP_CODES.CONFLICT).json({
        success: false,
        error: { error_code: 'DUPLICATE_ROLE', message: 'Role name already exists for this company' }
      });
    }
    next(error);
  }
};

// NUEVO: Eliminar rol
export const deleteRoleHandler = async (
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
        error: { error_code: 'INVALID_ID', message: 'Invalid role ID' }
      });
    }

    await role_service.delete(id, company_id);
    return res.status(HTTP_CODES.OK).json({ 
      success: true, 
      message: 'Role deleted successfully' 
    });
  } catch (error: any) {
    if (error?.message === 'ROLE_NOT_FOUND') {
      return res.status(HTTP_CODES.NOT_FOUND).json({
        success: false,
        error: { error_code: 'ROLE_NOT_FOUND', message: 'Role not found' }
      });
    }
    if (error?.message === 'ROLE_HAS_EMPLOYEES') {
      return res.status(HTTP_CODES.CONFLICT).json({
        success: false,
        error: { error_code: 'ROLE_HAS_EMPLOYEES', message: 'Cannot delete role with assigned employees' }
      });
    }
    next(error);
  }
};
```

## ✅ Validación de la Fase 2

```bash
# 1. OBLIGATORIO: Verificar que no hay errores de TypeScript
cd backend && npm run build
# Si falla: DETENTE y corrige errores antes de continuar

# 2. Probar endpoint de estadísticas de empleados
curl "http://localhost:3001/api/v1/employees/stats" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 3. Probar endpoint de estadísticas de roles
curl "http://localhost:3001/api/v1/roles/stats" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 4. Probar roles con contadores
curl "http://localhost:3001/api/v1/roles?include=stats" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 5. Probar rol específico con empleados
curl "http://localhost:3001/api/v1/roles/1?include=employees" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**CHECKLIST DE LA FASE 2:**
□ Servicio de estadísticas implementado
□ Contadores automáticos funcionando
□ Estadísticas de empleados por rol
□ Estadísticas de crecimiento y tendencias
□ Roles con contadores de empleados
□ Endpoints de estadísticas creados
□ Queries optimizadas con agrupaciones
□ Build sin errores de TypeScript

## 🎯 Resultado de la Fase 2

- ✅ **Contadores automáticos** en todas las consultas
- ✅ **Estadísticas agregadas** para dashboards
- ✅ **Distribución por roles** con contadores
- ✅ **Métricas de crecimiento** y tendencias
- ✅ **Endpoints optimizados** para estadísticas
- ✅ **Queries eficientes** con agrupaciones
- ✅ **Datos en tiempo real** para frontend
- ✅ **Build sin errores** de TypeScript

**Contadores y estadísticas implementados** - Listo para CRUD completo en la siguiente fase.
