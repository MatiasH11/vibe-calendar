import { shift, shift_status, Prisma, PrismaClient } from '@prisma/client';
import { prisma } from '../config/prisma_client';
import { BaseRepository } from './base.repository';

/**
 * Shift Repository (PLAN.md 6.1)
 * Handles all database operations for shifts
 * Encapsulates complex queries and business logic related to data access
 */

export interface ShiftFilters {
  company_id?: number;
  company_employee_id?: number;
  shift_date?: Date | { gte?: Date; lte?: Date };
  start_date?: Date;
  end_date?: Date;
  status?: shift_status;
  employee_ids?: number[];
}

export interface ShiftWithRelations extends shift {
  company_employee?: {
    id: number;
    company_id: number;
    user_id: number;
    role_id: number;
    position: string | null;
    is_active: boolean;
    user: {
      id: number;
      first_name: string;
      last_name: string;
      email: string;
    };
  };
}

export class ShiftRepository extends BaseRepository<shift, typeof prisma.shift> {
  protected delegate = prisma.shift;
  protected modelName = 'shift';

  /**
   * Find shifts by company ID (via company_employee relationship)
   *
   * @param companyId - Company ID
   * @param filters - Additional filters
   * @param options - Query options (include, orderBy, etc.)
   * @returns Array of shifts
   */
  async findByCompany(
    companyId: number,
    filters: ShiftFilters = {},
    options?: any
  ): Promise<ShiftWithRelations[]> {
    const where: any = {
      company_employee: {
        company_id: companyId,
        deleted_at: null,
      },
      deleted_at: null,
    };

    // Apply date range filters
    if (filters.start_date && filters.end_date) {
      where.shift_date = {
        gte: filters.start_date,
        lte: filters.end_date,
      };
    } else if (filters.shift_date) {
      where.shift_date = filters.shift_date;
    }

    // Apply employee filter
    if (filters.company_employee_id) {
      where.company_employee_id = filters.company_employee_id;
    }

    // Apply employee IDs filter (multiple employees)
    if (filters.employee_ids && filters.employee_ids.length > 0) {
      where.company_employee_id = { in: filters.employee_ids };
    }

    // Apply status filter
    if (filters.status) {
      where.status = filters.status;
    }

    return this.delegate.findMany({
      where,
      include: {
        company_employee: {
          include: {
            user: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: [{ shift_date: 'asc' }, { start_time: 'asc' }],
      ...options,
    }) as Promise<ShiftWithRelations[]>;
  }

  /**
   * Find shifts for a specific employee
   *
   * @param companyEmployeeId - Company employee ID
   * @param filters - Additional filters
   * @param options - Query options
   * @returns Array of shifts
   */
  async findByEmployee(
    companyEmployeeId: number,
    filters: ShiftFilters = {},
    options?: any
  ): Promise<shift[]> {
    const where: any = {
      company_employee_id: companyEmployeeId,
      deleted_at: null,
    };

    if (filters.start_date && filters.end_date) {
      where.shift_date = {
        gte: filters.start_date,
        lte: filters.end_date,
      };
    }

    if (filters.status) {
      where.status = filters.status;
    }

    return this.delegate.findMany({
      where,
      orderBy: [{ shift_date: 'asc' }, { start_time: 'asc' }],
      ...options,
    });
  }

  /**
   * Find shifts for a specific date
   *
   * @param companyEmployeeId - Company employee ID
   * @param shiftDate - Shift date
   * @returns Array of shifts for that date
   */
  async findByEmployeeAndDate(
    companyEmployeeId: number,
    shiftDate: Date
  ): Promise<shift[]> {
    return this.delegate.findMany({
      where: {
        company_employee_id: companyEmployeeId,
        shift_date: shiftDate,
        deleted_at: null,
      },
      orderBy: { start_time: 'asc' },
    });
  }

  /**
   * Find shifts for a date range (used for conflict detection)
   *
   * @param companyEmployeeId - Company employee ID
   * @param dates - Array of dates to check
   * @returns Array of shifts
   */
  async findByEmployeeAndDates(
    companyEmployeeId: number,
    dates: Date[]
  ): Promise<shift[]> {
    return this.delegate.findMany({
      where: {
        company_employee_id: companyEmployeeId,
        shift_date: { in: dates },
        deleted_at: null,
      },
      orderBy: [{ shift_date: 'asc' }, { start_time: 'asc' }],
    });
  }

  /**
   * Find shifts for weekly hours calculation
   *
   * @param companyEmployeeId - Company employee ID
   * @param weekStart - Start of week
   * @param weekEnd - End of week
   * @returns Array of shifts in the week
   */
  async findByEmployeeAndWeek(
    companyEmployeeId: number,
    weekStart: Date,
    weekEnd: Date
  ): Promise<shift[]> {
    return this.delegate.findMany({
      where: {
        company_employee_id: companyEmployeeId,
        shift_date: {
          gte: weekStart,
          lte: weekEnd,
        },
        deleted_at: null,
      },
    });
  }

  /**
   * Create a shift with conflict checking
   *
   * @param data - Shift data
   * @param transaction - Optional Prisma transaction
   * @returns Created shift
   */
  async createShift(
    data: Prisma.shiftCreateInput,
    transaction?: PrismaClient
  ): Promise<shift> {
    const client = this.getClient(transaction);
    return client.shift.create({ data });
  }

  /**
   * Create multiple shifts (bulk operation)
   *
   * @param data - Array of shift data
   * @param transaction - Optional Prisma transaction
   * @returns Result with count
   */
  async createManyShifts(
    data: Prisma.shiftCreateManyInput[],
    transaction?: PrismaClient
  ): Promise<{ count: number }> {
    const client = this.getClient(transaction);
    return client.shift.createMany({ data });
  }

  /**
   * Update shift status (confirmed, draft, cancelled)
   *
   * @param id - Shift ID
   * @param status - New status
   * @param transaction - Optional Prisma transaction
   * @returns Updated shift
   */
  async updateStatus(
    id: number,
    status: shift_status,
    transaction?: PrismaClient
  ): Promise<shift> {
    const client = this.getClient(transaction);
    return client.shift.update({
      where: { id },
      data: { status },
    });
  }

  /**
   * Soft delete shifts by IDs
   *
   * @param ids - Array of shift IDs
   * @param companyId - Company ID for security validation
   * @returns Count of deleted shifts
   */
  async softDeleteByIds(ids: number[], companyId: number): Promise<{ count: number }> {
    return this.delegate.updateMany({
      where: {
        id: { in: ids },
        company_employee: {
          company_id: companyId,
        },
      },
      data: { deleted_at: new Date() },
    });
  }

  /**
   * Count shifts by status for a company
   *
   * @param companyId - Company ID
   * @param status - Shift status
   * @returns Count of shifts
   */
  async countByStatus(companyId: number, status?: shift_status): Promise<number> {
    const where: any = {
      company_employee: {
        company_id: companyId,
        deleted_at: null,
      },
      deleted_at: null,
    };

    if (status) {
      where.status = status;
    }

    return this.delegate.count({ where });
  }

  /**
   * Get shift statistics for a company
   *
   * @param companyId - Company ID
   * @param startDate - Start date for stats
   * @param endDate - End date for stats
   * @returns Statistics object
   */
  async getStatistics(
    companyId: number,
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    total: number;
    confirmed: number;
    draft: number;
    cancelled: number;
  }> {
    const baseWhere: any = {
      company_employee: {
        company_id: companyId,
        deleted_at: null,
      },
      deleted_at: null,
    };

    if (startDate && endDate) {
      baseWhere.shift_date = {
        gte: startDate,
        lte: endDate,
      };
    }

    const [total, confirmed, draft, cancelled] = await Promise.all([
      this.delegate.count({ where: baseWhere }),
      this.delegate.count({ where: { ...baseWhere, status: 'confirmed' } }),
      this.delegate.count({ where: { ...baseWhere, status: 'draft' } }),
      this.delegate.count({ where: { ...baseWhere, status: 'cancelled' } }),
    ]);

    return { total, confirmed, draft, cancelled };
  }

  /**
   * Check if a shift exists with exact same parameters (for duplicate detection)
   *
   * @param companyEmployeeId - Company employee ID
   * @param shiftDate - Shift date
   * @param startTime - Start time
   * @param endTime - End time
   * @returns True if duplicate exists
   */
  async isDuplicate(
    companyEmployeeId: number,
    shiftDate: Date,
    startTime: Date,
    endTime: Date
  ): Promise<boolean> {
    const existing = await this.delegate.findFirst({
      where: {
        company_employee_id: companyEmployeeId,
        shift_date: shiftDate,
        start_time: startTime,
        end_time: endTime,
        deleted_at: null,
      },
    });

    return existing !== null;
  }

  /**
   * Bulk soft delete shifts for a company.
   *
   * @param shiftIds - Array of shift IDs to delete
   * @param companyId - Company ID for security validation
   * @returns Count of deleted shifts
   */
  async bulkSoftDelete(shiftIds: number[], companyId: number): Promise<{ count: number }> {
    // First, validate that all shifts belong to the specified company to prevent unauthorized deletions.
    const countInCompany = await this.delegate.count({
      where: {
        id: { in: shiftIds },
        company_employee: {
          company_id: companyId,
        },
      },
    });

    if (countInCompany !== shiftIds.length) {
      throw new Error('UNAUTHORIZED_OR_INVALID_IDS');
    }

    // Perform the bulk soft delete.
    return this.delegate.updateMany({
      where: {
        id: { in: shiftIds },
      },
      data: {
        deleted_at: new Date(),
      },
    });
  }
}

// Export singleton instance
export const shiftRepository = new ShiftRepository();
