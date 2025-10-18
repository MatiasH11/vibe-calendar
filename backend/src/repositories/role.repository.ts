import { role, Prisma, PrismaClient } from '@prisma/client';
import { prisma } from '../config/prisma_client';
import { BaseRepository } from './base.repository';

/**
 * Role Repository (PLAN.md 6.1)
 * Handles all database operations for roles
 */

export interface RoleFilters {
  company_id?: number;
  search?: string;
  include_employee_count?: boolean;
  include_employees?: boolean;
}

export interface RoleWithRelations extends role {
  _count?: {
    employees: number;
  };
  employees?: Array<{
    id: number;
    user_id: number;
    position: string | null;
    is_active: boolean;
    user: {
      id: number;
      first_name: string;
      last_name: string;
      email: string;
    };
  }>;
}

export class RoleRepository extends BaseRepository<role, typeof prisma.role> {
  protected delegate = prisma.role;
  protected modelName = 'role';

  /**
   * Find all roles for a company
   *
   * @param companyId - Company ID
   * @param filters - Additional filters
   * @param options - Query options
   * @returns Array of roles
   */
  async findByCompany(
    companyId: number,
    filters: RoleFilters = {},
    options?: any
  ): Promise<RoleWithRelations[]> {
    const where: any = {
      company_id: companyId,
    };

    // Note: roles don't have deleted_at, so we don't filter by it

    // Apply search filter
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const include: any = {};

    // Include employee count
    if (filters.include_employee_count) {
      include._count = {
        select: {
          employees: {
            where: { deleted_at: null },
          },
        },
      };
    }

    // Include full employee data
    if (filters.include_employees) {
      include.employees = {
        where: { deleted_at: null },
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
        orderBy: { created_at: 'desc' },
      };
    }

    return this.delegate.findMany({
      where,
      include: Object.keys(include).length > 0 ? include : undefined,
      orderBy: { name: 'asc' },
      ...options,
    }) as Promise<RoleWithRelations[]>;
  }

  /**
   * Find role by name within a company
   *
   * @param companyId - Company ID
   * @param name - Role name
   * @returns Role or null
   */
  async findByName(companyId: number, name: string): Promise<role | null> {
    return this.delegate.findFirst({
      where: {
        company_id: companyId,
        name,
      },
    });
  }

  /**
   * Find role by ID and company (security check)
   *
   * @param id - Role ID
   * @param companyId - Company ID
   * @param includeEmployees - Whether to include employees
   * @returns Role or null
   */
  async findByIdAndCompany(
    id: number,
    companyId: number,
    includeEmployees: boolean = false
  ): Promise<RoleWithRelations | null> {
    const include: any = {};

    if (includeEmployees) {
      include.employees = {
        where: { deleted_at: null },
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
      };
    }

    return this.delegate.findFirst({
      where: {
        id,
        company_id: companyId,
      },
      include: Object.keys(include).length > 0 ? include : undefined,
    }) as Promise<RoleWithRelations | null>;
  }

  /**
   * Create a role for a company
   *
   * @param data - Role data (must include company_id)
   * @param transaction - Optional Prisma transaction
   * @returns Created role
   */
  async createRole(
    data: Prisma.roleCreateInput,
    transaction?: PrismaClient
  ): Promise<role> {
    const client = this.getClient(transaction);
    return client.role.create({ data });
  }

  /**
   * Update a role
   *
   * @param id - Role ID
   * @param companyId - Company ID for security validation
   * @param data - Updated data
   * @param transaction - Optional Prisma transaction
   * @returns Updated role
   */
  async updateRole(
    id: number,
    companyId: number,
    data: Prisma.roleUpdateInput,
    transaction?: PrismaClient
  ): Promise<role> {
    const client = this.getClient(transaction);
    return client.role.update({
      where: {
        id,
        company_id: companyId,
      },
      data,
    });
  }

  /**
   * Delete a role (hard delete - roles don't have soft delete)
   * Only allowed if no employees are assigned
   *
   * @param id - Role ID
   * @param companyId - Company ID for security validation
   * @param transaction - Optional Prisma transaction
   * @returns Deleted role
   * @throws Error if role has employees
   */
  async deleteRole(
    id: number,
    companyId: number,
    transaction?: PrismaClient
  ): Promise<role> {
    const client = this.getClient(transaction);

    // Check if role has employees
    const employeeCount = await client.company_employee.count({
      where: {
        role_id: id,
        deleted_at: null,
      },
    });

    if (employeeCount > 0) {
      throw new Error('ROLE_HAS_EMPLOYEES');
    }

    return client.role.delete({
      where: {
        id,
        company_id: companyId,
      },
    });
  }

  /**
   * Count roles for a company
   *
   * @param companyId - Company ID
   * @returns Count of roles
   */
  async countByCompany(companyId: number): Promise<number> {
    return this.delegate.count({
      where: { company_id: companyId },
    });
  }

  /**
   * Check if role name already exists for company
   *
   * @param companyId - Company ID
   * @param name - Role name
   * @param excludeId - Optional role ID to exclude (for updates)
   * @returns True if name exists
   */
  async isNameTaken(
    companyId: number,
    name: string,
    excludeId?: number
  ): Promise<boolean> {
    const where: any = {
      company_id: companyId,
      name,
    };

    if (excludeId) {
      where.id = { not: excludeId };
    }

    const existing = await this.delegate.findFirst({ where });
    return existing !== null;
  }

  /**
   * Get role with employee count
   *
   * @param id - Role ID
   * @param companyId - Company ID
   * @returns Role with employee count or null
   */
  async findByIdWithCount(
    id: number,
    companyId: number
  ): Promise<RoleWithRelations | null> {
    return this.delegate.findFirst({
      where: {
        id,
        company_id: companyId,
      },
      include: {
        _count: {
          select: {
            employees: {
              where: { deleted_at: null },
            },
          },
        },
      },
    }) as Promise<RoleWithRelations | null>;
  }

  /**
   * Get roles with employee statistics
   *
   * @param companyId - Company ID
   * @returns Array of roles with employee counts
   */
  async findWithStatistics(companyId: number): Promise<RoleWithRelations[]> {
    return this.findByCompany(companyId, { include_employee_count: true });
  }
}

// Export singleton instance
export const roleRepository = new RoleRepository();
