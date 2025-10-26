import { prisma } from '../config/prisma_client';
import {
  create_company_body,
  update_company_body,
  company_filters,
  bulk_create_company_body,
  bulk_update_company_body,
  bulk_delete_company_body,
} from '../validations/company.validation';
import {
  ResourceNotFoundError,
  TransactionFailedError,
} from '../errors';

export const company_service = {
  /**
   * Get all companies with pagination and filters
   */
  async getAll(filters: company_filters) {
    const page = parseInt(filters.page || '1');
    const limit = Math.min(parseInt(filters.limit || '50'), 100);
    const skip = (page - 1) * limit;

    const where: any = {
      deleted_at: null,
    };

    // Add search filter
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { business_name: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    // Add is_active filter
    if (filters.is_active) {
      where.is_active = filters.is_active === 'true';
    }

    // Get total count and items
    const [total, items] = await Promise.all([
      prisma.company.count({ where }),
      prisma.company.findMany({
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
   * Get company by ID
   */
  async getById(id: number) {
    const company = await prisma.company.findFirst({
      where: { id, deleted_at: null },
    });

    if (!company) {
      throw new ResourceNotFoundError('Company', id);
    }

    return { success: true, data: company };
  },

  /**
   * Create new company
   */
  async create(data: create_company_body, user_id: number) {
    try {
      const result = await prisma.$transaction(async (tx) => {
        // Create company
        const company = await tx.company.create({
          data: data as any,
        });

        // Create audit log using the new company's ID
        await tx.audit_log.create({
          data: {
            user_id,
            company_id: company.id,
            action: 'CREATE',
            entity_type: 'company',
            entity_id: company.id,
            new_values: data,
          },
        });

        return company;
      });

      return { success: true, data: result };
    } catch (e) {
      console.error('Create company transaction failed:', e);
      throw new TransactionFailedError('Company creation');
    }
  },

  /**
   * Update company
   */
  async update(
    id: number,
    data: update_company_body,
    user_id: number
  ) {
    // Verify company exists
    const existing = await prisma.company.findFirst({
      where: { id, deleted_at: null },
    });

    if (!existing) {
      throw new ResourceNotFoundError('Company', id);
    }

    try {
      const result = await prisma.$transaction(async (tx) => {
        // Update company
        const updated = await tx.company.update({
          where: { id },
          data,
        });

        // Create audit log
        await tx.audit_log.create({
          data: {
            user_id,
            company_id: id,
            action: 'UPDATE',
            entity_type: 'company',
            entity_id: id,
            old_values: existing,
            new_values: data,
          },
        });

        return updated;
      });

      return { success: true, data: result };
    } catch (e) {
      console.error('Update company transaction failed:', e);
      throw new TransactionFailedError('Company update');
    }
  },

  /**
   * Delete company (soft delete)
   */
  async delete(id: number, user_id: number) {
    // Verify company exists
    const existing = await prisma.company.findFirst({
      where: { id, deleted_at: null },
    });

    if (!existing) {
      throw new ResourceNotFoundError('Company', id);
    }

    try {
      await prisma.$transaction(async (tx) => {
        // Soft delete company
        await tx.company.update({
          where: { id },
          data: { deleted_at: new Date() },
        });

        // Create audit log
        await tx.audit_log.create({
          data: {
            user_id,
            company_id: id,
            action: 'DELETE',
            entity_type: 'company',
            entity_id: id,
            old_values: existing,
          },
        });
      });

      return { success: true, message: 'Company deleted successfully' };
    } catch (e) {
      console.error('Delete company transaction failed:', e);
      throw new TransactionFailedError('Company deletion');
    }
  },

  /**
   * Bulk create companies
   */
  async bulkCreate(data: bulk_create_company_body, user_id: number) {
    try {
      const results = await prisma.$transaction(async (tx) => {
        // Create companies one by one to get their IDs for audit logs
        const created = [];
        for (const item of data.items) {
          const company = await tx.company.create({
            data: item as any,
          });
          created.push(company);

          // Create individual audit log
          await tx.audit_log.create({
            data: {
              user_id,
              company_id: company.id,
              action: 'CREATE',
              entity_type: 'company',
              entity_id: company.id,
              new_values: item,
            },
          });
        }

        return { count: created.length };
      });

      return {
        success: true,
        data: {
          created: results.count,
          total: data.items.length,
        },
      };
    } catch (e) {
      console.error('Bulk create company transaction failed:', e);
      throw new TransactionFailedError('Bulk Company creation');
    }
  },

  /**
   * Bulk update companies
   */
  async bulkUpdate(
    data: bulk_update_company_body,
    user_id: number
  ) {
    try {
      const results = await prisma.$transaction(async (tx) => {
        // Verify all companies exist
        const existing = await tx.company.findMany({
          where: {
            id: { in: data.ids },
            deleted_at: null,
          },
        });

        if (existing.length !== data.ids.length) {
          throw new Error('Some companies not found');
        }

        // Update all companies
        const updated = await tx.company.updateMany({
          where: { id: { in: data.ids } },
          data: data.data,
        });

        // Create audit logs for each company
        for (const id of data.ids) {
          await tx.audit_log.create({
            data: {
              user_id,
              company_id: id,
              action: 'UPDATE',
              entity_type: 'company',
              entity_id: id,
              new_values: data.data,
            },
          });
        }

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
      console.error('Bulk update company transaction failed:', e);
      throw new TransactionFailedError('Bulk Company update');
    }
  },

  /**
   * Bulk delete companies
   */
  async bulkDelete(
    data: bulk_delete_company_body,
    user_id: number
  ) {
    try {
      const results = await prisma.$transaction(async (tx) => {
        // Verify all companies exist
        const existing = await tx.company.findMany({
          where: {
            id: { in: data.ids },
            deleted_at: null,
          },
        });

        if (existing.length !== data.ids.length) {
          throw new Error('Some companies not found');
        }

        // Soft delete all companies
        const deleted = await tx.company.updateMany({
          where: { id: { in: data.ids } },
          data: { deleted_at: new Date() },
        });

        // Create audit logs for each company
        for (const id of data.ids) {
          await tx.audit_log.create({
            data: {
              user_id,
              company_id: id,
              action: 'DELETE',
              entity_type: 'company',
              entity_id: id,
              old_values: existing.find(c => c.id === id),
            },
          });
        }

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
      console.error('Bulk delete company transaction failed:', e);
      throw new TransactionFailedError('Bulk Company deletion');
    }
  },
};
