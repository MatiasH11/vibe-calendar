import { prisma } from '../config/prisma_client';
import {
  create_template_shift_body,
  update_template_shift_body,
  template_shift_filters,
  bulk_create_template_shift_body,
  bulk_update_template_shift_body,
  bulk_delete_template_shift_body,
} from '../validations/template_shift.validation';
import {
  ResourceNotFoundError,
  UnauthorizedCompanyAccessError,
  TransactionFailedError,
} from '../errors';

export const template_shift_service = {
  /**
   * Get all template_shifts with pagination and filters
   */
  async getAll(company_id: number, filters: template_shift_filters) {
    const page = parseInt(filters.page || '1');
    const limit = Math.min(parseInt(filters.limit || '50'), 100);
    const skip = (page - 1) * limit;

    const where: any = {
      day_template: {
        company_id,
        deleted_at: null,
      },
    };

    // Add search filter
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    // Get total count and items
    const [total, items] = await Promise.all([
      prisma.template_shift.count({ where }),
      prisma.template_shift.findMany({
        where,
        skip,
        take: limit,
        include: {
          day_template: true,
          position_requirements: {
            include: { job_position: true },
          },
        },
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
   * Get template_shift by ID
   */
  async getById(id: number, company_id: number) {
    const template_shift = await prisma.template_shift.findFirst({
      where: {
        id,
        day_template: {
          company_id,
          deleted_at: null,
        },
      },
      include: {
        day_template: true,
        position_requirements: {
          include: { job_position: true },
        },
      },
    });

    if (!template_shift) {
      throw new ResourceNotFoundError('template_shift', id);
    }

    return { success: true, data: template_shift };
  },

  /**
   * Create new template_shift
   */
  async create(data: create_template_shift_body, company_id: number, user_id: number) {
    try {
      // Verify day_template exists and belongs to company
      const day_template = await prisma.day_template.findFirst({
        where: {
          id: data.day_template_id,
          company_id,
          deleted_at: null,
        },
      });

      if (!day_template) {
        throw new ResourceNotFoundError('day_template', data.day_template_id);
      }

      const result = await prisma.$transaction(async (tx) => {
        // Create template_shift
        const template_shift = await tx.template_shift.create({
          data,
          include: {
            day_template: true,
            position_requirements: {
              include: { job_position: true },
            },
          },
        });

        // Create audit log
        await tx.audit_log.create({
          data: {
            user_id,
            company_id,
            action: 'CREATE',
            entity_type: 'template_shift',
            entity_id: template_shift.id,
            new_values: data,
          },
        });

        return template_shift;
      });

      return { success: true, data: result };
    } catch (e) {
      console.error('Create template_shift transaction failed:', e);
      throw new TransactionFailedError('template_shift creation');
    }
  },

  /**
   * Update template_shift
   */
  async update(
    id: number,
    data: update_template_shift_body,
    company_id: number,
    user_id: number
  ) {
    // Verify template_shift exists and belongs to company
    const existing = await prisma.template_shift.findFirst({
      where: {
        id,
        day_template: {
          company_id,
          deleted_at: null,
        },
      },
    });

    if (!existing) {
      throw new ResourceNotFoundError('template_shift', id);
    }

    try {
      const result = await prisma.$transaction(async (tx) => {
        // Update template_shift
        const updated = await tx.template_shift.update({
          where: { id },
          data,
          include: {
            day_template: true,
            position_requirements: {
              include: { job_position: true },
            },
          },
        });

        // Create audit log
        await tx.audit_log.create({
          data: {
            user_id,
            company_id,
            action: 'UPDATE',
            entity_type: 'template_shift',
            entity_id: id,
            old_values: existing,
            new_values: data,
          },
        });

        return updated;
      });

      return { success: true, data: result };
    } catch (e) {
      console.error('Update template_shift transaction failed:', e);
      throw new TransactionFailedError('template_shift update');
    }
  },

  /**
   * Delete template_shift (soft delete)
   */
  async delete(id: number, company_id: number, user_id: number) {
    // Verify template_shift exists and belongs to company
    const existing = await prisma.template_shift.findFirst({
      where: {
        id,
        day_template: {
          company_id,
          deleted_at: null,
        },
      },
    });

    if (!existing) {
      throw new ResourceNotFoundError('template_shift', id);
    }

    try {
      await prisma.$transaction(async (tx) => {
        // Soft delete template_shift
        await tx.template_shift.update({
          where: { id },
          data: { deleted_at: new Date() },
        });

        // Create audit log
        await tx.audit_log.create({
          data: {
            user_id,
            company_id,
            action: 'DELETE',
            entity_type: 'template_shift',
            entity_id: id,
            old_values: existing,
          },
        });
      });

      return { success: true, message: 'template_shift deleted successfully' };
    } catch (e) {
      console.error('Delete template_shift transaction failed:', e);
      throw new TransactionFailedError('template_shift deletion');
    }
  },

  /**
   * Bulk create template_shifts
   */
  async bulkCreate(data: bulk_create_template_shift_body, company_id: number, user_id: number) {
    try {
      const results = await prisma.$transaction(async (tx) => {
        // Verify all day_templates exist and belong to company
        const day_templates = await tx.day_template.findMany({
          where: {
            id: { in: data.items.map((item) => item.day_template_id) },
            company_id,
            deleted_at: null,
          },
        });

        if (day_templates.length !== data.items.length) {
          throw new Error('Some day_templates not found or do not belong to company');
        }

        const created = await tx.template_shift.createMany({
          data: data.items,
        });

        // Create audit logs
        await tx.audit_log.create({
          data: {
            user_id,
            company_id,
            action: 'BULK_CREATE',
            entity_type: 'template_shift',
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
      console.error('Bulk create template_shift transaction failed:', e);
      throw new TransactionFailedError('Bulk template_shift creation');
    }
  },

  /**
   * Bulk update template_shifts
   */
  async bulkUpdate(
    data: bulk_update_template_shift_body,
    company_id: number,
    user_id: number
  ) {
    try {
      const results = await prisma.$transaction(async (tx) => {
        // Verify all template_shifts belong to company (through day_template)
        const existing = await tx.template_shift.findMany({
          where: {
            id: { in: data.ids },
            day_template: {
              company_id,
              deleted_at: null,
            },
          },
        });

        if (existing.length !== data.ids.length) {
          throw new Error('Some template_shifts not found or do not belong to company');
        }

        // Update all template_shifts
        const updated = await tx.template_shift.updateMany({
          where: { id: { in: data.ids } },
          data: data.data,
        });

        // Create audit log
        await tx.audit_log.create({
          data: {
            user_id,
            company_id,
            action: 'BULK_UPDATE',
            entity_type: 'template_shift',
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
      console.error('Bulk update template_shift transaction failed:', e);
      throw new TransactionFailedError('Bulk template_shift update');
    }
  },

  /**
   * Bulk delete template_shifts
   */
  async bulkDelete(
    data: bulk_delete_template_shift_body,
    company_id: number,
    user_id: number
  ) {
    try {
      const results = await prisma.$transaction(async (tx) => {
        // Verify all template_shifts belong to company (through day_template)
        const existing = await tx.template_shift.findMany({
          where: {
            id: { in: data.ids },
            day_template: {
              company_id,
              deleted_at: null,
            },
          },
        });

        if (existing.length !== data.ids.length) {
          throw new Error('Some template_shifts not found or do not belong to company');
        }

        // Soft delete all template_shifts
        const deleted = await tx.template_shift.updateMany({
          where: { id: { in: data.ids } },
          data: { deleted_at: new Date() },
        });

        // Create audit log
        await tx.audit_log.create({
          data: {
            user_id,
            company_id,
            action: 'BULK_DELETE',
            entity_type: 'template_shift',
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
      console.error('Bulk delete template_shift transaction failed:', e);
      throw new TransactionFailedError('Bulk template_shift deletion');
    }
  },
};
