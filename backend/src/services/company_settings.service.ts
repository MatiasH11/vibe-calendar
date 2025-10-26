import { prisma } from '../config/prisma_client';
import {
  create_company_settings_body,
  update_company_settings_body,
  company_settings_filters,
  bulk_create_company_settings_body,
  bulk_update_company_settings_body,
  bulk_delete_company_settings_body,
} from '../validations/company_settings.validation';
import {
  ResourceNotFoundError,
  UnauthorizedCompanyAccessError,
  TransactionFailedError,
} from '../errors';

export const company_settings_service = {
  /**
   * Get all company_settings with pagination and filters
   * Note: Usually only one settings record per company
   */
  async getAll(company_id: number, filters: company_settings_filters) {
    const page = parseInt(filters.page || '1');
    const limit = Math.min(parseInt(filters.limit || '50'), 100);
    const skip = (page - 1) * limit;

    const where: any = {
      company_id,
    };

    // Get total count and items
    const [total, items] = await Promise.all([
      prisma.company_settings.count({ where }),
      prisma.company_settings.findMany({
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
   * Get company_settings by ID
   */
  async getById(id: number, company_id: number) {
    const company_settings = await prisma.company_settings.findFirst({
      where: { id, company_id },
    });

    if (!company_settings) {
      throw new ResourceNotFoundError('company_settings', id);
    }

    return { success: true, data: company_settings };
  },

  /**
   * Create new company_settings
   */
  async create(data: create_company_settings_body, company_id: number, user_id: number) {
    try {
      const result = await prisma.$transaction(async (tx) => {
        // Create company_settings
        const company_settings = await tx.company_settings.create({
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
            entity_type: 'company_settings',
            entity_id: company_settings.id,
            new_values: data,
          },
        });

        return company_settings;
      });

      return { success: true, data: result };
    } catch (e) {
      console.error('Create company_settings transaction failed:', e);
      throw new TransactionFailedError('company_settings creation');
    }
  },

  /**
   * Update company_settings
   */
  async update(
    id: number,
    data: update_company_settings_body,
    company_id: number,
    user_id: number
  ) {
    // Verify company_settings exists and belongs to company
    const existing = await prisma.company_settings.findFirst({
      where: { id, company_id },
    });

    if (!existing) {
      throw new ResourceNotFoundError('company_settings', id);
    }

    try {
      const result = await prisma.$transaction(async (tx) => {
        // Update company_settings
        const updated = await tx.company_settings.update({
          where: { id },
          data,
        });

        // Create audit log
        await tx.audit_log.create({
          data: {
            user_id,
            company_id,
            action: 'UPDATE',
            entity_type: 'company_settings',
            entity_id: id,
            old_values: existing,
            new_values: data,
          },
        });

        return updated;
      });

      return { success: true, data: result };
    } catch (e) {
      console.error('Update company_settings transaction failed:', e);
      throw new TransactionFailedError('company_settings update');
    }
  },

  /**
   * Delete company_settings (hard delete)
   * Note: company_settings does not support soft delete
   */
  async delete(id: number, company_id: number, user_id: number) {
    // Verify company_settings exists and belongs to company
    const existing = await prisma.company_settings.findFirst({
      where: { id, company_id },
    });

    if (!existing) {
      throw new ResourceNotFoundError('company_settings', id);
    }

    try {
      await prisma.$transaction(async (tx) => {
        // Hard delete company_settings
        await tx.company_settings.delete({
          where: { id },
        });

        // Create audit log
        await tx.audit_log.create({
          data: {
            user_id,
            company_id,
            action: 'DELETE',
            entity_type: 'company_settings',
            entity_id: id,
            old_values: existing,
          },
        });
      });

      return { success: true, message: 'company_settings deleted successfully' };
    } catch (e) {
      console.error('Delete company_settings transaction failed:', e);
      throw new TransactionFailedError('company_settings deletion');
    }
  },

  /**
   * Bulk create company_settingss
   */
  async bulkCreate(data: bulk_create_company_settings_body, company_id: number, user_id: number) {
    try {
      const results = await prisma.$transaction(async (tx) => {
        const created = await tx.company_settings.createMany({
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
            entity_type: 'company_settings',
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
      console.error('Bulk create company_settings transaction failed:', e);
      throw new TransactionFailedError('Bulk company_settings creation');
    }
  },

  /**
   * Bulk update company_settings
   */
  async bulkUpdate(
    data: bulk_update_company_settings_body,
    company_id: number,
    user_id: number
  ) {
    try {
      const results = await prisma.$transaction(async (tx) => {
        // Verify all company_settings belong to company
        const existing = await tx.company_settings.findMany({
          where: {
            id: { in: data.ids },
            company_id,
          },
        });

        if (existing.length !== data.ids.length) {
          throw new Error('Some company_settings not found or do not belong to company');
        }

        // Update all company_settings
        const updated = await tx.company_settings.updateMany({
          where: { id: { in: data.ids } },
          data: data.data,
        });

        // Create audit log
        await tx.audit_log.create({
          data: {
            user_id,
            company_id,
            action: 'BULK_UPDATE',
            entity_type: 'company_settings',
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
      console.error('Bulk update company_settings transaction failed:', e);
      throw new TransactionFailedError('Bulk company_settings update');
    }
  },

  /**
   * Bulk delete company_settings (hard delete)
   * Note: company_settings does not support soft delete
   */
  async bulkDelete(
    data: bulk_delete_company_settings_body,
    company_id: number,
    user_id: number
  ) {
    try {
      const results = await prisma.$transaction(async (tx) => {
        // Verify all company_settings belong to company
        const existing = await tx.company_settings.findMany({
          where: {
            id: { in: data.ids },
            company_id,
          },
        });

        if (existing.length !== data.ids.length) {
          throw new Error('Some company_settings not found or do not belong to company');
        }

        // Hard delete all company_settings
        const deleted = await tx.company_settings.deleteMany({
          where: { id: { in: data.ids } },
        });

        // Create audit log
        await tx.audit_log.create({
          data: {
            user_id,
            company_id,
            action: 'BULK_DELETE',
            entity_type: 'company_settings',
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
      console.error('Bulk delete company_settings transaction failed:', e);
      throw new TransactionFailedError('Bulk company_settings deletion');
    }
  },
};
