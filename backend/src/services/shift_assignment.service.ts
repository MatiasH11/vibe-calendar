import { prisma } from '../config/prisma_client';
import {
  create_shift_assignment_body,
  update_shift_assignment_body,
  shift_assignment_filters,
  bulk_create_shift_assignment_body,
  bulk_update_shift_assignment_body,
  bulk_delete_shift_assignment_body,
} from '../validations/shift_assignment.validation';
import {
  ResourceNotFoundError,
  UnauthorizedCompanyAccessError,
  TransactionFailedError,
  ShiftConflictError,
  BusinessRuleViolationError,
} from '../errors';

export const shift_assignment_service = {
  /**
   * Check if a shift conflicts with existing shifts for the same employee
   * Conflicts occur when shifts overlap in time (start_time < other.end_time AND end_time > other.start_time)
   */
  async checkConflicts(
    employee_id: number,
    shift_date: string,
    start_time: string,
    end_time: string,
    excludeShiftId?: number
  ) {
    // Convert time strings to comparable format (HH:mm -> minutes since midnight)
    const parseTime = (timeStr: string): number => {
      const [hours, minutes] = timeStr.split(':').map(Number);
      return hours * 60 + minutes;
    };

    const newStartMinutes = parseTime(start_time);
    const newEndMinutes = parseTime(end_time);

    // Find other shifts for this employee on the same date
    const existingShifts = await prisma.shift_assignment.findMany({
      where: {
        employee_id,
        shift_date,
        deleted_at: null,
        // Exclude the current shift if updating
        ...(excludeShiftId ? { id: { not: excludeShiftId } } : {}),
        // Only check non-cancelled shifts
        status: { not: 'cancelled' },
      },
      select: {
        id: true,
        start_time: true,
        end_time: true,
      },
    });

    // Check for overlaps
    for (const shift of existingShifts) {
      const existingStartMinutes = parseTime(shift.start_time);
      const existingEndMinutes = parseTime(shift.end_time);

      // Overlap condition: new shift starts before existing ends AND new shift ends after existing starts
      const hasOverlap =
        newStartMinutes < existingEndMinutes &&
        newEndMinutes > existingStartMinutes;

      if (hasOverlap) {
        return {
          hasConflict: true,
          conflictingShift: shift,
        };
      }
    }

    return {
      hasConflict: false,
      conflictingShift: null,
    };
  },

  /**
   * Validate business rules for shift assignments
   * Checks: max daily hours, max weekly hours, minimum break time between shifts
   */
  async validateBusinessRules(
    employee_id: number,
    company_id: number,
    shift_date: string,
    start_time: string,
    end_time: string,
    excludeShiftId?: number
  ) {
    const violations: string[] = [];

    // Parse times to minutes
    const parseTime = (timeStr: string): number => {
      const [hours, minutes] = timeStr.split(':').map(Number);
      return hours * 60 + minutes;
    };

    const newStartMinutes = parseTime(start_time);
    const newEndMinutes = parseTime(end_time);
    const newShiftHours =
      (newEndMinutes - newStartMinutes) / 60;

    // Get company business rules settings
    const settings = await prisma.company_settings.findUnique({
      where: { company_id },
    });

    const maxDailyHours = settings
      ? parseFloat(settings.max_daily_hours.toString())
      : 12.0;
    const maxWeeklyHours = settings
      ? parseFloat(settings.max_weekly_hours.toString())
      : 40.0;
    const minBreakHours = settings
      ? parseFloat(settings.min_break_hours.toString())
      : 11.0;

    // Get all shifts for employee on the target date (not deleted or cancelled)
    const shiftsOnDate = await prisma.shift_assignment.findMany({
      where: {
        employee_id,
        shift_date,
        deleted_at: null,
        status: { not: 'cancelled' },
        ...(excludeShiftId ? { id: { not: excludeShiftId } } : {}),
      },
      select: {
        id: true,
        start_time: true,
        end_time: true,
      },
    });

    // Check max daily hours
    let totalDailyHours = newShiftHours;
    for (const shift of shiftsOnDate) {
      const shiftStart = parseTime(shift.start_time);
      const shiftEnd = parseTime(shift.end_time);
      totalDailyHours += (shiftEnd - shiftStart) / 60;
    }

    if (totalDailyHours > maxDailyHours) {
      violations.push(
        `Daily hours (${totalDailyHours.toFixed(2)}h) exceeds maximum (${maxDailyHours}h)`
      );
    }

    // Get week boundaries for the given date
    const date = new Date(shift_date);
    const dayOfWeek = date.getDay();
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - dayOfWeek);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    const weekStartStr = weekStart.toISOString().split('T')[0];
    const weekEndStr = weekEnd.toISOString().split('T')[0];

    // Get all shifts for employee during the week
    const shiftsInWeek = await prisma.shift_assignment.findMany({
      where: {
        employee_id,
        shift_date: { gte: weekStartStr, lte: weekEndStr },
        deleted_at: null,
        status: { not: 'cancelled' },
        ...(excludeShiftId ? { id: { not: excludeShiftId } } : {}),
      },
      select: {
        start_time: true,
        end_time: true,
      },
    });

    // Calculate total weekly hours
    let totalWeeklyHours = newShiftHours;
    for (const shift of shiftsInWeek) {
      const shiftStart = parseTime(shift.start_time);
      const shiftEnd = parseTime(shift.end_time);
      totalWeeklyHours += (shiftEnd - shiftStart) / 60;
    }

    if (totalWeeklyHours > maxWeeklyHours) {
      violations.push(
        `Weekly hours (${totalWeeklyHours.toFixed(2)}h) exceeds maximum (${maxWeeklyHours}h)`
      );
    }

    // Check minimum break time between shifts on the same day
    const shiftsBefore = await prisma.shift_assignment.findMany({
      where: {
        employee_id,
        shift_date,
        deleted_at: null,
        status: { not: 'cancelled' },
        ...(excludeShiftId ? { id: { not: excludeShiftId } } : {}),
        end_time: { lt: start_time }, // Shifts that end before our shift starts
      },
      select: {
        end_time: true,
      },
      orderBy: { end_time: 'desc' },
      take: 1,
    });

    if (shiftsBefore.length > 0) {
      const previousShiftEnd = parseTime(shiftsBefore[0].end_time);
      const breakMinutes = newStartMinutes - previousShiftEnd;
      const breakHours = breakMinutes / 60;

      if (breakHours < minBreakHours) {
        violations.push(
          `Break time (${breakHours.toFixed(2)}h) is less than minimum (${minBreakHours}h)`
        );
      }
    }

    return {
      isValid: violations.length === 0,
      violations,
    };
  },
  /**
   * Get all shift_assignments with pagination and filters
   */
  async getAll(company_id: number, filters: shift_assignment_filters) {
    const page = parseInt(filters.page || '1');
    const limit = Math.min(parseInt(filters.limit || '50'), 100);
    const skip = (page - 1) * limit;

    const where: any = {
      company_id,
      deleted_at: null,
    };

    // Add status filter
    if (filters.status) {
      where.status = filters.status;
    }

    // Add employee filter
    if (filters.employee_id) {
      where.employee_id = parseInt(filters.employee_id);
    }

    // Add location filter
    if (filters.location_id) {
      where.location_id = parseInt(filters.location_id);
    }

    // Add shift_date filter
    if (filters.shift_date) {
      where.shift_date = filters.shift_date;
    }

    // Get total count and items
    const [total, items] = await Promise.all([
      prisma.shift_assignment.count({ where }),
      prisma.shift_assignment.findMany({
        where,
        skip,
        take: limit,
        include: {
          employee: { select: { id: true, user: { select: { first_name: true, last_name: true } } } },
          job_position: true,
          location: { select: { id: true, name: true } },
          template_shift: { select: { id: true, name: true, start_time: true, end_time: true } },
        },
        orderBy: {
          [filters.sort_by || 'shift_date']: filters.sort_order || 'desc',
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
   * Get shift_assignment by ID
   */
  async getById(id: number, company_id: number) {
    const shift_assignment = await prisma.shift_assignment.findFirst({
      where: { id, company_id, deleted_at: null },
      include: {
        employee: { select: { id: true, user: { select: { first_name: true, last_name: true } } } },
        job_position: true,
        location: { select: { id: true, name: true } },
        template_shift: { select: { id: true, name: true, start_time: true, end_time: true } },
      },
    });

    if (!shift_assignment) {
      throw new ResourceNotFoundError('shift_assignment', id);
    }

    return { success: true, data: shift_assignment };
  },

  /**
   * Create new shift_assignment
   */
  async create(data: create_shift_assignment_body, company_id: number, user_id: number) {
    try {
      // Check for conflicts before creating
      const conflictCheck = await this.checkConflicts(
        data.employee_id,
        data.shift_date,
        data.start_time,
        data.end_time
      );

      if (conflictCheck.hasConflict) {
        throw new ShiftConflictError(
          data.employee_id,
          conflictCheck.conflictingShift?.id
        );
      }

      // Validate business rules
      const rulesCheck = await this.validateBusinessRules(
        data.employee_id,
        company_id,
        data.shift_date,
        data.start_time,
        data.end_time
      );

      if (!rulesCheck.isValid) {
        throw new BusinessRuleViolationError(
          'Shift assignment violates business rules',
          rulesCheck.violations
        );
      }

      const result = await prisma.$transaction(async (tx) => {
        // Create shift_assignment
        const shift_assignment = await tx.shift_assignment.create({
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
            entity_type: 'shift_assignment',
            entity_id: shift_assignment.id,
            new_values: data,
          },
        });

        return shift_assignment;
      });

      return { success: true, data: result };
    } catch (e) {
      // Re-throw custom errors
      if (e instanceof ShiftConflictError || e instanceof BusinessRuleViolationError) {
        throw e;
      }
      console.error('Create shift_assignment transaction failed:', e);
      throw new TransactionFailedError('shift_assignment creation');
    }
  },

  /**
   * Update shift_assignment
   */
  async update(
    id: number,
    data: update_shift_assignment_body,
    company_id: number,
    user_id: number
  ) {
    // Verify shift_assignment exists and belongs to company
    const existing = await prisma.shift_assignment.findFirst({
      where: { id, company_id, deleted_at: null },
    });

    if (!existing) {
      throw new ResourceNotFoundError('shift_assignment', id);
    }

    try {
      // Check for conflicts if updating time-related fields
      if (
        data.shift_date ||
        data.start_time ||
        data.end_time
      ) {
        const conflictCheck = await this.checkConflicts(
          data.employee_id || existing.employee_id,
          data.shift_date || existing.shift_date,
          data.start_time || existing.start_time,
          data.end_time || existing.end_time,
          id // Exclude current shift from conflict check
        );

        if (conflictCheck.hasConflict) {
          throw new ShiftConflictError(
            data.employee_id || existing.employee_id,
            conflictCheck.conflictingShift?.id
          );
        }

        // Validate business rules if updating time-related fields
        const rulesCheck = await this.validateBusinessRules(
          data.employee_id || existing.employee_id,
          company_id,
          data.shift_date || existing.shift_date,
          data.start_time || existing.start_time,
          data.end_time || existing.end_time,
          id // Exclude current shift from validation
        );

        if (!rulesCheck.isValid) {
          throw new BusinessRuleViolationError(
            'Shift assignment violates business rules',
            rulesCheck.violations
          );
        }
      }

      const result = await prisma.$transaction(async (tx) => {
        // Update shift_assignment
        const updated = await tx.shift_assignment.update({
          where: { id },
          data,
        });

        // Create audit log
        await tx.audit_log.create({
          data: {
            user_id,
            company_id,
            action: 'UPDATE',
            entity_type: 'shift_assignment',
            entity_id: id,
            old_values: existing,
            new_values: data,
          },
        });

        return updated;
      });

      return { success: true, data: result };
    } catch (e) {
      // Re-throw custom errors
      if (e instanceof ShiftConflictError || e instanceof BusinessRuleViolationError) {
        throw e;
      }
      console.error('Update shift_assignment transaction failed:', e);
      throw new TransactionFailedError('shift_assignment update');
    }
  },

  /**
   * Delete shift_assignment (soft delete)
   */
  async delete(id: number, company_id: number, user_id: number) {
    // Verify shift_assignment exists and belongs to company
    const existing = await prisma.shift_assignment.findFirst({
      where: { id, company_id, deleted_at: null },
    });

    if (!existing) {
      throw new ResourceNotFoundError('shift_assignment', id);
    }

    try {
      await prisma.$transaction(async (tx) => {
        // Soft delete shift_assignment
        await tx.shift_assignment.update({
          where: { id },
          data: { deleted_at: new Date() },
        });

        // Create audit log
        await tx.audit_log.create({
          data: {
            user_id,
            company_id,
            action: 'DELETE',
            entity_type: 'shift_assignment',
            entity_id: id,
            old_values: existing,
          },
        });
      });

      return { success: true, message: 'shift_assignment deleted successfully' };
    } catch (e) {
      console.error('Delete shift_assignment transaction failed:', e);
      throw new TransactionFailedError('shift_assignment deletion');
    }
  },

  /**
   * Confirm a shift assignment (change status from pending to confirmed)
   */
  async confirmShift(id: number, company_id: number, user_id: number) {
    try {
      // Verify shift_assignment exists and belongs to company
      const existing = await prisma.shift_assignment.findFirst({
        where: { id, company_id, deleted_at: null },
        include: {
          employee: { select: { id: true, user: { select: { first_name: true, last_name: true } } } },
          job_position: true,
          location: { select: { id: true, name: true } },
          template_shift: { select: { id: true, name: true, start_time: true, end_time: true } },
        },
      });

      if (!existing) {
        throw new ResourceNotFoundError('shift_assignment', id);
      }

      // Check if already confirmed
      if (existing.status !== 'pending') {
        throw new BusinessRuleViolationError(
          `Cannot confirm shift with status '${existing.status}'. Only pending shifts can be confirmed.`
        );
      }

      const result = await prisma.$transaction(async (tx) => {
        // Update shift_assignment status to confirmed
        const confirmed = await tx.shift_assignment.update({
          where: { id },
          data: {
            status: 'confirmed',
            confirmed_by: user_id,
            confirmed_at: new Date(),
          },
          include: {
            employee: { select: { id: true, user: { select: { first_name: true, last_name: true } } } },
            job_position: true,
            location: { select: { id: true, name: true } },
            template_shift: { select: { id: true, name: true, start_time: true, end_time: true } },
          },
        });

        // Create audit log
        await tx.audit_log.create({
          data: {
            user_id,
            company_id,
            action: 'UPDATE',
            entity_type: 'shift_assignment',
            entity_id: id,
            old_values: { status: existing.status },
            new_values: { status: 'confirmed', confirmed_by: user_id, confirmed_at: new Date() },
          },
        });

        return confirmed;
      });

      return { success: true, data: result };
    } catch (e) {
      // Re-throw custom errors
      if (e instanceof ResourceNotFoundError || e instanceof BusinessRuleViolationError) {
        throw e;
      }
      console.error('Confirm shift_assignment transaction failed:', e);
      throw new TransactionFailedError('shift_assignment confirmation');
    }
  },

  /**
   * Bulk create shift_assignments
   * Validates all assignments for conflicts before creating any (fail-safe approach)
   */
  async bulkCreate(data: bulk_create_shift_assignment_body, company_id: number, user_id: number) {
    try {
      // Validate all assignments for conflicts before creating any
      for (let i = 0; i < data.items.length; i++) {
        const item = data.items[i];
        const conflictCheck = await this.checkConflicts(
          item.employee_id,
          item.shift_date,
          item.start_time,
          item.end_time
        );

        if (conflictCheck.hasConflict) {
          throw new ShiftConflictError(
            item.employee_id,
            conflictCheck.conflictingShift?.id
          );
        }
      }

      const results = await prisma.$transaction(async (tx) => {
        const created = await tx.shift_assignment.createMany({
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
            entity_type: 'shift_assignment',
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
      // Re-throw custom errors
      if (e instanceof ShiftConflictError) {
        throw e;
      }
      console.error('Bulk create shift_assignment transaction failed:', e);
      throw new TransactionFailedError('Bulk shift_assignment creation');
    }
  },

  /**
   * Bulk update shift_assignments
   */
  async bulkUpdate(
    data: bulk_update_shift_assignment_body,
    company_id: number,
    user_id: number
  ) {
    try {
      const results = await prisma.$transaction(async (tx) => {
        // Verify all shift_assignments belong to company
        const existing = await tx.shift_assignment.findMany({
          where: {
            id: { in: data.ids },
            company_id,
            deleted_at: null,
          },
        });

        if (existing.length !== data.ids.length) {
          throw new Error('Some shift_assignments not found or do not belong to company');
        }

        // Update all shift_assignments
        const updated = await tx.shift_assignment.updateMany({
          where: { id: { in: data.ids } },
          data: data.data,
        });

        // Create audit log
        await tx.audit_log.create({
          data: {
            user_id,
            company_id,
            action: 'BULK_UPDATE',
            entity_type: 'shift_assignment',
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
      console.error('Bulk update shift_assignment transaction failed:', e);
      throw new TransactionFailedError('Bulk shift_assignment update');
    }
  },

  /**
   * Bulk delete shift_assignments
   */
  async bulkDelete(
    data: bulk_delete_shift_assignment_body,
    company_id: number,
    user_id: number
  ) {
    try {
      const results = await prisma.$transaction(async (tx) => {
        // Verify all shift_assignments belong to company
        const existing = await tx.shift_assignment.findMany({
          where: {
            id: { in: data.ids },
            company_id,
            deleted_at: null,
          },
        });

        if (existing.length !== data.ids.length) {
          throw new Error('Some shift_assignments not found or do not belong to company');
        }

        // Soft delete all shift_assignments
        const deleted = await tx.shift_assignment.updateMany({
          where: { id: { in: data.ids } },
          data: { deleted_at: new Date() },
        });

        // Create audit log
        await tx.audit_log.create({
          data: {
            user_id,
            company_id,
            action: 'BULK_DELETE',
            entity_type: 'shift_assignment',
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
      console.error('Bulk delete shift_assignment transaction failed:', e);
      throw new TransactionFailedError('Bulk shift_assignment deletion');
    }
  },

  /**
   * Bulk assign employees to template shifts for a date range
   * For each date in range and each template_shift, create assignments for each employee
   */
  async bulkAssignFromTemplate(
    day_template_id: number,
    employee_ids: number[],
    start_date: string,
    end_date: string,
    company_id: number,
    user_id: number
  ) {
    try {
      // Verify day_template exists and belongs to company
      const template = await prisma.day_template.findFirst({
        where: {
          id: day_template_id,
          company_id,
          deleted_at: null,
        },
        include: {
          template_shifts: {
            where: { deleted_at: null },
            orderBy: { sort_order: 'asc' },
          },
        },
      });

      if (!template) {
        throw new ResourceNotFoundError('day_template', day_template_id);
      }

      // Verify all employees exist and belong to company
      const employees = await prisma.employee.findMany({
        where: {
          id: { in: employee_ids },
          company_id,
          deleted_at: null,
        },
        select: { id: true },
      });

      if (employees.length !== employee_ids.length) {
        throw new Error('Some employees not found or do not belong to company');
      }

      // Generate all dates in range
      const dates: string[] = [];
      const current = new Date(start_date);
      const end = new Date(end_date);

      while (current <= end) {
        dates.push(current.toISOString().split('T')[0]);
        current.setDate(current.getDate() + 1);
      }

      // Build all assignments to create
      const assignments: any[] = [];
      for (const date of dates) {
        for (const template_shift of template.template_shifts) {
          for (const employee_id of employee_ids) {
            assignments.push({
              employee_id,
              location_id: template.location_id,
              job_position_id: null, // Will be set if template has position requirements
              template_shift_id: template_shift.id,
              shift_date: date,
              start_time: template_shift.start_time,
              end_time: template_shift.end_time,
              company_id,
              status: 'pending',
            });
          }
        }
      }

      // Validate all assignments for conflicts and rules
      for (const assignment of assignments) {
        // Check conflicts
        const conflictCheck = await this.checkConflicts(
          assignment.employee_id,
          assignment.shift_date,
          assignment.start_time,
          assignment.end_time
        );

        if (conflictCheck.hasConflict) {
          throw new ShiftConflictError(
            assignment.employee_id,
            conflictCheck.conflictingShift?.id
          );
        }

        // Check business rules
        const rulesCheck = await this.validateBusinessRules(
          assignment.employee_id,
          company_id,
          assignment.shift_date,
          assignment.start_time,
          assignment.end_time
        );

        if (!rulesCheck.isValid) {
          throw new BusinessRuleViolationError(
            'Shift assignment violates business rules',
            rulesCheck.violations
          );
        }
      }

      // Create all assignments in transaction
      const result = await prisma.$transaction(async (tx) => {
        const created = await tx.shift_assignment.createMany({
          data: assignments,
        });

        // Create audit log
        await tx.audit_log.create({
          data: {
            user_id,
            company_id,
            action: 'BULK_CREATE',
            entity_type: 'shift_assignment',
            entity_id: 0,
            new_values: {
              count: created.count,
              day_template_id,
              date_range: `${start_date} to ${end_date}`,
              employees: employee_ids.length,
            },
          },
        });

        return created;
      });

      return {
        success: true,
        data: {
          created: result.count,
          total: assignments.length,
          dates: dates.length,
          employees: employee_ids.length,
          template_shifts: template.template_shifts.length,
        },
      };
    } catch (e) {
      if (
        e instanceof ShiftConflictError ||
        e instanceof BusinessRuleViolationError ||
        e instanceof ResourceNotFoundError
      ) {
        throw e;
      }
      console.error('Bulk assign from template transaction failed:', e);
      throw new TransactionFailedError('Bulk assignment from template');
    }
  },

  /**
   * Get coverage analysis by position and date
   * Shows required vs assigned employees for each position
   */
  async getCoverageAnalysis(
    company_id: number,
    start_date: string,
    end_date: string,
    location_id?: number
  ) {
    try {
      // Get all shift assignments in date range
      const assignments = await prisma.shift_assignment.findMany({
        where: {
          company_id,
          shift_date: { gte: start_date, lte: end_date },
          deleted_at: null,
          status: { not: 'cancelled' },
          ...(location_id ? { location_id } : {}),
        },
        include: {
          job_position: { select: { id: true, name: true } },
          location: { select: { id: true, name: true } },
        },
      });

      // Get all shift requirements in date range
      const requirements = await prisma.shift_requirement.findMany({
        where: {
          company_id,
          date: { gte: start_date, lte: end_date },
          deleted_at: null,
          ...(location_id ? { location_id } : {}),
        },
        include: {
          position_requirements: {
            include: { job_position: { select: { id: true, name: true } } },
          },
          location: { select: { id: true, name: true } },
        },
      });

      // Build analysis map: date -> position -> { required, assigned, shortfall }
      const analysis: Record<string, Record<string, any>> = {};

      // Initialize with requirements
      for (const req of requirements) {
        if (!analysis[req.date]) {
          analysis[req.date] = {};
        }

        for (const pos_req of req.position_requirements) {
          const key = `${pos_req.job_position.id}_${req.location_id || 'any'}`;
          if (!analysis[req.date][key]) {
            analysis[req.date][key] = {
              date: req.date,
              position_id: pos_req.job_position.id,
              position_name: pos_req.job_position.name,
              location_id: req.location_id,
              location_name: req.location?.name || 'All',
              required: 0,
              assigned: 0,
              shortfall: 0,
            };
          }
          analysis[req.date][key].required += pos_req.required_count;
        }
      }

      // Add assigned counts
      for (const assignment of assignments) {
        const date = assignment.shift_date;
        if (!analysis[date]) {
          analysis[date] = {};
        }

        const key = `${assignment.job_position_id}_${assignment.location_id}`;
        if (!analysis[date][key]) {
          analysis[date][key] = {
            date,
            position_id: assignment.job_position_id,
            position_name: assignment.job_position?.name || 'Unspecified',
            location_id: assignment.location_id,
            location_name: assignment.location?.name || 'Unknown',
            required: 0,
            assigned: 0,
            shortfall: 0,
          };
        }
        analysis[date][key].assigned += 1;
      }

      // Calculate shortfalls
      for (const date in analysis) {
        for (const key in analysis[date]) {
          const entry = analysis[date][key];
          entry.shortfall = Math.max(0, entry.required - entry.assigned);
        }
      }

      // Convert to sorted array
      const result = [];
      for (const date in analysis) {
        for (const key in analysis[date]) {
          result.push(analysis[date][key]);
        }
      }

      result.sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        if (a.position_id !== b.position_id) return a.position_id - b.position_id;
        return (a.location_id || 0) - (b.location_id || 0);
      });

      return {
        success: true,
        data: {
          coverage: result,
          summary: {
            total_dates: Object.keys(analysis).length,
            total_positions: new Set(result.map((r) => r.position_id)).size,
            total_required: result.reduce((sum, r) => sum + r.required, 0),
            total_assigned: result.reduce((sum, r) => sum + r.assigned, 0),
            total_shortfall: result.reduce((sum, r) => sum + r.shortfall, 0),
          },
        },
      };
    } catch (e) {
      console.error('Get coverage analysis failed:', e);
      throw new TransactionFailedError('Coverage analysis');
    }
  },
};
