import { prisma } from '../config/prisma_client';
import {
  create_department_body,
  update_department_body,
  department_filters,
  bulk_create_department_body,
  bulk_update_department_body,
  bulk_delete_department_body,
} from '../validations/department.validation';
import {
  ResourceNotFoundError,
  UnauthorizedCompanyAccessError,
  TransactionFailedError,
} from '../errors';

export const department_service = {
  /**
   * Get all departments with pagination and filters
   */
  async getAll(company_id: number, filters: department_filters) {
    const page = parseInt(filters.page || '1');
    const limit = Math.min(parseInt(filters.limit || '50'), 100);
    const skip = (page - 1) * limit;

    const where: any = {
      company_id,
      deleted_at: null,
    };

    // Add search filter
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    // Add is_active filter
    if (filters.is_active) {
      where.is_active = filters.is_active === 'true';
    }

    // Get total count and items
    const [total, items] = await Promise.all([
      prisma.department.count({ where }),
      prisma.department.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          [filters.sort_by || 'created_at']: filters.sort_order || 'desc',
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
   * Get department by ID
   */
  async getById(id: number, company_id: number) {
    const department = await prisma.department.findFirst({
      where: { id, company_id, deleted_at: null },
    });

    if (!department) {
      throw new ResourceNotFoundError('department', id);
    }

    return { success: true, data: department };
  },

  /**
   * Create new department
   */
  async create(data: create_department_body, company_id: number, user_id: number) {
    try {
      const result = await prisma.$transaction(async (tx) => {
        // Create department
        const department = await tx.department.create({
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
            entity_type: 'department',
            entity_id: department.id,
            new_values: data,
          },
        });

        return department;
      });

      return { success: true, data: result };
    } catch (e) {
      console.error('Create department transaction failed:', e);
      throw new TransactionFailedError('department creation');
    }
  },

  /**
   * Update department
   */
  async update(
    id: number,
    data: update_department_body,
    company_id: number,
    user_id: number
  ) {
    // Verify department exists and belongs to company
    const existing = await prisma.department.findFirst({
      where: { id, company_id, deleted_at: null },
    });

    if (!existing) {
      throw new ResourceNotFoundError('department', id);
    }

    try {
      const result = await prisma.$transaction(async (tx) => {
        // Update department
        const updated = await tx.department.update({
          where: { id },
          data,
        });

        // Create audit log
        await tx.audit_log.create({
          data: {
            user_id,
            company_id,
            action: 'UPDATE',
            entity_type: 'department',
            entity_id: id,
            old_values: existing,
            new_values: data,
          },
        });

        return updated;
      });

      return { success: true, data: result };
    } catch (e) {
      console.error('Update department transaction failed:', e);
      throw new TransactionFailedError('department update');
    }
  },

  /**
   * Delete department (soft delete)
   */
  async delete(id: number, company_id: number, user_id: number) {
    // Verify department exists and belongs to company
    const existing = await prisma.department.findFirst({
      where: { id, company_id, deleted_at: null },
    });

    if (!existing) {
      throw new ResourceNotFoundError('department', id);
    }

    try {
      await prisma.$transaction(async (tx) => {
        // Soft delete department
        await tx.department.update({
          where: { id },
          data: { deleted_at: new Date() },
        });

        // Create audit log
        await tx.audit_log.create({
          data: {
            user_id,
            company_id,
            action: 'DELETE',
            entity_type: 'department',
            entity_id: id,
            old_values: existing,
          },
        });
      });

      return { success: true, message: 'department deleted successfully' };
    } catch (e) {
      console.error('Delete department transaction failed:', e);
      throw new TransactionFailedError('department deletion');
    }
  },

  /**
   * Bulk create departments
   */
  async bulkCreate(data: bulk_create_department_body, company_id: number, user_id: number) {
    try {
      const results = await prisma.$transaction(async (tx) => {
        const created = await tx.department.createMany({
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
            entity_type: 'department',
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
      console.error('Bulk create department transaction failed:', e);
      throw new TransactionFailedError('Bulk department creation');
    }
  },

  /**
   * Bulk update departments
   */
  async bulkUpdate(
    data: bulk_update_department_body,
    company_id: number,
    user_id: number
  ) {
    try {
      const results = await prisma.$transaction(async (tx) => {
        // Verify all departments belong to company
        const existing = await tx.department.findMany({
          where: {
            id: { in: data.ids },
            company_id,
            deleted_at: null,
          },
        });

        if (existing.length !== data.ids.length) {
          throw new Error('Some departments not found or do not belong to company');
        }

        // Update all departments
        const updated = await tx.department.updateMany({
          where: { id: { in: data.ids } },
          data: data.data,
        });

        // Create audit log
        await tx.audit_log.create({
          data: {
            user_id,
            company_id,
            action: 'BULK_UPDATE',
            entity_type: 'department',
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
      console.error('Bulk update department transaction failed:', e);
      throw new TransactionFailedError('Bulk department update');
    }
  },

  /**
   * Bulk delete departments
   */
  async bulkDelete(
    data: bulk_delete_department_body,
    company_id: number,
    user_id: number
  ) {
    try {
      const results = await prisma.$transaction(async (tx) => {
        // Verify all departments belong to company
        const existing = await tx.department.findMany({
          where: {
            id: { in: data.ids },
            company_id,
            deleted_at: null,
          },
        });

        if (existing.length !== data.ids.length) {
          throw new Error('Some departments not found or do not belong to company');
        }

        // Soft delete all departments
        const deleted = await tx.department.updateMany({
          where: { id: { in: data.ids } },
          data: { deleted_at: new Date() },
        });

        // Create audit log
        await tx.audit_log.create({
          data: {
            user_id,
            company_id,
            action: 'BULK_DELETE',
            entity_type: 'department',
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
      console.error('Bulk delete department transaction failed:', e);
      throw new TransactionFailedError('Bulk department deletion');
    }
  },
};
