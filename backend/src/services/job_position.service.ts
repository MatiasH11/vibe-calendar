import { prisma } from '../config/prisma_client';
import {
  create_job_position_body,
  update_job_position_body,
  job_position_filters,
  bulk_create_job_position_body,
  bulk_update_job_position_body,
  bulk_delete_job_position_body,
} from '../validations/job_position.validation';
import {
  ResourceNotFoundError,
  UnauthorizedCompanyAccessError,
  TransactionFailedError,
} from '../errors';

export const job_position_service = {
  /**
   * Get all job_positions with pagination and filters
   * @param company_id - Company ID to filter by. If undefined, returns job positions from all companies (SUPER_ADMIN only)
   */
  async getAll(company_id: number | undefined, filters: job_position_filters) {
    const page = parseInt(filters.page || '1');
    const limit = Math.min(parseInt(filters.limit || '50'), 100);
    const skip = (page - 1) * limit;

    const where: any = {
      deleted_at: null,
    };

    // Only filter by company_id if provided (USER role)
    // SUPER_ADMIN can view all companies by passing undefined
    if (company_id !== undefined) {
      where.company_id = company_id;
    }

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
      prisma.job_position.count({ where }),
      prisma.job_position.findMany({
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
   * Get job_position by ID
   */
  async getById(id: number, company_id: number) {
    const job_position = await prisma.job_position.findFirst({
      where: { id, company_id, deleted_at: null },
    });

    if (!job_position) {
      throw new ResourceNotFoundError('job_position', id);
    }

    return { success: true, data: job_position };
  },

  /**
   * Create new job_position
   */
  async create(data: create_job_position_body, company_id: number, user_id: number) {
    try {
      const result = await prisma.$transaction(async (tx) => {
        // Create job_position
        const job_position = await tx.job_position.create({
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
            entity_type: 'job_position',
            entity_id: job_position.id,
            new_values: data,
          },
        });

        return job_position;
      });

      return { success: true, data: result };
    } catch (e) {
      console.error('Create job_position transaction failed:', e);
      throw new TransactionFailedError('job_position creation');
    }
  },

  /**
   * Update job_position
   */
  async update(
    id: number,
    data: update_job_position_body,
    company_id: number,
    user_id: number
  ) {
    // Verify job_position exists and belongs to company
    const existing = await prisma.job_position.findFirst({
      where: { id, company_id, deleted_at: null },
    });

    if (!existing) {
      throw new ResourceNotFoundError('job_position', id);
    }

    try {
      const result = await prisma.$transaction(async (tx) => {
        // Update job_position
        const updated = await tx.job_position.update({
          where: { id },
          data,
        });

        // Create audit log
        await tx.audit_log.create({
          data: {
            user_id,
            company_id,
            action: 'UPDATE',
            entity_type: 'job_position',
            entity_id: id,
            old_values: existing,
            new_values: data,
          },
        });

        return updated;
      });

      return { success: true, data: result };
    } catch (e) {
      console.error('Update job_position transaction failed:', e);
      throw new TransactionFailedError('job_position update');
    }
  },

  /**
   * Delete job_position (soft delete)
   */
  async delete(id: number, company_id: number, user_id: number) {
    // Verify job_position exists and belongs to company
    const existing = await prisma.job_position.findFirst({
      where: { id, company_id, deleted_at: null },
    });

    if (!existing) {
      throw new ResourceNotFoundError('job_position', id);
    }

    try {
      await prisma.$transaction(async (tx) => {
        // Soft delete job_position
        await tx.job_position.update({
          where: { id },
          data: { deleted_at: new Date() },
        });

        // Create audit log
        await tx.audit_log.create({
          data: {
            user_id,
            company_id,
            action: 'DELETE',
            entity_type: 'job_position',
            entity_id: id,
            old_values: existing,
          },
        });
      });

      return { success: true, message: 'job_position deleted successfully' };
    } catch (e) {
      console.error('Delete job_position transaction failed:', e);
      throw new TransactionFailedError('job_position deletion');
    }
  },

  /**
   * Bulk create job_positions
   */
  async bulkCreate(data: bulk_create_job_position_body, company_id: number, user_id: number) {
    try {
      const results = await prisma.$transaction(async (tx) => {
        const created = await tx.job_position.createMany({
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
            entity_type: 'job_position',
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
      console.error('Bulk create job_position transaction failed:', e);
      throw new TransactionFailedError('Bulk job_position creation');
    }
  },

  /**
   * Bulk update job_positions
   */
  async bulkUpdate(
    data: bulk_update_job_position_body,
    company_id: number,
    user_id: number
  ) {
    try {
      const results = await prisma.$transaction(async (tx) => {
        // Verify all job_positions belong to company
        const existing = await tx.job_position.findMany({
          where: {
            id: { in: data.ids },
            company_id,
            deleted_at: null,
          },
        });

        if (existing.length !== data.ids.length) {
          throw new Error('Some job_positions not found or do not belong to company');
        }

        // Update all job_positions
        const updated = await tx.job_position.updateMany({
          where: { id: { in: data.ids } },
          data: data.data,
        });

        // Create audit log
        await tx.audit_log.create({
          data: {
            user_id,
            company_id,
            action: 'BULK_UPDATE',
            entity_type: 'job_position',
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
      console.error('Bulk update job_position transaction failed:', e);
      throw new TransactionFailedError('Bulk job_position update');
    }
  },

  /**
   * Bulk delete job_positions
   */
  async bulkDelete(
    data: bulk_delete_job_position_body,
    company_id: number,
    user_id: number
  ) {
    try {
      const results = await prisma.$transaction(async (tx) => {
        // Verify all job_positions belong to company
        const existing = await tx.job_position.findMany({
          where: {
            id: { in: data.ids },
            company_id,
            deleted_at: null,
          },
        });

        if (existing.length !== data.ids.length) {
          throw new Error('Some job_positions not found or do not belong to company');
        }

        // Soft delete all job_positions
        const deleted = await tx.job_position.updateMany({
          where: { id: { in: data.ids } },
          data: { deleted_at: new Date() },
        });

        // Create audit log
        await tx.audit_log.create({
          data: {
            user_id,
            company_id,
            action: 'BULK_DELETE',
            entity_type: 'job_position',
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
      console.error('Bulk delete job_position transaction failed:', e);
      throw new TransactionFailedError('Bulk job_position deletion');
    }
  },
};
