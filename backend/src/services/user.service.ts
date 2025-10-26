import { prisma } from '../config/prisma_client';
import {
  create_user_body,
  update_user_body,
  user_filters,
  bulk_create_user_body,
  bulk_update_user_body,
  bulk_delete_user_body,
} from '../validations/user.validation';
import {
  ResourceNotFoundError,
  UnauthorizedCompanyAccessError,
  TransactionFailedError,
  EmailAlreadyExistsError,
} from '../errors';
import bcrypt from 'bcryptjs';
import { AUTH_CONSTANTS } from '../constants/auth';

/**
 * Exclude password_hash from user object
 */
const excludePasswordHash = (user: any) => {
  const { password_hash, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

export const user_service = {
  /**
   * Get all users with pagination and filters
   * Note: Users are filtered by company through the employee relationship
   */
  async getAll(company_id: number, filters: user_filters) {
    const page = parseInt(filters.page || '1');
    const limit = Math.min(parseInt(filters.limit || '50'), 100);
    const skip = (page - 1) * limit;

    const where: any = {
      deleted_at: null,
      employees: {
        some: {
          company_id,
          deleted_at: null,
        },
      },
    };

    // Add search filter (search by first_name, last_name, or email)
    if (filters.search) {
      where.OR = [
        { first_name: { contains: filters.search, mode: 'insensitive' } },
        { last_name: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    // Add is_active filter
    if (filters.is_active) {
      where.is_active = filters.is_active === 'true';
    }

    // Get total count and items
    const [total, items] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          [filters.sort_by || 'created_at']: filters.sort_order || 'desc',
        },
      }),
    ]);

    // Exclude password_hash from all items
    const itemsWithoutPassword = items.map(excludePasswordHash);

    return {
      success: true,
      data: {
        items: itemsWithoutPassword,
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
   * Get user by ID
   * Note: Verifies user belongs to company through employee relationship
   */
  async getById(id: number, company_id: number) {
    const user = await prisma.user.findFirst({
      where: {
        id,
        deleted_at: null,
        employees: {
          some: {
            company_id,
            deleted_at: null,
          },
        },
      },
    });

    if (!user) {
      throw new ResourceNotFoundError('user', id);
    }

    return { success: true, data: excludePasswordHash(user) };
  },

  /**
   * Create new user
   * Note: User is created without direct company association
   * Use employee endpoint to link user to company
   */
  async create(data: create_user_body, company_id: number, user_id: number) {
    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new EmailAlreadyExistsError(data.email);
    }

    // Hash password
    const password_hash = await bcrypt.hash(
      data.password,
      AUTH_CONSTANTS.BCRYPT_SALT_ROUNDS
    );

    try {
      const result = await prisma.$transaction(async (tx) => {
        // Create user (extract password and replace with password_hash)
        const { password, ...userData } = data;
        const user = await tx.user.create({
          data: {
            ...userData,
            password_hash,
          },
        });

        // Create audit log
        await tx.audit_log.create({
          data: {
            user_id,
            company_id,
            action: 'CREATE',
            entity_type: 'user',
            entity_id: user.id,
            new_values: { ...userData }, // Don't log password
          },
        });

        return user;
      });

      return { success: true, data: excludePasswordHash(result) };
    } catch (e) {
      console.error('Create user transaction failed:', e);
      throw new TransactionFailedError('user creation');
    }
  },

  /**
   * Update user
   */
  async update(
    id: number,
    data: update_user_body,
    company_id: number,
    user_id: number
  ) {
    // Verify user exists and belongs to company through employee relationship
    const existing = await prisma.user.findFirst({
      where: {
        id,
        deleted_at: null,
        employees: {
          some: {
            company_id,
            deleted_at: null,
          },
        },
      },
    });

    if (!existing) {
      throw new ResourceNotFoundError('user', id);
    }

    try {
      const result = await prisma.$transaction(async (tx) => {
        // Update user
        const updated = await tx.user.update({
          where: { id },
          data,
        });

        // Create audit log
        await tx.audit_log.create({
          data: {
            user_id,
            company_id,
            action: 'UPDATE',
            entity_type: 'user',
            entity_id: id,
            old_values: excludePasswordHash(existing),
            new_values: data,
          },
        });

        return updated;
      });

      return { success: true, data: excludePasswordHash(result) };
    } catch (e) {
      console.error('Update user transaction failed:', e);
      throw new TransactionFailedError('user update');
    }
  },

  /**
   * Delete user (soft delete)
   */
  async delete(id: number, company_id: number, user_id: number) {
    // Verify user exists and belongs to company through employee relationship
    const existing = await prisma.user.findFirst({
      where: {
        id,
        deleted_at: null,
        employees: {
          some: {
            company_id,
            deleted_at: null,
          },
        },
      },
    });

    if (!existing) {
      throw new ResourceNotFoundError('user', id);
    }

    try {
      await prisma.$transaction(async (tx) => {
        // Soft delete user
        await tx.user.update({
          where: { id },
          data: { deleted_at: new Date() },
        });

        // Create audit log
        await tx.audit_log.create({
          data: {
            user_id,
            company_id,
            action: 'DELETE',
            entity_type: 'user',
            entity_id: id,
            old_values: excludePasswordHash(existing),
          },
        });
      });

      return { success: true, message: 'user deleted successfully' };
    } catch (e) {
      console.error('Delete user transaction failed:', e);
      throw new TransactionFailedError('user deletion');
    }
  },

  /**
   * Bulk create users
   */
  async bulkCreate(data: bulk_create_user_body, company_id: number, user_id: number) {
    // Check for duplicate emails in the batch
    const emails = data.items.map(item => item.email);
    const existingUsers = await prisma.user.findMany({
      where: { email: { in: emails } },
    });

    if (existingUsers.length > 0) {
      throw new Error(`Email already exists: ${existingUsers[0].email}`);
    }

    try {
      // Hash passwords for all users
      const usersWithHashedPasswords = await Promise.all(
        data.items.map(async (item) => {
          const { password, ...userData } = item;
          const password_hash = await bcrypt.hash(
            password,
            AUTH_CONSTANTS.BCRYPT_SALT_ROUNDS
          );
          return {
            ...userData,
            password_hash,
          };
        })
      );

      const results = await prisma.$transaction(async (tx) => {
        const created = await tx.user.createMany({
          data: usersWithHashedPasswords,
        });

        // Create audit log
        await tx.audit_log.create({
          data: {
            user_id,
            company_id,
            action: 'BULK_CREATE',
            entity_type: 'user',
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
      console.error('Bulk create user transaction failed:', e);
      throw new TransactionFailedError('Bulk user creation');
    }
  },

  /**
   * Bulk update users
   */
  async bulkUpdate(
    data: bulk_update_user_body,
    company_id: number,
    user_id: number
  ) {
    try {
      const results = await prisma.$transaction(async (tx) => {
        // Verify all users belong to company through employee relationship
        const existing = await tx.user.findMany({
          where: {
            id: { in: data.ids },
            deleted_at: null,
            employees: {
              some: {
                company_id,
                deleted_at: null,
              },
            },
          },
        });

        if (existing.length !== data.ids.length) {
          throw new Error('Some users not found or do not belong to company');
        }

        // Update all users
        const updated = await tx.user.updateMany({
          where: { id: { in: data.ids } },
          data: data.data,
        });

        // Create audit log
        await tx.audit_log.create({
          data: {
            user_id,
            company_id,
            action: 'BULK_UPDATE',
            entity_type: 'user',
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
      console.error('Bulk update user transaction failed:', e);
      throw new TransactionFailedError('Bulk user update');
    }
  },

  /**
   * Bulk delete users
   */
  async bulkDelete(
    data: bulk_delete_user_body,
    company_id: number,
    user_id: number
  ) {
    try {
      const results = await prisma.$transaction(async (tx) => {
        // Verify all users belong to company through employee relationship
        const existing = await tx.user.findMany({
          where: {
            id: { in: data.ids },
            deleted_at: null,
            employees: {
              some: {
                company_id,
                deleted_at: null,
              },
            },
          },
        });

        if (existing.length !== data.ids.length) {
          throw new Error('Some users not found or do not belong to company');
        }

        // Soft delete all users
        const deleted = await tx.user.updateMany({
          where: { id: { in: data.ids } },
          data: { deleted_at: new Date() },
        });

        // Create audit log
        await tx.audit_log.create({
          data: {
            user_id,
            company_id,
            action: 'BULK_DELETE',
            entity_type: 'user',
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
      console.error('Bulk delete user transaction failed:', e);
      throw new TransactionFailedError('Bulk user deletion');
    }
  },
};
