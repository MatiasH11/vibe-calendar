import { prisma } from '../config/prisma_client';
import {
  create_template_shift_position_body,
  update_template_shift_position_body,
  template_shift_position_filters,
  bulk_create_template_shift_position_body,
  bulk_update_template_shift_position_body,
  bulk_delete_template_shift_position_body,
} from '../validations/template_shift_position.validation';
import {
  ResourceNotFoundError,
  UnauthorizedCompanyAccessError,
  TransactionFailedError,
} from '../errors';

export const template_shift_position_service = {
  /**
   * Get all template_shift_positions with pagination and filters
   */
  async getAll(company_id: number, filters: template_shift_position_filters) {
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
      prisma.template_shift_position.count({ where }),
      prisma.template_shift_position.findMany({
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
   * Get template_shift_position by ID
   */
  async getById(id: number, company_id: number) {
    const template_shift_position = await prisma.template_shift_position.findFirst({
      where: { id, company_id, deleted_at: null },
    });

    if (!template_shift_position) {
      throw new ResourceNotFoundError('template_shift_position', id);
    }

    return { success: true, data: template_shift_position };
  },

  /**
   * Create new template_shift_position
   */
  async create(data: create_template_shift_position_body, company_id: number, user_id: number) {
    try {
      const result = await prisma.$transaction(async (tx) => {
        // Create template_shift_position
        const template_shift_position = await tx.template_shift_position.create({
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
            entity_type: 'template_shift_position',
            entity_id: template_shift_position.id,
            new_values: data,
          },
        });

        return template_shift_position;
      });

      return { success: true, data: result };
    } catch (e) {
      console.error('Create template_shift_position transaction failed:', e);
      throw new TransactionFailedError('template_shift_position creation');
    }
  },

  /**
   * Update template_shift_position
   */
  async update(
    id: number,
    data: update_template_shift_position_body,
    company_id: number,
    user_id: number
  ) {
    // Verify template_shift_position exists and belongs to company
    const existing = await prisma.template_shift_position.findFirst({
      where: { id, company_id, deleted_at: null },
    });

    if (!existing) {
      throw new ResourceNotFoundError('template_shift_position', id);
    }

    try {
      const result = await prisma.$transaction(async (tx) => {
        // Update template_shift_position
        const updated = await tx.template_shift_position.update({
          where: { id },
          data,
        });

        // Create audit log
        await tx.audit_log.create({
          data: {
            user_id,
            company_id,
            action: 'UPDATE',
            entity_type: 'template_shift_position',
            entity_id: id,
            old_values: existing,
            new_values: data,
          },
        });

        return updated;
      });

      return { success: true, data: result };
    } catch (e) {
      console.error('Update template_shift_position transaction failed:', e);
      throw new TransactionFailedError('template_shift_position update');
    }
  },

  /**
   * Delete template_shift_position (soft delete)
   */
  async delete(id: number, company_id: number, user_id: number) {
    // Verify template_shift_position exists and belongs to company
    const existing = await prisma.template_shift_position.findFirst({
      where: { id, company_id, deleted_at: null },
    });

    if (!existing) {
      throw new ResourceNotFoundError('template_shift_position', id);
    }

    try {
      await prisma.$transaction(async (tx) => {
        // Soft delete template_shift_position
        await tx.template_shift_position.update({
          where: { id },
          data: { deleted_at: new Date() },
        });

        // Create audit log
        await tx.audit_log.create({
          data: {
            user_id,
            company_id,
            action: 'DELETE',
            entity_type: 'template_shift_position',
            entity_id: id,
            old_values: existing,
          },
        });
      });

      return { success: true, message: 'template_shift_position deleted successfully' };
    } catch (e) {
      console.error('Delete template_shift_position transaction failed:', e);
      throw new TransactionFailedError('template_shift_position deletion');
    }
  },

  /**
   * Bulk create template_shift_positions
   */
  async bulkCreate(data: bulk_create_template_shift_position_body, company_id: number, user_id: number) {
    try {
      const results = await prisma.$transaction(async (tx) => {
        const created = await tx.template_shift_position.createMany({
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
            entity_type: 'template_shift_position',
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
      console.error('Bulk create template_shift_position transaction failed:', e);
      throw new TransactionFailedError('Bulk template_shift_position creation');
    }
  },

  /**
   * Bulk update template_shift_positions
   */
  async bulkUpdate(
    data: bulk_update_template_shift_position_body,
    company_id: number,
    user_id: number
  ) {
    try {
      const results = await prisma.$transaction(async (tx) => {
        // Verify all template_shift_positions belong to company
        const existing = await tx.template_shift_position.findMany({
          where: {
            id: { in: data.ids },
            company_id,
            deleted_at: null,
          },
        });

        if (existing.length !== data.ids.length) {
          throw new Error('Some template_shift_positions not found or do not belong to company');
        }

        // Update all template_shift_positions
        const updated = await tx.template_shift_position.updateMany({
          where: { id: { in: data.ids } },
          data: data.data,
        });

        // Create audit log
        await tx.audit_log.create({
          data: {
            user_id,
            company_id,
            action: 'BULK_UPDATE',
            entity_type: 'template_shift_position',
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
      console.error('Bulk update template_shift_position transaction failed:', e);
      throw new TransactionFailedError('Bulk template_shift_position update');
    }
  },

  /**
   * Bulk delete template_shift_positions
   */
  async bulkDelete(
    data: bulk_delete_template_shift_position_body,
    company_id: number,
    user_id: number
  ) {
    try {
      const results = await prisma.$transaction(async (tx) => {
        // Verify all template_shift_positions belong to company
        const existing = await tx.template_shift_position.findMany({
          where: {
            id: { in: data.ids },
            company_id,
            deleted_at: null,
          },
        });

        if (existing.length !== data.ids.length) {
          throw new Error('Some template_shift_positions not found or do not belong to company');
        }

        // Soft delete all template_shift_positions
        const deleted = await tx.template_shift_position.updateMany({
          where: { id: { in: data.ids } },
          data: { deleted_at: new Date() },
        });

        // Create audit log
        await tx.audit_log.create({
          data: {
            user_id,
            company_id,
            action: 'BULK_DELETE',
            entity_type: 'template_shift_position',
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
      console.error('Bulk delete template_shift_position transaction failed:', e);
      throw new TransactionFailedError('Bulk template_shift_position deletion');
    }
  },
};
