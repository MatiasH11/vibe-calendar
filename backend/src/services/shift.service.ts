import { prisma } from '../config/prisma_client';
import {
  create_shift_body,
  update_shift_body,
  shift_filters,
  bulk_create_shift_body,
  bulk_update_shift_body,
  bulk_delete_shift_body,
} from '../validations/shift.validation';
import {
  ResourceNotFoundError,
  UnauthorizedCompanyAccessError,
  TransactionFailedError,
} from '../errors';
import {
  parseUTCTime,
  parseISODate,
  formatTimeToUTC,
  formatDateToISO,
  isValidTimeRange,
  calculateDuration,
} from '../utils/time.utils';

/**
 * Format shift dates and times from PostgreSQL objects to UTC strings
 *
 * Converts PostgreSQL Date and Time fields to ISO/UTC string formats for API responses.
 *
 * @param shift - Shift with Date objects
 * @returns Shift with formatted date and time strings
 */
function formatShiftDatesTimes(shift: any) {
  return {
    ...shift,
    shift_date: formatDateToISO(shift.shift_date),
    start_time: formatTimeToUTC(shift.start_time),
    end_time: formatTimeToUTC(shift.end_time),
  };
}

/**
 * Check if two time ranges overlap
 *
 * @param start1 - Start time of first shift (HH:mm)
 * @param end1 - End time of first shift (HH:mm)
 * @param start2 - Start time of second shift (HH:mm)
 * @param end2 - End time of second shift (HH:mm)
 * @returns true if shifts overlap, false otherwise
 */
function shiftsOverlap(start1: string, end1: string, start2: string, end2: string): boolean {
  // Convert to minutes for easier comparison
  const toMinutes = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const start1Min = toMinutes(start1);
  let end1Min = toMinutes(end1);
  const start2Min = toMinutes(start2);
  let end2Min = toMinutes(end2);

  // Handle overnight shifts (when end < start, add 24 hours)
  if (end1Min < start1Min) end1Min += 24 * 60;
  if (end2Min < start2Min) end2Min += 24 * 60;

  // Check for overlap: shifts overlap if one starts before the other ends
  return start1Min < end2Min && start2Min < end1Min;
}

/**
 * Update or create employee shift pattern for pattern tracking
 *
 * @param tx - Prisma transaction client
 * @param employee_id - Employee ID
 * @param start_time - Start time string (HH:mm)
 * @param end_time - End time string (HH:mm)
 */
async function updateShiftPattern(tx: any, employee_id: number, start_time: string, end_time: string) {
  // Parse times for PostgreSQL storage
  const startTime = parseUTCTime(start_time);
  const endTime = parseUTCTime(end_time);

  // Try to find existing pattern
  const existingPattern = await tx.employee_shift_pattern.findFirst({
    where: {
      employee_id,
      start_time: startTime,
      end_time: endTime,
    },
  });

  if (existingPattern) {
    // Increment frequency count and update last_used
    await tx.employee_shift_pattern.update({
      where: { id: existingPattern.id },
      data: {
        frequency_count: { increment: 1 },
        last_used: new Date(),
      },
    });
  } else {
    // Create new pattern
    await tx.employee_shift_pattern.create({
      data: {
        employee_id,
        start_time: startTime,
        end_time: endTime,
        frequency_count: 1,
        last_used: new Date(),
      },
    });
  }
}

export const shift_service = {
  /**
   * Get all shifts with pagination and filters
   */
  async getAll(company_id: number, filters: shift_filters) {
    const page = parseInt(filters.page || '1');
    const limit = Math.min(parseInt(filters.limit || '50'), 100);
    const skip = (page - 1) * limit;

    const where: any = {
      employee: {
        company_id,
        deleted_at: null,
      },
      deleted_at: null,
    };

    // Add search filter (search in notes or employee info)
    if (filters.search) {
      where.OR = [
        { notes: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    // Add location_id filter (for gerentes to see only their location shifts)
    if (filters.location_id) {
      where.location_id = parseInt(filters.location_id as string);
    }

    // Get total count and items
    const [total, items] = await Promise.all([
      prisma.shift.count({ where }),
      prisma.shift.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          [filters.sort_by || 'shift_date']: filters.sort_order || 'desc',
        },
        include: {
          employee: {
            select: {
              id: true,
              user_id: true,
              company_id: true,
            },
          },
        },
      }),
    ]);

    // Format dates and times from PostgreSQL objects to UTC strings
    const formattedItems = items.map(formatShiftDatesTimes);

    return {
      success: true,
      data: {
        items: formattedItems,
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
   * Get shift by ID
   */
  async getById(id: number, company_id: number) {
    const shift = await prisma.shift.findFirst({
      where: {
        id,
        employee: {
          company_id,
          deleted_at: null,
        },
        deleted_at: null,
      },
      include: {
        employee: {
          select: {
            id: true,
            user_id: true,
            company_id: true,
          },
        },
      },
    });

    if (!shift) {
      throw new ResourceNotFoundError('shift', id);
    }

    // Format dates and times from PostgreSQL objects to UTC strings
    const formattedShift = formatShiftDatesTimes(shift);

    return { success: true, data: formattedShift };
  },

  /**
   * Create new shift
   */
  async create(data: create_shift_body, company_id: number, user_id: number) {
    // Validate time range
    if (!isValidTimeRange(data.start_time, data.end_time)) {
      throw new Error('Invalid time range: start_time and end_time must be different valid UTC times');
    }

    // Verify employee belongs to company
    const employee = await prisma.employee.findFirst({
      where: {
        id: data.employee_id,
        company_id,
        deleted_at: null,
      },
    });

    if (!employee) {
      throw new ResourceNotFoundError('employee', data.employee_id);
    }

    // Parse ISO date and UTC time strings to Date objects for PostgreSQL storage
    const shiftDate = parseISODate(data.shift_date);
    const startTime = parseUTCTime(data.start_time);
    const endTime = parseUTCTime(data.end_time);

    // Verify location exists and belongs to company
    const location = await prisma.location.findFirst({
      where: {
        id: data.location_id,
        company_id,
        deleted_at: null,
      },
    });

    if (!location) {
      throw new ResourceNotFoundError('location', data.location_id);
    }

    // Check for overlapping shifts on the same date for the same employee in the same location
    // CRITICAL: Only check conflicts within the same location, allowing employee rotation
    const existingShifts = await prisma.shift.findMany({
      where: {
        employee_id: data.employee_id,
        location_id: data.location_id,
        shift_date: shiftDate,
        deleted_at: null,
      },
    });

    for (const existingShift of existingShifts) {
      const existingStart = formatTimeToUTC(existingShift.start_time);
      const existingEnd = formatTimeToUTC(existingShift.end_time);

      if (shiftsOverlap(data.start_time, data.end_time, existingStart, existingEnd)) {
        throw new Error(
          `Shift overlaps with existing shift on ${data.shift_date} from ${existingStart} to ${existingEnd}`
        );
      }
    }

    // Fetch company settings for validation
    const companySettings = await prisma.company_settings.findFirst({
      where: { company_id },
    });

    if (companySettings) {
      // Calculate shift duration
      const shiftDuration = calculateDuration(data.start_time, data.end_time);

      // Validate against max daily hours
      const maxDailyHours = Number(companySettings.max_daily_hours);
      if (shiftDuration > maxDailyHours) {
        throw new Error(
          `Shift duration (${shiftDuration}h) exceeds maximum daily hours (${maxDailyHours}h)`
        );
      }

      // Calculate total hours for the day including this shift
      const dailyTotal = existingShifts.reduce((total, shift) => {
        const start = formatTimeToUTC(shift.start_time);
        const end = formatTimeToUTC(shift.end_time);
        return total + calculateDuration(start, end);
      }, 0) + shiftDuration;

      if (dailyTotal > maxDailyHours) {
        throw new Error(
          `Total daily hours (${dailyTotal}h) would exceed maximum daily hours (${maxDailyHours}h)`
        );
      }
    }

    try {
      const result = await prisma.$transaction(async (tx) => {
        // Create shift with parsed date and time Date objects
        const shift = await tx.shift.create({
          data: {
            employee_id: data.employee_id,
            location_id: data.location_id,
            shift_date: shiftDate,
            start_time: startTime,
            end_time: endTime,
            notes: data.notes,
            status: data.status || 'pending',
            assigned_by: user_id,
          },
        });

        // Update employee shift pattern for pattern tracking
        await updateShiftPattern(tx, data.employee_id, data.start_time, data.end_time);

        // Create audit log (store times as UTC strings in audit)
        await tx.audit_log.create({
          data: {
            user_id,
            company_id,
            action: 'CREATE',
            entity_type: 'shift',
            entity_id: shift.id,
            new_values: data, // Original data with UTC strings
          },
        });

        return shift;
      });

      // Format dates and times from PostgreSQL Date objects back to strings for response
      const formattedResult = formatShiftDatesTimes(result);

      return { success: true, data: formattedResult };
    } catch (e) {
      console.error('Create shift transaction failed:', e);
      throw new TransactionFailedError('shift creation');
    }
  },

  /**
   * Update shift
   */
  async update(
    id: number,
    data: update_shift_body,
    company_id: number,
    user_id: number
  ) {
    // Verify shift exists and belongs to company (through employee)
    const existing = await prisma.shift.findFirst({
      where: {
        id,
        employee: {
          company_id,
          deleted_at: null,
        },
        deleted_at: null,
      },
    });

    if (!existing) {
      throw new ResourceNotFoundError('shift', id);
    }

    // Validate time range if both times are provided
    if (data.start_time && data.end_time) {
      if (!isValidTimeRange(data.start_time, data.end_time)) {
        throw new Error('Invalid time range: start_time and end_time must be different valid UTC times');
      }
    }

    // Verify employee belongs to company if being updated
    if (data.employee_id) {
      const employee = await prisma.employee.findFirst({
        where: {
          id: data.employee_id,
          company_id,
          deleted_at: null,
        },
      });

      if (!employee) {
        throw new ResourceNotFoundError('employee', data.employee_id);
      }
    }

    // Parse date and time strings to Date objects if provided
    const updateData: any = { ...data };
    if (data.shift_date) {
      updateData.shift_date = parseISODate(data.shift_date);
    }
    if (data.start_time) {
      updateData.start_time = parseUTCTime(data.start_time);
    }
    if (data.end_time) {
      updateData.end_time = parseUTCTime(data.end_time);
    }

    try {
      const result = await prisma.$transaction(async (tx) => {
        // Update shift with parsed date and times
        const updated = await tx.shift.update({
          where: { id },
          data: updateData,
        });

        // Create audit log (store original times as UTC strings)
        await tx.audit_log.create({
          data: {
            user_id,
            company_id,
            action: 'UPDATE',
            entity_type: 'shift',
            entity_id: id,
            old_values: formatShiftDatesTimes(existing), // Format for audit
            new_values: data, // Original data with UTC strings
          },
        });

        return updated;
      });

      // Format dates and times from PostgreSQL Date objects back to strings for response
      const formattedResult = formatShiftDatesTimes(result);

      return { success: true, data: formattedResult };
    } catch (e) {
      console.error('Update shift transaction failed:', e);
      throw new TransactionFailedError('shift update');
    }
  },

  /**
   * Delete shift (soft delete)
   */
  async delete(id: number, company_id: number, user_id: number) {
    // Verify shift exists and belongs to company (through employee)
    const existing = await prisma.shift.findFirst({
      where: {
        id,
        employee: {
          company_id,
          deleted_at: null,
        },
        deleted_at: null,
      },
    });

    if (!existing) {
      throw new ResourceNotFoundError('shift', id);
    }

    try {
      await prisma.$transaction(async (tx) => {
        // Soft delete shift
        await tx.shift.update({
          where: { id },
          data: { deleted_at: new Date() },
        });

        // Create audit log
        await tx.audit_log.create({
          data: {
            user_id,
            company_id,
            action: 'DELETE',
            entity_type: 'shift',
            entity_id: id,
            old_values: existing,
          },
        });
      });

      return { success: true, message: 'shift deleted successfully' };
    } catch (e) {
      console.error('Delete shift transaction failed:', e);
      throw new TransactionFailedError('shift deletion');
    }
  },

  /**
   * Bulk create shifts
   */
  async bulkCreate(data: bulk_create_shift_body, company_id: number, user_id: number) {
    try {
      const results = await prisma.$transaction(async (tx) => {
        const created = await tx.shift.createMany({
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
            entity_type: 'shift',
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
      console.error('Bulk create shift transaction failed:', e);
      throw new TransactionFailedError('Bulk shift creation');
    }
  },

  /**
   * Bulk update shifts
   */
  async bulkUpdate(
    data: bulk_update_shift_body,
    company_id: number,
    user_id: number
  ) {
    try {
      const results = await prisma.$transaction(async (tx) => {
        // Verify all shifts belong to company (through employee)
        const existing = await tx.shift.findMany({
          where: {
            id: { in: data.ids },
            employee: {
              company_id,
              deleted_at: null,
            },
            deleted_at: null,
          },
        });

        if (existing.length !== data.ids.length) {
          throw new Error('Some shifts not found or do not belong to company');
        }

        // Update all shifts
        const updated = await tx.shift.updateMany({
          where: { id: { in: data.ids } },
          data: data.data,
        });

        // Create audit log
        await tx.audit_log.create({
          data: {
            user_id,
            company_id,
            action: 'BULK_UPDATE',
            entity_type: 'shift',
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
      console.error('Bulk update shift transaction failed:', e);
      throw new TransactionFailedError('Bulk shift update');
    }
  },

  /**
   * Bulk delete shifts
   */
  async bulkDelete(
    data: bulk_delete_shift_body,
    company_id: number,
    user_id: number
  ) {
    try {
      const results = await prisma.$transaction(async (tx) => {
        // Verify all shifts belong to company (through employee)
        const existing = await tx.shift.findMany({
          where: {
            id: { in: data.ids },
            employee: {
              company_id,
              deleted_at: null,
            },
            deleted_at: null,
          },
        });

        if (existing.length !== data.ids.length) {
          throw new Error('Some shifts not found or do not belong to company');
        }

        // Soft delete all shifts
        const deleted = await tx.shift.updateMany({
          where: { id: { in: data.ids } },
          data: { deleted_at: new Date() },
        });

        // Create audit log
        await tx.audit_log.create({
          data: {
            user_id,
            company_id,
            action: 'BULK_DELETE',
            entity_type: 'shift',
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
      console.error('Bulk delete shift transaction failed:', e);
      throw new TransactionFailedError('Bulk shift deletion');
    }
  },

  /**
   * Confirm shift (update status to 'confirmed' and set confirmation metadata)
   */
  async confirmShift(
    id: number,
    company_id: number,
    user_id: number
  ) {
    try {
      // Verify shift exists and belongs to company
      const shift = await prisma.shift.findFirst({
        where: {
          id,
          employee: {
            company_id,
            deleted_at: null,
          },
          deleted_at: null,
        },
      });

      if (!shift) {
        throw new ResourceNotFoundError('shift', id);
      }

      const result = await prisma.$transaction(async (tx) => {
        // Update shift status and confirmation info
        const confirmed = await tx.shift.update({
          where: { id },
          data: {
            status: 'confirmed',
            confirmed_by: user_id,
            confirmed_at: new Date(),
          },
        });

        // Create audit log
        await tx.audit_log.create({
          data: {
            user_id,
            company_id,
            action: 'UPDATE',
            entity_type: 'shift_confirmation',
            entity_id: id,
            new_values: {
              status: 'confirmed',
              confirmed_by: user_id,
              confirmed_at: new Date().toISOString(),
            },
          },
        });

        return confirmed;
      });

      // Format dates and times for response
      const formattedResult = formatShiftDatesTimes(result);

      return { success: true, data: formattedResult };
    } catch (e) {
      console.error('Confirm shift transaction failed:', e);
      if (e instanceof ResourceNotFoundError) {
        throw e;
      }
      throw new TransactionFailedError('shift confirmation');
    }
  },
};
