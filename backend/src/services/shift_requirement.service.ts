import { prisma } from '../config/prisma_client';
import {
  create_shift_requirement_body,
  update_shift_requirement_body,
  shift_requirement_filters,
  bulk_create_shift_requirement_body,
  bulk_update_shift_requirement_body,
  bulk_delete_shift_requirement_body,
} from '../validations/shift_requirement.validation';
import {
  ResourceNotFoundError,
  UnauthorizedCompanyAccessError,
  TransactionFailedError,
} from '../errors';

export const shift_requirement_service = {
  /**
   * Get all shift_requirements with pagination and filters
   */
  async getAll(company_id: number, filters: shift_requirement_filters) {
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
      prisma.shift_requirement.count({ where }),
      prisma.shift_requirement.findMany({
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
   * Get shift_requirement by ID
   */
  async getById(id: number, company_id: number) {
    const shift_requirement = await prisma.shift_requirement.findFirst({
      where: { id, company_id, deleted_at: null },
    });

    if (!shift_requirement) {
      throw new ResourceNotFoundError('shift_requirement', id);
    }

    return { success: true, data: shift_requirement };
  },

  /**
   * Create new shift_requirement
   */
  async create(data: create_shift_requirement_body, company_id: number, user_id: number) {
    try {
      const result = await prisma.$transaction(async (tx) => {
        // Create shift_requirement
        const shift_requirement = await tx.shift_requirement.create({
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
            entity_type: 'shift_requirement',
            entity_id: shift_requirement.id,
            new_values: data,
          },
        });

        return shift_requirement;
      });

      return { success: true, data: result };
    } catch (e) {
      console.error('Create shift_requirement transaction failed:', e);
      throw new TransactionFailedError('shift_requirement creation');
    }
  },

  /**
   * Update shift_requirement
   */
  async update(
    id: number,
    data: update_shift_requirement_body,
    company_id: number,
    user_id: number
  ) {
    // Verify shift_requirement exists and belongs to company
    const existing = await prisma.shift_requirement.findFirst({
      where: { id, company_id, deleted_at: null },
    });

    if (!existing) {
      throw new ResourceNotFoundError('shift_requirement', id);
    }

    try {
      const result = await prisma.$transaction(async (tx) => {
        // Update shift_requirement
        const updated = await tx.shift_requirement.update({
          where: { id },
          data,
        });

        // Create audit log
        await tx.audit_log.create({
          data: {
            user_id,
            company_id,
            action: 'UPDATE',
            entity_type: 'shift_requirement',
            entity_id: id,
            old_values: existing,
            new_values: data,
          },
        });

        return updated;
      });

      return { success: true, data: result };
    } catch (e) {
      console.error('Update shift_requirement transaction failed:', e);
      throw new TransactionFailedError('shift_requirement update');
    }
  },

  /**
   * Delete shift_requirement (soft delete)
   */
  async delete(id: number, company_id: number, user_id: number) {
    // Verify shift_requirement exists and belongs to company
    const existing = await prisma.shift_requirement.findFirst({
      where: { id, company_id, deleted_at: null },
    });

    if (!existing) {
      throw new ResourceNotFoundError('shift_requirement', id);
    }

    try {
      await prisma.$transaction(async (tx) => {
        // Soft delete shift_requirement
        await tx.shift_requirement.update({
          where: { id },
          data: { deleted_at: new Date() },
        });

        // Create audit log
        await tx.audit_log.create({
          data: {
            user_id,
            company_id,
            action: 'DELETE',
            entity_type: 'shift_requirement',
            entity_id: id,
            old_values: existing,
          },
        });
      });

      return { success: true, message: 'shift_requirement deleted successfully' };
    } catch (e) {
      console.error('Delete shift_requirement transaction failed:', e);
      throw new TransactionFailedError('shift_requirement deletion');
    }
  },

  /**
   * Bulk create shift_requirements
   */
  async bulkCreate(data: bulk_create_shift_requirement_body, company_id: number, user_id: number) {
    try {
      const results = await prisma.$transaction(async (tx) => {
        const created = await tx.shift_requirement.createMany({
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
            entity_type: 'shift_requirement',
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
      console.error('Bulk create shift_requirement transaction failed:', e);
      throw new TransactionFailedError('Bulk shift_requirement creation');
    }
  },

  /**
   * Bulk update shift_requirements
   */
  async bulkUpdate(
    data: bulk_update_shift_requirement_body,
    company_id: number,
    user_id: number
  ) {
    try {
      const results = await prisma.$transaction(async (tx) => {
        // Verify all shift_requirements belong to company
        const existing = await tx.shift_requirement.findMany({
          where: {
            id: { in: data.ids },
            company_id,
            deleted_at: null,
          },
        });

        if (existing.length !== data.ids.length) {
          throw new Error('Some shift_requirements not found or do not belong to company');
        }

        // Update all shift_requirements
        const updated = await tx.shift_requirement.updateMany({
          where: { id: { in: data.ids } },
          data: data.data,
        });

        // Create audit log
        await tx.audit_log.create({
          data: {
            user_id,
            company_id,
            action: 'BULK_UPDATE',
            entity_type: 'shift_requirement',
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
      console.error('Bulk update shift_requirement transaction failed:', e);
      throw new TransactionFailedError('Bulk shift_requirement update');
    }
  },

  /**
   * Bulk delete shift_requirements
   */
  async bulkDelete(
    data: bulk_delete_shift_requirement_body,
    company_id: number,
    user_id: number
  ) {
    try {
      const results = await prisma.$transaction(async (tx) => {
        // Verify all shift_requirements belong to company
        const existing = await tx.shift_requirement.findMany({
          where: {
            id: { in: data.ids },
            company_id,
            deleted_at: null,
          },
        });

        if (existing.length !== data.ids.length) {
          throw new Error('Some shift_requirements not found or do not belong to company');
        }

        // Soft delete all shift_requirements
        const deleted = await tx.shift_requirement.updateMany({
          where: { id: { in: data.ids } },
          data: { deleted_at: new Date() },
        });

        // Create audit log
        await tx.audit_log.create({
          data: {
            user_id,
            company_id,
            action: 'BULK_DELETE',
            entity_type: 'shift_requirement',
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
      console.error('Bulk delete shift_requirement transaction failed:', e);
      throw new TransactionFailedError('Bulk shift_requirement deletion');
    }
  },
};
