import { PrismaClient } from '@prisma/client';
import { prisma } from '../config/prisma_client';

/**
 * Base Repository Pattern (PLAN.md 6.1)
 * Provides generic CRUD operations for all entities
 * Benefits:
 * - Centralized database access logic
 * - Easier testing with mocks/stubs
 * - Consistent query patterns
 * - Better separation of concerns (Repository vs Service layers)
 */

/**
 * Generic filter for soft-deleted entities
 */
export interface SoftDeleteFilter {
  deleted_at?: null | { not: null };
}

/**
 * Pagination options
 */
export interface PaginationOptions {
  page?: number;
  limit?: number;
}

/**
 * Pagination result
 */
export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * Base Repository class with generic CRUD operations
 * All specific repositories should extend this class
 *
 * @template T - The Prisma model type (e.g., shift, company_employee)
 * @template TDelegate - The Prisma delegate type for the model
 */
export abstract class BaseRepository<T, TDelegate> {
  protected abstract delegate: TDelegate;
  protected abstract modelName: string;

  /**
   * Find a single record by ID
   * Automatically filters out soft-deleted records
   *
   * @param id - The record ID
   * @param options - Additional query options (include, select, etc.)
   * @returns The record or null if not found
   */
  async findById(id: number, options?: any): Promise<T | null> {
    const where: any = { id, deleted_at: null };

    return (this.delegate as any).findFirst({
      where,
      ...options,
    });
  }

  /**
   * Find multiple records by IDs
   * Automatically filters out soft-deleted records
   *
   * @param ids - Array of record IDs
   * @param options - Additional query options
   * @returns Array of records
   */
  async findByIds(ids: number[], options?: any): Promise<T[]> {
    const where: any = {
      id: { in: ids },
      deleted_at: null,
    };

    return (this.delegate as any).findMany({
      where,
      ...options,
    });
  }

  /**
   * Find all records matching a condition
   * Automatically filters out soft-deleted records unless specified
   *
   * @param where - Where conditions
   * @param options - Additional query options (orderBy, include, etc.)
   * @returns Array of records
   */
  async findMany(where: any = {}, options?: any): Promise<T[]> {
    // Add soft delete filter if not explicitly overridden
    if (!where.deleted_at) {
      where.deleted_at = null;
    }

    return (this.delegate as any).findMany({
      where,
      ...options,
    });
  }

  /**
   * Find first record matching a condition
   * Automatically filters out soft-deleted records
   *
   * @param where - Where conditions
   * @param options - Additional query options
   * @returns The first matching record or null
   */
  async findFirst(where: any = {}, options?: any): Promise<T | null> {
    if (!where.deleted_at) {
      where.deleted_at = null;
    }

    return (this.delegate as any).findFirst({
      where,
      ...options,
    });
  }

  /**
   * Find records with pagination
   *
   * @param where - Where conditions
   * @param pagination - Pagination options
   * @param options - Additional query options
   * @returns Paginated result with data and pagination metadata
   */
  async findManyPaginated(
    where: any = {},
    pagination: PaginationOptions = {},
    options?: any
  ): Promise<PaginatedResult<T>> {
    const page = pagination.page || 1;
    const limit = Math.min(pagination.limit || 50, 100); // Max 100 per page
    const skip = (page - 1) * limit;

    if (!where.deleted_at) {
      where.deleted_at = null;
    }

    const [data, total] = await Promise.all([
      (this.delegate as any).findMany({
        where,
        skip,
        take: limit,
        ...options,
      }),
      (this.delegate as any).count({ where }),
    ]);

    return {
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Count records matching a condition
   *
   * @param where - Where conditions
   * @returns Number of matching records
   */
  async count(where: any = {}): Promise<number> {
    if (!where.deleted_at) {
      where.deleted_at = null;
    }

    return (this.delegate as any).count({ where });
  }

  /**
   * Create a new record
   *
   * @param data - Record data
   * @param options - Additional query options
   * @returns Created record
   */
  async create(data: any, options?: any): Promise<T> {
    return (this.delegate as any).create({
      data,
      ...options,
    });
  }

  /**
   * Create multiple records
   *
   * @param data - Array of record data
   * @returns Result with count of created records
   */
  async createMany(data: any[]): Promise<{ count: number }> {
    return (this.delegate as any).createMany({
      data,
    });
  }

  /**
   * Update a record by ID
   *
   * @param id - Record ID
   * @param data - Updated data
   * @param options - Additional query options
   * @returns Updated record
   */
  async update(id: number, data: any, options?: any): Promise<T> {
    return (this.delegate as any).update({
      where: { id },
      data,
      ...options,
    });
  }

  /**
   * Update multiple records
   *
   * @param where - Where conditions
   * @param data - Updated data
   * @returns Result with count of updated records
   */
  async updateMany(where: any, data: any): Promise<{ count: number }> {
    return (this.delegate as any).updateMany({
      where,
      data,
    });
  }

  /**
   * Soft delete a record by ID
   * Sets deleted_at to current timestamp
   *
   * @param id - Record ID
   * @returns Updated record with deleted_at set
   */
  async softDelete(id: number): Promise<T> {
    return (this.delegate as any).update({
      where: { id },
      data: { deleted_at: new Date() },
    });
  }

  /**
   * Soft delete multiple records
   *
   * @param where - Where conditions
   * @returns Result with count of deleted records
   */
  async softDeleteMany(where: any): Promise<{ count: number }> {
    return (this.delegate as any).updateMany({
      where,
      data: { deleted_at: new Date() },
    });
  }

  /**
   * Hard delete a record by ID
   * Permanently removes from database
   *
   * @param id - Record ID
   * @returns Deleted record
   */
  async delete(id: number): Promise<T> {
    return (this.delegate as any).delete({
      where: { id },
    });
  }

  /**
   * Hard delete multiple records
   *
   * @param where - Where conditions
   * @returns Result with count of deleted records
   */
  async deleteMany(where: any): Promise<{ count: number }> {
    return (this.delegate as any).deleteMany({
      where,
    });
  }

  /**
   * Upsert a record (create or update)
   *
   * @param where - Unique where conditions
   * @param create - Data for creating if not exists
   * @param update - Data for updating if exists
   * @param options - Additional query options
   * @returns Created or updated record
   */
  async upsert(where: any, create: any, update: any, options?: any): Promise<T> {
    return (this.delegate as any).upsert({
      where,
      create,
      update,
      ...options,
    });
  }

  /**
   * Execute a raw query
   * Use with caution - prefer typed methods when possible
   *
   * @param transaction - Optional Prisma transaction client
   * @returns Transaction client or default prisma client
   */
  protected getClient(transaction?: PrismaClient): PrismaClient {
    return transaction || prisma;
  }
}
