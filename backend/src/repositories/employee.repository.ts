import { company_employee, Prisma, PrismaClient } from '@prisma/client';
import { prisma } from '../config/prisma_client';
import { BaseRepository } from './base.repository';

/**
 * Employee Repository (PLAN.md 6.1)
 * Handles all database operations for company employees
 * Note: company_employee is the join table between users and companies
 */

export interface EmployeeFilters {
  company_id?: number;
  user_id?: number;
  role_id?: number;
  is_active?: boolean;
  search?: string;
  position?: string;
}

export interface EmployeeWithRelations extends company_employee {
  user?: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    user_type: string;
  };
  role?: {
    id: number;
    name: string;
    description: string | null;
    color: string;
  };
  company?: {
    id: number;
    name: string;
    business_name: string | null;
  };
}

export class EmployeeRepository extends BaseRepository<
  company_employee,
  typeof prisma.company_employee
> {
  protected delegate = prisma.company_employee;
  protected modelName = 'company_employee';

  /**
   * Find all employees for a company with relations
   *
   * @param companyId - Company ID
   * @param filters - Additional filters
   * @param options - Query options
   * @returns Array of employees with user and role data
   */
  async findByCompany(
    companyId: number,
    filters: EmployeeFilters = {},
    options?: any
  ): Promise<EmployeeWithRelations[]> {
    const where: any = {
      company_id: companyId,
      deleted_at: null,
    };

    // Apply active status filter
    if (filters.is_active !== undefined) {
      where.is_active = filters.is_active;
    }

    // Apply role filter
    if (filters.role_id) {
      where.role_id = filters.role_id;
    }

    // Apply position filter
    if (filters.position) {
      where.position = { contains: filters.position, mode: 'insensitive' };
    }

    // Apply search filter (searches in user's name and email)
    if (filters.search) {
      where.user = {
        OR: [
          { first_name: { contains: filters.search, mode: 'insensitive' } },
          { last_name: { contains: filters.search, mode: 'insensitive' } },
          { email: { contains: filters.search, mode: 'insensitive' } },
        ],
      };
    }

    return this.delegate.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
            user_type: true,
          },
        },
        role: {
          select: {
            id: true,
            name: true,
            description: true,
            color: true,
          },
        },
      },
      orderBy: [{ user: { last_name: 'asc' } }, { user: { first_name: 'asc' } }],
      ...options,
    }) as Promise<EmployeeWithRelations[]>;
  }

  /**
   * Find employee by user ID and company ID
   *
   * @param userId - User ID
   * @param companyId - Company ID
   * @returns Employee or null
   */
  async findByUserAndCompany(
    userId: number,
    companyId: number
  ): Promise<EmployeeWithRelations | null> {
    return this.delegate.findFirst({
      where: {
        user_id: userId,
        company_id: companyId,
        deleted_at: null,
      },
      include: {
        user: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
            user_type: true,
          },
        },
        role: {
          select: {
            id: true,
            name: true,
            description: true,
            color: true,
          },
        },
      },
    }) as Promise<EmployeeWithRelations | null>;
  }

  /**
   * Find employee with full relations (user, role, company)
   *
   * @param id - Employee ID
   * @returns Employee with all relations or null
   */
  async findByIdWithRelations(id: number): Promise<EmployeeWithRelations | null> {
    return this.delegate.findFirst({
      where: {
        id,
        deleted_at: null,
      },
      include: {
        user: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
            user_type: true,
          },
        },
        role: {
          select: {
            id: true,
            name: true,
            description: true,
            color: true,
          },
        },
        company: {
          select: {
            id: true,
            name: true,
            business_name: true,
          },
        },
      },
    }) as Promise<EmployeeWithRelations | null>;
  }

  /**
   * Find employees by role
   *
   * @param companyId - Company ID
   * @param roleId - Role ID
   * @returns Array of employees
   */
  async findByRole(companyId: number, roleId: number): Promise<EmployeeWithRelations[]> {
    return this.delegate.findMany({
      where: {
        company_id: companyId,
        role_id: roleId,
        deleted_at: null,
      },
      include: {
        user: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
            user_type: true,
          },
        },
      },
      orderBy: [{ user: { last_name: 'asc' } }],
    }) as Promise<EmployeeWithRelations[]>;
  }

  /**
   * Find active employees for a company
   *
   * @param companyId - Company ID
   * @returns Array of active employees
   */
  async findActiveByCompany(companyId: number): Promise<EmployeeWithRelations[]> {
    return this.findByCompany(companyId, { is_active: true });
  }

  /**
   * Update employee role
   *
   * @param id - Employee ID
   * @param roleId - New role ID
   * @param transaction - Optional Prisma transaction
   * @returns Updated employee
   */
  async updateRole(
    id: number,
    roleId: number,
    transaction?: PrismaClient
  ): Promise<company_employee> {
    const client = this.getClient(transaction);
    return client.company_employee.update({
      where: { id },
      data: { role_id: roleId },
    });
  }

  /**
   * Update employee active status
   *
   * @param id - Employee ID
   * @param isActive - New active status
   * @param transaction - Optional Prisma transaction
   * @returns Updated employee
   */
  async updateActiveStatus(
    id: number,
    isActive: boolean,
    transaction?: PrismaClient
  ): Promise<company_employee> {
    const client = this.getClient(transaction);
    return client.company_employee.update({
      where: { id },
      data: { is_active: isActive },
    });
  }

  /**
   * Bulk update employee roles
   *
   * @param ids - Array of employee IDs
   * @param roleId - New role ID
   * @param companyId - Company ID for security validation
   * @returns Count of updated employees
   */
  async bulkUpdateRole(
    ids: number[],
    roleId: number,
    companyId: number
  ): Promise<{ count: number }> {
    return this.delegate.updateMany({
      where: {
        id: { in: ids },
        company_id: companyId,
        deleted_at: null,
      },
      data: { role_id: roleId },
    });
  }

  /**
   * Bulk update employee active status
   *
   * @param ids - Array of employee IDs
   * @param isActive - New active status
   * @param companyId - Company ID for security validation
   * @returns Count of updated employees
   */
  async bulkUpdateActiveStatus(
    ids: number[],
    isActive: boolean,
    companyId: number
  ): Promise<{ count: number }> {
    return this.delegate.updateMany({
      where: {
        id: { in: ids },
        company_id: companyId,
        deleted_at: null,
      },
      data: { is_active: isActive },
    });
  }

  /**
   * Count employees by company
   *
   * @param companyId - Company ID
   * @param filters - Additional filters
   * @returns Count of employees
   */
  async countByCompany(companyId: number, filters: EmployeeFilters = {}): Promise<number> {
    const where: any = {
      company_id: companyId,
      deleted_at: null,
    };

    if (filters.is_active !== undefined) {
      where.is_active = filters.is_active;
    }

    if (filters.role_id) {
      where.role_id = filters.role_id;
    }

    return this.delegate.count({ where });
  }

  /**
   * Check if user is already employee of company
   *
   * @param userId - User ID
   * @param companyId - Company ID
   * @returns True if user is already an employee
   */
  async isEmployeeOfCompany(userId: number, companyId: number): Promise<boolean> {
    const existing = await this.delegate.findFirst({
      where: {
        user_id: userId,
        company_id: companyId,
        deleted_at: null,
      },
    });

    return existing !== null;
  }

  /**
   * Get employee statistics for a company
   *
   * @param companyId - Company ID
   * @returns Statistics object
   */
  async getStatistics(companyId: number): Promise<{
    total: number;
    active: number;
    inactive: number;
    byRole: Array<{ roleId: number; roleName: string; count: number }>;
  }> {
    const [total, active, inactive, byRole] = await Promise.all([
      this.countByCompany(companyId),
      this.countByCompany(companyId, { is_active: true }),
      this.countByCompany(companyId, { is_active: false }),
      this.delegate.groupBy({
        by: ['role_id'],
        where: {
          company_id: companyId,
          deleted_at: null,
        },
        _count: true,
      }),
    ]);

    // Fetch role names
    const roleIds = byRole.map((r) => r.role_id);
    const roles = await prisma.role.findMany({
      where: { id: { in: roleIds } },
      select: { id: true, name: true },
    });

    const roleMap = new Map(roles.map((r) => [r.id, r.name]));

    const byRoleWithNames = byRole.map((r) => ({
      roleId: r.role_id,
      roleName: roleMap.get(r.role_id) || 'Unknown',
      count: r._count,
    }));

    return { total, active, inactive, byRole: byRoleWithNames };
  }
}

// Export singleton instance
export const employeeRepository = new EmployeeRepository();
