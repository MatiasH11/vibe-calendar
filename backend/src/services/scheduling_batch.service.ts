import { prisma } from '../config/prisma_client';
import {
  create_scheduling_batch_body,
  update_scheduling_batch_body,
  scheduling_batch_filters,
  bulk_create_scheduling_batch_body,
  bulk_update_scheduling_batch_body,
  bulk_delete_scheduling_batch_body,
} from '../validations/scheduling_batch.validation';
import {
  ResourceNotFoundError,
  UnauthorizedCompanyAccessError,
  TransactionFailedError,
} from '../errors';

export const scheduling_batch_service = {
  /**
   * Get all scheduling_batchs with pagination and filters
   */
  async getAll(company_id: number, filters: scheduling_batch_filters) {
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
      prisma.scheduling_batch.count({ where }),
      prisma.scheduling_batch.findMany({
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
   * Get scheduling_batch by ID
   */
  async getById(id: number, company_id: number) {
    const scheduling_batch = await prisma.scheduling_batch.findFirst({
      where: { id, company_id, deleted_at: null },
    });

    if (!scheduling_batch) {
      throw new ResourceNotFoundError('scheduling_batch', id);
    }

    return { success: true, data: scheduling_batch };
  },

  /**
   * Create new scheduling_batch
   */
  async create(data: create_scheduling_batch_body, company_id: number, user_id: number) {
    try {
      const result = await prisma.$transaction(async (tx) => {
        // Create scheduling_batch
        const scheduling_batch = await tx.scheduling_batch.create({
          data: {
            ...data,
            company_id,
            created_by: user_id,
          },
        });

        // Create audit log
        await tx.audit_log.create({
          data: {
            user_id,
            company_id,
            action: 'CREATE',
            entity_type: 'scheduling_batch',
            entity_id: scheduling_batch.id,
            new_values: data,
          },
        });

        return scheduling_batch;
      });

      return { success: true, data: result };
    } catch (e) {
      console.error('Create scheduling_batch transaction failed:', e);
      throw new TransactionFailedError('scheduling_batch creation');
    }
  },

  /**
   * Update scheduling_batch
   */
  async update(
    id: number,
    data: update_scheduling_batch_body,
    company_id: number,
    user_id: number
  ) {
    // Verify scheduling_batch exists and belongs to company
    const existing = await prisma.scheduling_batch.findFirst({
      where: { id, company_id, deleted_at: null },
    });

    if (!existing) {
      throw new ResourceNotFoundError('scheduling_batch', id);
    }

    try {
      const result = await prisma.$transaction(async (tx) => {
        // Update scheduling_batch
        const updated = await tx.scheduling_batch.update({
          where: { id },
          data,
        });

        // Create audit log
        await tx.audit_log.create({
          data: {
            user_id,
            company_id,
            action: 'UPDATE',
            entity_type: 'scheduling_batch',
            entity_id: id,
            old_values: existing,
            new_values: data,
          },
        });

        return updated;
      });

      return { success: true, data: result };
    } catch (e) {
      console.error('Update scheduling_batch transaction failed:', e);
      throw new TransactionFailedError('scheduling_batch update');
    }
  },

  /**
   * Delete scheduling_batch (soft delete)
   */
  async delete(id: number, company_id: number, user_id: number) {
    // Verify scheduling_batch exists and belongs to company
    const existing = await prisma.scheduling_batch.findFirst({
      where: { id, company_id, deleted_at: null },
    });

    if (!existing) {
      throw new ResourceNotFoundError('scheduling_batch', id);
    }

    try {
      await prisma.$transaction(async (tx) => {
        // Soft delete scheduling_batch
        await tx.scheduling_batch.update({
          where: { id },
          data: { deleted_at: new Date() },
        });

        // Create audit log
        await tx.audit_log.create({
          data: {
            user_id,
            company_id,
            action: 'DELETE',
            entity_type: 'scheduling_batch',
            entity_id: id,
            old_values: existing,
          },
        });
      });

      return { success: true, message: 'scheduling_batch deleted successfully' };
    } catch (e) {
      console.error('Delete scheduling_batch transaction failed:', e);
      throw new TransactionFailedError('scheduling_batch deletion');
    }
  },

  /**
   * Bulk create scheduling_batchs
   */
  async bulkCreate(data: bulk_create_scheduling_batch_body, company_id: number, user_id: number) {
    try {
      const results = await prisma.$transaction(async (tx) => {
        const created = await tx.scheduling_batch.createMany({
          data: data.items.map((item) => ({
            ...item,
            company_id,
            created_by: user_id,
          })),
        });

        // Create audit logs
        await tx.audit_log.create({
          data: {
            user_id,
            company_id,
            action: 'BULK_CREATE',
            entity_type: 'scheduling_batch',
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
      console.error('Bulk create scheduling_batch transaction failed:', e);
      throw new TransactionFailedError('Bulk scheduling_batch creation');
    }
  },

  /**
   * Bulk update scheduling_batchs
   */
  async bulkUpdate(
    data: bulk_update_scheduling_batch_body,
    company_id: number,
    user_id: number
  ) {
    try {
      const results = await prisma.$transaction(async (tx) => {
        // Verify all scheduling_batchs belong to company
        const existing = await tx.scheduling_batch.findMany({
          where: {
            id: { in: data.ids },
            company_id,
            deleted_at: null,
          },
        });

        if (existing.length !== data.ids.length) {
          throw new Error('Some scheduling_batchs not found or do not belong to company');
        }

        // Update all scheduling_batchs
        const updated = await tx.scheduling_batch.updateMany({
          where: { id: { in: data.ids } },
          data: data.data,
        });

        // Create audit log
        await tx.audit_log.create({
          data: {
            user_id,
            company_id,
            action: 'BULK_UPDATE',
            entity_type: 'scheduling_batch',
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
      console.error('Bulk update scheduling_batch transaction failed:', e);
      throw new TransactionFailedError('Bulk scheduling_batch update');
    }
  },

  /**
   * Bulk delete scheduling_batchs
   */
  async bulkDelete(
    data: bulk_delete_scheduling_batch_body,
    company_id: number,
    user_id: number
  ) {
    try {
      const results = await prisma.$transaction(async (tx) => {
        // Verify all scheduling_batchs belong to company
        const existing = await tx.scheduling_batch.findMany({
          where: {
            id: { in: data.ids },
            company_id,
            deleted_at: null,
          },
        });

        if (existing.length !== data.ids.length) {
          throw new Error('Some scheduling_batchs not found or do not belong to company');
        }

        // Soft delete all scheduling_batchs
        const deleted = await tx.scheduling_batch.updateMany({
          where: { id: { in: data.ids } },
          data: { deleted_at: new Date() },
        });

        // Create audit log
        await tx.audit_log.create({
          data: {
            user_id,
            company_id,
            action: 'BULK_DELETE',
            entity_type: 'scheduling_batch',
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
      console.error('Bulk delete scheduling_batch transaction failed:', e);
      throw new TransactionFailedError('Bulk scheduling_batch deletion');
    }
  },
};
