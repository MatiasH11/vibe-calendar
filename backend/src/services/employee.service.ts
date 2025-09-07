import { prisma } from '../config/prisma_client';
import { AddEmployeeBody, EmployeeFiltersQuery, UpdateEmployeeBody } from '../validations/employee.validation';
import bcrypt from 'bcryptjs';
import { AUTH_CONSTANTS } from '../constants/auth';
import crypto from 'crypto';
import { Prisma } from '@prisma/client';
import { cacheService, CacheHelper } from './cache.service';

export const employee_service = {
  async add(data: AddEmployeeBody, company_id: number) {
    // Ensure role belongs to company
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
            user_type: 'employee', // Los empleados agregados son siempre 'employee'
          },
        });
      }

      const existing = await tx.company_employee.findFirst({ where: { company_id, user_id: user.id, deleted_at: null } });
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

  // Método add con invalidación de cache
  async addWithCacheInvalidation(data: AddEmployeeBody, company_id: number) {
    const result = await this.add(data, company_id);
    
    // Invalidar cache relacionado
    CacheHelper.invalidateEmployeeCache(company_id);
    
    return result;
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

  // NUEVO: Búsqueda con cache
  async findByCompanyWithFiltersAndCache(company_id: number, filters: EmployeeFiltersQuery) {
    const cacheKey = CacheHelper.getEmployeeCacheKey(company_id, filters);
    const cached = cacheService.get(cacheKey);
    
    if (cached) {
      return cached;
    }

    const result = await this.findByCompanyWithFilters(company_id, filters);
    
    // Cache por 2 minutos para consultas frecuentes
    cacheService.set(cacheKey, result, 2 * 60 * 1000);
    
    return result;
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

  // NUEVO: Actualizar empleado con invalidación de cache
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

    // Invalidar cache relacionado
    CacheHelper.invalidateEmployeeCache(company_id);

    return updatedEmployee;
  },

  // NUEVO: Eliminar empleado (soft delete) con invalidación de cache
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

    // Invalidar cache relacionado
    CacheHelper.invalidateEmployeeCache(company_id);

    return { success: true };
  },

  // NUEVO: Método específico para vista de turnos (mejorado)
  async findByCompanyForShifts(company_id: number, options: { start_date?: string; end_date?: string; week_start?: string; week_end?: string }) {
    // Mantener compatibilidad con parámetros antiguos
    const start_date = options.start_date || options.week_start;
    const end_date = options.end_date || options.week_end;
    
    // Obtener todos los empleados activos de la empresa
    const employees = await prisma.company_employee.findMany({
      where: {
        company_id,
        is_active: true,
        deleted_at: null,
      },
      include: {
        user: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
            created_at: true,
            updated_at: true,
            deleted_at: true,
          },
        },
        role: {
          select: {
            id: true,
            company_id: true,
            name: true,
            description: true,
            color: true,
            created_at: true,
            updated_at: true,
          },
        },
      },
      orderBy: [
        { user: { first_name: 'asc' } },
        { user: { last_name: 'asc' } },
      ],
    });

    // Si no hay parámetros de rango, devolver empleados sin turnos
    if (!start_date || !end_date) {
      return {
        employees: employees.map(emp => ({
          ...emp,
          shifts: [],
        })),
        meta: {
          start_date: null,
          end_date: null,
          total_employees: employees.length,
          employees_with_shifts: 0,
          total_shifts: 0
        }
      };
    }

    // Obtener turnos del rango para todos los empleados
    const shifts = await prisma.shift.findMany({
      where: {
        company_employee: {
          company_id,
          is_active: true,
          deleted_at: null,
        },
        shift_date: {
          gte: new Date(start_date),
          lte: new Date(end_date),
        },
        deleted_at: null,
      },
      include: {
        company_employee: {
          select: {
            id: true,
            user: {
              select: {
                first_name: true,
                last_name: true,
              },
            },
          },
        },
      },
      orderBy: [
        { shift_date: 'asc' },
        { start_time: 'asc' },
      ],
    });

    // Crear array de días del rango
    const rangeDays = [];
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      rangeDays.push(d.toISOString().split('T')[0]);
    }

    // Procesar empleados con sus turnos del rango
    const employeesWithShifts = employees.map(emp => {
      const employeeShifts = shifts.filter(shift => shift.company_employee_id === emp.id);
      
      const shiftsByDay = rangeDays.map(date => ({
        date,
        shifts: employeeShifts.filter(shift => {
          const shiftDate = shift.shift_date instanceof Date 
            ? shift.shift_date.toISOString().split('T')[0]
            : shift.shift_date;
          return shiftDate === date;
        }),
      }));

      return {
        ...emp,
        shifts: shiftsByDay,
      };
    });

    // Calcular estadísticas
    const employeesWithShiftsCount = employeesWithShifts.filter(emp => 
      emp.shifts.some(day => day.shifts.length > 0)
    ).length;
    const totalShifts = shifts.length;

    return {
      employees: employeesWithShifts,
      meta: {
        start_date,
        end_date,
        total_employees: employees.length,
        employees_with_shifts: employeesWithShiftsCount,
        total_shifts: totalShifts
      }
    };
  },
};


