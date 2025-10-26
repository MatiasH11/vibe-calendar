import { prisma } from '../config/prisma_client';
import {
  create_employee_body,
  update_employee_body,
  employee_filters,
  bulk_create_employee_body,
  bulk_update_employee_body,
  bulk_delete_employee_body,
} from '../validations/employee.validation';
import {
  ResourceNotFoundError,
  UnauthorizedCompanyAccessError,
  TransactionFailedError,
} from '../errors';

export const employee_service = {
  /**
   * Get all employees with pagination and filters
   */
  async getAll(company_id: number, filters: employee_filters) {
    const page = parseInt(filters.page || '1');
    const limit = Math.min(parseInt(filters.limit || '50'), 100);
    const skip = (page - 1) * limit;

    const where: any = {
      company_id,
      deleted_at: null,
    };

    // Add search filter (search in user's name or position)
    if (filters.search) {
      where.OR = [
        { position: { contains: filters.search, mode: 'insensitive' } },
        { user: { first_name: { contains: filters.search, mode: 'insensitive' } } },
        { user: { last_name: { contains: filters.search, mode: 'insensitive' } } },
      ];
    }

    // Add is_active filter
    if (filters.is_active) {
      where.is_active = filters.is_active === 'true';
    }

    // Get total count and items
    const [total, items] = await Promise.all([
      prisma.employee.count({ where }),
      prisma.employee.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          [filters.sort_by || 'created_at']: filters.sort_order || 'desc',
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
          department: {
            select: {
              id: true,
              name: true,
              color: true,
            },
          },
        },
      }),
    ]);

    return {
      success: true,
      data: {
        items,
        pagination: {
          page,
          limit,
          total,
          total_pages: Math.ceil(total / limit),
        },
      },
    };
  },

  /**
   * Get employee by ID
   */
  async getById(id: number, company_id: number) {
    const employee = await prisma.employee.findFirst({
      where: { id, company_id, deleted_at: null },
    });

    if (!employee) {
      throw new ResourceNotFoundError('employee', id);
    }

    return { success: true, data: employee };
  },

  /**
   * Create new employee
   */
  async create(data: create_employee_body, company_id: number, user_id: number) {
    // Check if employee already exists for this user in this company
    const existingEmployee = await prisma.employee.findFirst({
      where: {
        company_id,
        user_id: data.user_id,
        deleted_at: null,
      },
    });

    if (existingEmployee) {
      throw new Error(`User ${data.user_id} is already an employee in this company`);
    }

    try {
      const result = await prisma.$transaction(async (tx) => {
        // Create employee
        const employee = await tx.employee.create({
          data: {
            ...data,
            company_id,
          },
        });

        // Create audit log
        await tx.audit_log.create({
          data: {
            user_id,
            company_id,
            action: 'CREATE',
            entity_type: 'employee',
            entity_id: employee.id,
            new_values: data,
          },
        });

        return employee;
      });

      return { success: true, data: result };
    } catch (e) {
      console.error('Create employee transaction failed:', e);
      throw new TransactionFailedError('employee creation');
    }
  },

  /**
   * Update employee
   */
  async update(
    id: number,
    data: update_employee_body,
    company_id: number,
    user_id: number
  ) {
    // Verify employee exists and belongs to company
    const existing = await prisma.employee.findFirst({
      where: { id, company_id, deleted_at: null },
    });

    if (!existing) {
      throw new ResourceNotFoundError('employee', id);
    }

    try {
      const result = await prisma.$transaction(async (tx) => {
        // Update employee
        const updated = await tx.employee.update({
          where: { id },
          data,
        });

        // Create audit log
        await tx.audit_log.create({
          data: {
            user_id,
            company_id,
            action: 'UPDATE',
            entity_type: 'employee',
            entity_id: id,
            old_values: existing,
            new_values: data,
          },
        });

        return updated;
      });

      return { success: true, data: result };
    } catch (e) {
      console.error('Update employee transaction failed:', e);
      throw new TransactionFailedError('employee update');
    }
  },

  /**
   * Delete employee (soft delete)
   */
  async delete(id: number, company_id: number, user_id: number) {
    // Verify employee exists and belongs to company
    const existing = await prisma.employee.findFirst({
      where: { id, company_id, deleted_at: null },
    });

    if (!existing) {
      throw new ResourceNotFoundError('employee', id);
    }

    try {
      await prisma.$transaction(async (tx) => {
        // Soft delete employee
        await tx.employee.update({
          where: { id },
          data: { deleted_at: new Date() },
        });

        // Create audit log
        await tx.audit_log.create({
          data: {
            user_id,
            company_id,
            action: 'DELETE',
            entity_type: 'employee',
            entity_id: id,
            old_values: existing,
          },
        });
      });

      return { success: true, message: 'employee deleted successfully' };
    } catch (e) {
      console.error('Delete employee transaction failed:', e);
      throw new TransactionFailedError('employee deletion');
    }
  },

  /**
   * Bulk create employees
   */
  async bulkCreate(data: bulk_create_employee_body, company_id: number, user_id: number) {
    try {
      const results = await prisma.$transaction(async (tx) => {
        const created = await tx.employee.createMany({
          data: data.items.map((item) => ({
            ...item,
            company_id,
          })),
        });

        // Create audit logs
        await tx.audit_log.create({
          data: {
            user_id,
            company_id,
            action: 'BULK_CREATE',
            entity_type: 'employee',
            entity_id: 0, // Bulk operation
            new_values: { count: created.count },
          },
        });

        return created;
      });

      return {
        success: true,
        data: {
          created: results.count,
          total: data.items.length,
        },
      };
    } catch (e) {
      console.error('Bulk create employee transaction failed:', e);
      throw new TransactionFailedError('Bulk employee creation');
    }
  },

  /**
   * Bulk update employees
   */
  async bulkUpdate(
    data: bulk_update_employee_body,
    company_id: number,
    user_id: number
  ) {
    try {
      const results = await prisma.$transaction(async (tx) => {
        // Verify all employees belong to company
        const existing = await tx.employee.findMany({
          where: {
            id: { in: data.ids },
            company_id,
            deleted_at: null,
          },
        });

        if (existing.length !== data.ids.length) {
          throw new Error('Some employees not found or do not belong to company');
        }

        // Update all employees
        const updated = await tx.employee.updateMany({
          where: { id: { in: data.ids } },
          data: data.data,
        });

        // Create audit log
        await tx.audit_log.create({
          data: {
            user_id,
            company_id,
            action: 'BULK_UPDATE',
            entity_type: 'employee',
            entity_id: 0, // Bulk operation
            new_values: { ids: data.ids, count: updated.count },
          },
        });

        return updated;
      });

      return {
        success: true,
        data: {
          updated: results.count,
          total: data.ids.length,
        },
      };
    } catch (e) {
      console.error('Bulk update employee transaction failed:', e);
      throw new TransactionFailedError('Bulk employee update');
    }
  },

  /**
   * Bulk delete employees
   */
  async bulkDelete(
    data: bulk_delete_employee_body,
    company_id: number,
    user_id: number
  ) {
    try {
      const results = await prisma.$transaction(async (tx) => {
        // Verify all employees belong to company
        const existing = await tx.employee.findMany({
          where: {
            id: { in: data.ids },
            company_id,
            deleted_at: null,
          },
        });

        if (existing.length !== data.ids.length) {
          throw new Error('Some employees not found or do not belong to company');
        }

        // Soft delete all employees
        const deleted = await tx.employee.updateMany({
          where: { id: { in: data.ids } },
          data: { deleted_at: new Date() },
        });

        // Create audit log
        await tx.audit_log.create({
          data: {
            user_id,
            company_id,
            action: 'BULK_DELETE',
            entity_type: 'employee',
            entity_id: 0, // Bulk operation
            old_values: { ids: data.ids, count: deleted.count },
          },
        });

        return deleted;
      });

      return {
        success: true,
        data: {
          deleted: results.count,
          total: data.ids.length,
        },
      };
    } catch (e) {
      console.error('Bulk delete employee transaction failed:', e);
      throw new TransactionFailedError('Bulk employee deletion');
    }
  },
};
