import { prisma } from '../config/prisma_client';
import {
  create_location_body,
  update_location_body,
  location_filters,
  bulk_create_location_body,
  bulk_update_location_body,
  bulk_delete_location_body,
} from '../validations/location.validation';
import {
  ResourceNotFoundError,
  UnauthorizedCompanyAccessError,
  TransactionFailedError,
} from '../errors';

export const location_service = {
  /**
   * Get all locations with pagination and filters
   * @param company_id - Company ID to filter by. If undefined, returns locations from all companies (SUPER_ADMIN only)
   */
  async getAll(company_id: number | undefined, filters: location_filters) {
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
      prisma.location.count({ where }),
      prisma.location.findMany({
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
   * Get location by ID
   */
  async getById(id: number, company_id: number) {
    const location = await prisma.location.findFirst({
      where: { id, company_id, deleted_at: null },
    });

    if (!location) {
      throw new ResourceNotFoundError('location', id);
    }

    return { success: true, data: location };
  },

  /**
   * Create new location
   */
  async create(data: create_location_body, company_id: number, user_id: number) {
    try {
      const result = await prisma.$transaction(async (tx) => {
        // Create location
        const location = await tx.location.create({
          data: {
            ...data,
            company_id,
            is_active: true,
          },
        });

        // Create audit log
        await tx.audit_log.create({
          data: {
            user_id,
            company_id,
            action: 'CREATE',
            entity_type: 'location',
            entity_id: location.id,
            new_values: data,
          },
        });

        return location;
      });

      return { success: true, data: result };
    } catch (e) {
      console.error('Create location transaction failed:', e);
      throw new TransactionFailedError('location creation');
    }
  },

  /**
   * Update location
   */
  async update(
    id: number,
    data: update_location_body,
    company_id: number,
    user_id: number
  ) {
    // Verify location exists and belongs to company
    const existing = await prisma.location.findFirst({
      where: { id, company_id, deleted_at: null },
    });

    if (!existing) {
      throw new ResourceNotFoundError('location', id);
    }

    try {
      const result = await prisma.$transaction(async (tx) => {
        // Update location
        const updated = await tx.location.update({
          where: { id },
          data,
        });

        // Create audit log
        await tx.audit_log.create({
          data: {
            user_id,
            company_id,
            action: 'UPDATE',
            entity_type: 'location',
            entity_id: id,
            old_values: existing,
            new_values: data,
          },
        });

        return updated;
      });

      return { success: true, data: result };
    } catch (e) {
      console.error('Update location transaction failed:', e);
      throw new TransactionFailedError('location update');
    }
  },

  /**
   * Delete location (soft delete)
   */
  async delete(id: number, company_id: number, user_id: number) {
    // Verify location exists and belongs to company
    const existing = await prisma.location.findFirst({
      where: { id, company_id, deleted_at: null },
    });

    if (!existing) {
      throw new ResourceNotFoundError('location', id);
    }

    try {
      await prisma.$transaction(async (tx) => {
        // Soft delete location
        await tx.location.update({
          where: { id },
          data: { deleted_at: new Date() },
        });

        // Create audit log
        await tx.audit_log.create({
          data: {
            user_id,
            company_id,
            action: 'DELETE',
            entity_type: 'location',
            entity_id: id,
            old_values: existing,
          },
        });
      });

      return { success: true, message: 'location deleted successfully' };
    } catch (e) {
      console.error('Delete location transaction failed:', e);
      throw new TransactionFailedError('location deletion');
    }
  },

  /**
   * Bulk create locations
   */
  async bulkCreate(data: bulk_create_location_body, company_id: number, user_id: number) {
    try {
      const results = await prisma.$transaction(async (tx) => {
        const created = await tx.location.createMany({
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
            entity_type: 'location',
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
      console.error('Bulk create location transaction failed:', e);
      throw new TransactionFailedError('Bulk location creation');
    }
  },

  /**
   * Bulk update locations
   */
  async bulkUpdate(
    data: bulk_update_location_body,
    company_id: number,
    user_id: number
  ) {
    try {
      const results = await prisma.$transaction(async (tx) => {
        // Verify all locations belong to company
        const existing = await tx.location.findMany({
          where: {
            id: { in: data.ids },
            company_id,
            deleted_at: null,
          },
        });

        if (existing.length !== data.ids.length) {
          throw new Error('Some locations not found or do not belong to company');
        }

        // Update all locations
        const updated = await tx.location.updateMany({
          where: { id: { in: data.ids } },
          data: data.data,
        });

        // Create audit log
        await tx.audit_log.create({
          data: {
            user_id,
            company_id,
            action: 'BULK_UPDATE',
            entity_type: 'location',
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
      console.error('Bulk update location transaction failed:', e);
      throw new TransactionFailedError('Bulk location update');
    }
  },

  /**
   * Bulk delete locations
   */
  async bulkDelete(
    data: bulk_delete_location_body,
    company_id: number,
    user_id: number
  ) {
    try {
      const results = await prisma.$transaction(async (tx) => {
        // Verify all locations belong to company
        const existing = await tx.location.findMany({
          where: {
            id: { in: data.ids },
            company_id,
            deleted_at: null,
          },
        });

        if (existing.length !== data.ids.length) {
          throw new Error('Some locations not found or do not belong to company');
        }

        // Soft delete all locations
        const deleted = await tx.location.updateMany({
          where: { id: { in: data.ids } },
          data: { deleted_at: new Date() },
        });

        // Create audit log
        await tx.audit_log.create({
          data: {
            user_id,
            company_id,
            action: 'BULK_DELETE',
            entity_type: 'location',
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
      console.error('Bulk delete location transaction failed:', e);
      throw new TransactionFailedError('Bulk location deletion');
    }
  },
};
