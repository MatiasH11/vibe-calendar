/**
 * Role Service V2 - Using Repository Pattern (PLAN.md 6.2)
 * This is an example implementation showing how to refactor services to use repositories
 *
 * Benefits of this approach:
 * 1. Separation of concerns: Service handles business logic, Repository handles data access
 * 2. Testability: Easy to mock repository for unit tests
 * 3. Reusability: Repository methods can be used by multiple services
 * 4. Consistency: All data access follows same patterns
 *
 * To migrate:
 * 1. Replace role.service.ts with this file
 * 2. Update imports in controllers
 * 3. Run tests to ensure compatibility
 */

import { roleRepository } from '../repositories/role.repository';
import { CreateRoleBody, RoleFiltersQuery, UpdateRoleBody } from '../validations/role.validation';

export const role_service_v2 = {
  /**
   * Create a new role
   * Uses repository for data access, service handles business logic
   */
  async create(data: CreateRoleBody, company_id: number) {
    // Business logic: Check for duplicate names
    const isDuplicate = await roleRepository.isNameTaken(company_id, data.name);
    if (isDuplicate) {
      throw new Error('DUPLICATE_ROLE');
    }

    // Data access: Delegate to repository
    return roleRepository.createRole({
      company: { connect: { id: company_id } },
      name: data.name,
      description: data.description,
      color: data.color,
    });
  },

  /**
   * Find roles by company with advanced filters
   * Demonstrates how to translate query params to repository filters
   */
  async findByCompanyWithFilters(company_id: number, filters: RoleFiltersQuery) {
    // Translate service-level filters to repository filters
    const repoFilters = {
      company_id,
      search: filters.search,
      include_employee_count: filters.include === 'stats' || filters.include === 'employees',
      include_employees: filters.include === 'employees',
    };

    // Get data from repository
    let roles = await roleRepository.findByCompany(company_id, repoFilters);

    // Business logic: Apply sorting
    if (filters.sort_by === 'name') {
      roles.sort((a, b) => {
        const comparison = a.name.localeCompare(b.name);
        return filters.sort_order === 'desc' ? -comparison : comparison;
      });
    } else if (filters.sort_by === 'employee_count' && roles[0]?._count) {
      roles.sort((a, b) => {
        const countA = a._count?.employees || 0;
        const countB = b._count?.employees || 0;
        return filters.sort_order === 'desc' ? countB - countA : countA - countB;
      });
    }

    // Business logic: Apply pagination
    const page = filters.page || 1;
    const limit = Math.min(filters.limit || 50, 100);
    const total = roles.length;
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedRoles = roles.slice(start, end);

    return {
      roles: paginatedRoles,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * Find all roles for a company (simple version)
   * Legacy method for backward compatibility
   */
  async find_by_company(company_id: number) {
    return roleRepository.findByCompany(company_id);
  },

  /**
   * Find role by ID
   * Includes company validation for security
   */
  async findById(id: number, company_id: number, includeEmployees: boolean = false) {
    const role = await roleRepository.findByIdAndCompany(id, company_id, includeEmployees);

    if (!role) {
      throw new Error('ROLE_NOT_FOUND');
    }

    return role;
  },

  /**
   * Update a role
   * Business logic: Validate ownership and check for duplicate names
   */
  async update(id: number, data: UpdateRoleBody, company_id: number) {
    // Validate role exists and belongs to company
    const existing = await roleRepository.findByIdAndCompany(id, company_id);
    if (!existing) {
      throw new Error('ROLE_NOT_FOUND');
    }

    // Check for duplicate name (if name is being changed)
    if (data.name && data.name !== existing.name) {
      const isDuplicate = await roleRepository.isNameTaken(company_id, data.name, id);
      if (isDuplicate) {
        throw new Error('DUPLICATE_ROLE');
      }
    }

    // Update via repository
    return roleRepository.updateRole(id, company_id, data);
  },

  /**
   * Delete a role
   * Business logic: Ensure role has no employees
   */
  async delete(id: number, company_id: number) {
    // Validate role exists and belongs to company
    const existing = await roleRepository.findByIdAndCompany(id, company_id);
    if (!existing) {
      throw new Error('ROLE_NOT_FOUND');
    }

    // Repository will check for employees and throw ROLE_HAS_EMPLOYEES if needed
    return roleRepository.deleteRole(id, company_id);
  },

  /**
   * Get role statistics
   * Example of combining repository methods for complex business logic
   */
  async getStatistics(company_id: number) {
    const [roles, totalRoles] = await Promise.all([
      roleRepository.findWithStatistics(company_id),
      roleRepository.countByCompany(company_id),
    ]);

    const totalEmployees = roles.reduce((sum, role) => {
      return sum + (role._count?.employees || 0);
    }, 0);

    return {
      totalRoles,
      totalEmployees,
      roles: roles.map(role => ({
        id: role.id,
        name: role.name,
        employeeCount: role._count?.employees || 0,
      })),
    };
  },
};
