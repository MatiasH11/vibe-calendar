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


