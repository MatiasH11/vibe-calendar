import { prisma } from '../config/prisma_client';
import {
  create_day_template_body,
  update_day_template_body,
  day_template_filters,
  bulk_create_day_template_body,
  bulk_update_day_template_body,
  bulk_delete_day_template_body,
} from '../validations/day_template.validation';
import {
  ResourceNotFoundError,
  UnauthorizedCompanyAccessError,
  TransactionFailedError,
} from '../errors';

export const day_template_service = {
  /**
   * Get all day_templates with pagination and filters
   */
  async getAll(company_id: number, filters: day_template_filters) {
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
      prisma.day_template.count({ where }),
      prisma.day_template.findMany({
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
   * Get day_template by ID
   */
  async getById(id: number, company_id: number) {
    const day_template = await prisma.day_template.findFirst({
      where: { id, company_id, deleted_at: null },
    });

    if (!day_template) {
      throw new ResourceNotFoundError('day_template', id);
    }

    return { success: true, data: day_template };
  },

  /**
   * Create new day_template
   */
  async create(data: create_day_template_body, company_id: number, user_id: number) {
    try {
      const result = await prisma.$transaction(async (tx) => {
        // Create day_template
        const day_template = await tx.day_template.create({
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
            entity_type: 'day_template',
            entity_id: day_template.id,
            new_values: data,
          },
        });

        return day_template;
      });

      return { success: true, data: result };
    } catch (e) {
      console.error('Create day_template transaction failed:', e);
      throw new TransactionFailedError('day_template creation');
    }
  },

  /**
   * Update day_template
   */
  async update(
    id: number,
    data: update_day_template_body,
    company_id: number,
    user_id: number
  ) {
    // Verify day_template exists and belongs to company
    const existing = await prisma.day_template.findFirst({
      where: { id, company_id, deleted_at: null },
    });

    if (!existing) {
      throw new ResourceNotFoundError('day_template', id);
    }

    try {
      const result = await prisma.$transaction(async (tx) => {
        // Update day_template
        const updated = await tx.day_template.update({
          where: { id },
          data,
        });

        // Create audit log
        await tx.audit_log.create({
          data: {
            user_id,
            company_id,
            action: 'UPDATE',
            entity_type: 'day_template',
            entity_id: id,
            old_values: existing,
            new_values: data,
          },
        });

        return updated;
      });

      return { success: true, data: result };
    } catch (e) {
      console.error('Update day_template transaction failed:', e);
      throw new TransactionFailedError('day_template update');
    }
  },

  /**
   * Delete day_template (soft delete)
   */
  async delete(id: number, company_id: number, user_id: number) {
    // Verify day_template exists and belongs to company
    const existing = await prisma.day_template.findFirst({
      where: { id, company_id, deleted_at: null },
    });

    if (!existing) {
      throw new ResourceNotFoundError('day_template', id);
    }

    try {
      await prisma.$transaction(async (tx) => {
        // Soft delete day_template
        await tx.day_template.update({
          where: { id },
          data: { deleted_at: new Date() },
        });

        // Create audit log
        await tx.audit_log.create({
          data: {
            user_id,
            company_id,
            action: 'DELETE',
            entity_type: 'day_template',
            entity_id: id,
            old_values: existing,
          },
        });
      });

      return { success: true, message: 'day_template deleted successfully' };
    } catch (e) {
      console.error('Delete day_template transaction failed:', e);
      throw new TransactionFailedError('day_template deletion');
    }
  },

  /**
   * Bulk create day_templates
   */
  async bulkCreate(data: bulk_create_day_template_body, company_id: number, user_id: number) {
    try {
      const results = await prisma.$transaction(async (tx) => {
        const created = await tx.day_template.createMany({
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
            entity_type: 'day_template',
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
      console.error('Bulk create day_template transaction failed:', e);
      throw new TransactionFailedError('Bulk day_template creation');
    }
  },

  /**
   * Bulk update day_templates
   */
  async bulkUpdate(
    data: bulk_update_day_template_body,
    company_id: number,
    user_id: number
  ) {
    try {
      const results = await prisma.$transaction(async (tx) => {
        // Verify all day_templates belong to company
        const existing = await tx.day_template.findMany({
          where: {
            id: { in: data.ids },
            company_id,
            deleted_at: null,
          },
        });

        if (existing.length !== data.ids.length) {
          throw new Error('Some day_templates not found or do not belong to company');
        }

        // Update all day_templates
        const updated = await tx.day_template.updateMany({
          where: { id: { in: data.ids } },
          data: data.data,
        });

        // Create audit log
        await tx.audit_log.create({
          data: {
            user_id,
            company_id,
            action: 'BULK_UPDATE',
            entity_type: 'day_template',
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
      console.error('Bulk update day_template transaction failed:', e);
      throw new TransactionFailedError('Bulk day_template update');
    }
  },

  /**
   * Bulk delete day_templates
   */
  async bulkDelete(
    data: bulk_delete_day_template_body,
    company_id: number,
    user_id: number
  ) {
    try {
      const results = await prisma.$transaction(async (tx) => {
        // Verify all day_templates belong to company
        const existing = await tx.day_template.findMany({
          where: {
            id: { in: data.ids },
            company_id,
            deleted_at: null,
          },
        });

        if (existing.length !== data.ids.length) {
          throw new Error('Some day_templates not found or do not belong to company');
        }

        // Soft delete all day_templates
        const deleted = await tx.day_template.updateMany({
          where: { id: { in: data.ids } },
          data: { deleted_at: new Date() },
        });

        // Create audit log
        await tx.audit_log.create({
          data: {
            user_id,
            company_id,
            action: 'BULK_DELETE',
            entity_type: 'day_template',
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
      console.error('Bulk delete day_template transaction failed:', e);
      throw new TransactionFailedError('Bulk day_template deletion');
    }
  },
};
