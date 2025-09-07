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
      
      // Contar empleados activos por rol
      return prisma.company_employee.count({
        where: {
          company_id,
          deleted_at: null,
          role_id: group.role_id,
          is_active: true,
        },
      }).then(activeCount => ({
        role_id: group.role_id,
        role_name: roleInfo?.name || 'Unknown',
        role_color: roleInfo?.color || '#FFFFFF',
        role_description: roleInfo?.description,
        total_employees: group._count.id,
        active_employees: activeCount,
        inactive_employees: group._count.id - activeCount,
      }));
    });

    const resolvedDistribution = await Promise.all(distributionByRole);

    return {
      total_employees: totalEmployees,
      active_employees: activeEmployees,
      inactive_employees: totalEmployees - activeEmployees,
      active_percentage: totalEmployees > 0 ? Math.round((activeEmployees / totalEmployees) * 100) : 0,
      recent_hires: recentHires,
      distribution_by_role: resolvedDistribution,
      roles_with_employees: resolvedDistribution.length,
      average_employees_per_role: resolvedDistribution.length > 0 
        ? Math.round(totalEmployees / resolvedDistribution.length) 
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
