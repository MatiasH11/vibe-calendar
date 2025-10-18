import { prisma } from '../config/prisma_client';
import { create_shift_body, get_shifts_query, update_shift_body, duplicate_shift_body, bulk_create_shifts_body, validate_conflicts_body, get_employee_patterns_query, get_suggestions_query } from '../validations/shift.validation';
// NEW: Pure UTC time utilities (PLAN.md 4.2)
// Backend ONLY handles UTC. No timezone conversions. Frontend is responsible for timezone handling.
import {
<<<<<<< HEAD
  toUTCDateTime,
  fromUTCDateTime,
  validateUTCTimeFormat,
  utcTimesOverlap,
  isValidTimeRange,
  calculateDurationMinutes,
  // Deprecated functions still in use - to be refactored
  dateTimeToUtcTime,
  utcTimeToDateTime,
  validateTimeFormat,
  timeLess,
  overlap,
} from '../utils/time.utils';
// NEW: Company settings service for configurable business rules (PLAN.md 5.2)
import { company_settings_service } from './company-settings.service';

export const shift_service = {
  async create(data: create_shift_body, admin_company_id: number) {
    // 1) Verify employee belongs to the same company
    const employee = await prisma.company_employee.findFirst({
      where: { id: data.company_employee_id, company_id: admin_company_id, deleted_at: null },
    });
    if (!employee) {
      throw new UnauthorizedCompanyAccessError('Employee', data.company_employee_id, admin_company_id);
    }

    // 2) Validate UTC time format and no overnight shifts (PLAN.md 4.2)
    // All times are expected in UTC format (HH:mm) from frontend
    if (!validateUTCTimeFormat(data.start_time) || !validateUTCTimeFormat(data.end_time)) {
      throw new Error('INVALID_TIME_FORMAT');
    }
    if (!isValidTimeRange(data.start_time, data.end_time)) {
      throw new Error('OVERNIGHT_NOT_ALLOWED');
    }

    return prisma.$transaction(async (tx) => {
      // 3) Validación de no solapamiento [start, end) para el mismo día
      const existing = await tx.shift.findMany({
        where: {
          company_employee_id: data.company_employee_id,
          shift_date: new Date(data.shift_date),
          deleted_at: null,
        },
      });

<<<<<<< HEAD
      // Check for overlaps with existing shifts
      // All times are in UTC format (HH:mm) - no conversion needed
      for (const s of existing) {
        const sStart = fromUTCDateTime(s.start_time as Date);
        const sEnd = fromUTCDateTime(s.end_time as Date);
        if (utcTimesOverlap(data.start_time, data.end_time, sStart, sEnd)) {
          throw new Error('SHIFT_OVERLAP');
=======
      // El frontend ya envía tiempos UTC, solo validar formato
      if (!validateTimeFormat(data.start_time) || !validateTimeFormat(data.end_time)) {
        throw new InvalidTimeFormatError('start_time or end_time', `${data.start_time} - ${data.end_time}`);
      }

      // Validar solapamiento con tiempos UTC
      for (const s of existing) {
        const sStart = dateTimeToUtcTime(s.start_time as Date);
        const sEnd = dateTimeToUtcTime(s.end_time as Date);
        if (overlap(data.start_time, data.end_time, sStart, sEnd)) {
          throw new ShiftOverlapError(data.company_employee_id, data.shift_date, s);
>>>>>>> a9681daf01dd996ab9cf9156fc3b346286e44884
        }
      }

      // 4) Create shift with UTC times (convert to DateTime for PostgreSQL)
      try {
        const created = await tx.shift.create({
          data: {
            company_employee_id: data.company_employee_id,
            shift_date: new Date(data.shift_date),
            start_time: toUTCDateTime(data.start_time),
            end_time: toUTCDateTime(data.end_time),
            notes: data.notes,
          },
        });

        // 5) Update employee shift patterns
        await this.updateEmployeePattern(
          data.company_employee_id,
          data.start_time,
          data.end_time,
          tx
        );

        return created;
      } catch (error: any) {
        // Manejar error de constraint de unicidad (PLAN.md 1.2)
        if (error.code === 'P2002' && error.meta?.target?.includes('unique_shift_constraint')) {
          throw new Error('SHIFT_DUPLICATE_EXACT');
        }
        throw error;
      }
    });
  },

  async find_by_company(query: get_shifts_query, company_id: number) {
    const where: any = {
      company_employee: { company_id },
      deleted_at: null,
    };
    if (query.start_date && query.end_date) {
      where.shift_date = {
        gte: new Date(query.start_date),
        lte: new Date(query.end_date),
      };
    }
    
    const shifts = await prisma.shift.findMany({
      where,
      include: { company_employee: { include: { user: true } } },
    });
    
    // Return UTC times to frontend (frontend handles timezone conversion)
    return shifts.map(shift => ({
      ...shift,
      start_time: fromUTCDateTime(shift.start_time as Date),
      end_time: fromUTCDateTime(shift.end_time as Date),
    }));
  },

  async update(shift_id: number, data: update_shift_body, admin_company_id: number) {
    // 1) Verificar pertenencia
    const target = await prisma.shift.findUnique({
      where: { id: shift_id },
      include: { company_employee: true },
    });
    if (!target || target.company_employee.company_id !== admin_company_id) {
      throw new Error('UNAUTHORIZED_COMPANY_ACCESS');
    }

    const nextDate = data.shift_date ? new Date(data.shift_date) : target.shift_date;
    
    // Convertir tiempos locales a UTC si se proporcionan
    let nextStart: string;
    let nextEnd: string;
    
    if (data.start_time) {
      if (!validateTimeFormat(data.start_time)) {
        throw new Error('INVALID_START_TIME_FORMAT');
      }
      nextStart = data.start_time;
    } else {
      nextStart = utcTimeToLocal(target.start_time as Date, target.shift_date);
    }
    
    if (data.end_time) {
      if (!validateTimeFormat(data.end_time)) {
        throw new Error('INVALID_END_TIME_FORMAT');
      }
      nextEnd = data.end_time;
    } else {
      nextEnd = utcTimeToLocal(target.end_time as Date, target.shift_date);
    }
    
    if (!timeLess(nextStart, nextEnd)) {
      throw new Error('OVERNIGHT_NOT_ALLOWED');
    }

    return prisma.$transaction(async (tx) => {
      // Validar solapamiento si cambian fecha u horas
      if (data.shift_date || data.start_time || data.end_time) {
        const existing = await tx.shift.findMany({
          where: {
            company_employee_id: target.company_employee_id,
            shift_date: nextDate,
            deleted_at: null,
            NOT: { id: shift_id },
          },
        });
        for (const s of existing) {
          const sStart = utcTimeToLocal(s.start_time as Date, s.shift_date);
          const sEnd = utcTimeToLocal(s.end_time as Date, s.shift_date);
          if (overlap(nextStart, nextEnd, sStart, sEnd)) {
            throw new Error('SHIFT_OVERLAP');
          }
        }
      }

      // Convertir tiempos locales a UTC para almacenar
      const utcStart = data.start_time ? localTimeToUTC(data.start_time, nextDate) : undefined;
      const utcEnd = data.end_time ? localTimeToUTC(data.end_time, nextDate) : undefined;
      
      const updated = await tx.shift.update({
        where: { id: shift_id },
        data: {
          shift_date: nextDate,
          start_time: utcStart,
          end_time: utcEnd,
          notes: data.notes ?? undefined,
        },
      });
      
      // Convertir tiempos UTC a local para devolver
      return {
        ...updated,
        start_time: utcTimeToLocal(updated.start_time as Date, updated.shift_date),
        end_time: utcTimeToLocal(updated.end_time as Date, updated.shift_date),
      };
    });
  },

  async delete(shift_id: number, admin_company_id: number) {
    const target = await prisma.shift.findUnique({
      where: { id: shift_id },
      include: { company_employee: true },
    });
    if (!target || target.company_employee.company_id !== admin_company_id) {
      throw new Error('UNAUTHORIZED_COMPANY_ACCESS');
    }
    await prisma.shift.update({ where: { id: shift_id }, data: { deleted_at: new Date() } });
  },

  // Duplication service methods
  async duplicate(data: duplicate_shift_body, admin_company_id: number) {
    return prisma.$transaction(async (tx) => {
      // 1) Validate source shifts belong to company
      const sourceShifts = await tx.shift.findMany({
        where: {
          id: { in: data.source_shift_ids },
          company_employee: { company_id: admin_company_id },
          deleted_at: null,
        },
        include: { company_employee: true },
      });

      if (sourceShifts.length !== data.source_shift_ids.length) {
        throw new Error('UNAUTHORIZED_SHIFT_ACCESS');
      }

      // 2) Validate target employees belong to company (if specified)
      let targetEmployees: any[] = [];
      if (data.target_employee_ids) {
        targetEmployees = await tx.company_employee.findMany({
          where: {
            id: { in: data.target_employee_ids },
            company_id: admin_company_id,
            deleted_at: null,
          },
        });

        if (targetEmployees.length !== data.target_employee_ids.length) {
          throw new Error('UNAUTHORIZED_EMPLOYEE_ACCESS');
        }
      }

      // 3) Generate duplication plan
      const duplicationsToCreate: Array<{
        company_employee_id: number;
        shift_date: Date;
        start_time: Date;
        end_time: Date;
        notes?: string;
      }> = [];

      for (const sourceShift of sourceShifts) {
        const employeeIds = data.preserve_employee 
          ? [sourceShift.company_employee_id]
          : (data.target_employee_ids || [sourceShift.company_employee_id]);
        
        const dates = data.preserve_date 
          ? [sourceShift.shift_date]
          : (data.target_dates?.map(d => new Date(d)) || [sourceShift.shift_date]);

        for (const employeeId of employeeIds) {
          for (const date of dates) {
            // Skip if it's the same shift (no duplication needed)
            if (employeeId === sourceShift.company_employee_id && 
                date.getTime() === sourceShift.shift_date.getTime()) {
              continue;
            }

            const notes = data.notes_suffix 
              ? `${sourceShift.notes || ''} ${data.notes_suffix}`.trim()
              : sourceShift.notes || undefined;

            duplicationsToCreate.push({
              company_employee_id: employeeId,
              shift_date: date,
              start_time: sourceShift.start_time as Date,
              end_time: sourceShift.end_time as Date,
              notes,
            });
          }
        }
      }

      // 4) Check for conflicts if resolution strategy requires it
      if (data.conflict_resolution === 'fail') {
        const conflicts = await this.checkConflicts(duplicationsToCreate, tx);
        if (conflicts.length > 0) {
          throw new Error('DUPLICATION_CONFLICTS_DETECTED');
        }
      }

      // 5) Handle conflicts based on resolution strategy
      let successfulDuplications: any[] = [];
      let skippedDuplications: any[] = [];

      for (const duplication of duplicationsToCreate) {
        try {
          if (data.conflict_resolution === 'overwrite') {
            // Delete existing conflicting shifts
            await tx.shift.updateMany({
              where: {
                company_employee_id: duplication.company_employee_id,
                shift_date: duplication.shift_date,
                deleted_at: null,
              },
              data: { deleted_at: new Date() },
            });
          } else if (data.conflict_resolution === 'skip') {
            // Check if conflict exists
            const existingShift = await tx.shift.findFirst({
              where: {
                company_employee_id: duplication.company_employee_id,
                shift_date: duplication.shift_date,
                deleted_at: null,
              },
            });

            if (existingShift) {
              const startTime = dateTimeToUtcTime(duplication.start_time);
              const endTime = dateTimeToUtcTime(duplication.end_time);
              const existingStart = dateTimeToUtcTime(existingShift.start_time as Date);
              const existingEnd = dateTimeToUtcTime(existingShift.end_time as Date);

              if (overlap(startTime, endTime, existingStart, existingEnd)) {
                skippedDuplications.push({
                  ...duplication,
                  reason: 'CONFLICT_DETECTED',
                });
                continue;
              }
            }
          }

          // Create the duplicated shift
          const created = await tx.shift.create({
            data: duplication,
          });

          successfulDuplications.push({
            ...created,
            start_time: dateTimeToUtcTime(created.start_time as Date),
            end_time: dateTimeToUtcTime(created.end_time as Date),
          });

        } catch (error: any) {
          if (data.conflict_resolution === 'skip') {
            skippedDuplications.push({
              ...duplication,
              reason: error.message || 'UNKNOWN_ERROR',
            });
          } else {
            throw error;
          }
        }
      }

      return {
        successful: successfulDuplications,
        skipped: skippedDuplications,
        total_requested: duplicationsToCreate.length,
      };
    });
  },

  // Enhanced conflict validation with detailed analysis
  async checkConflicts(shifts: Array<{
    company_employee_id: number;
    shift_date: Date;
    start_time: Date;
    end_time: Date;
  }>, tx?: any) {
    const prismaClient = tx || prisma;
    const conflicts: Array<{
      employee_id: number;
      date: string;
      conflicting_shifts: any[];
      conflict_type: 'overlap' | 'adjacent' | 'duplicate';
      severity: 'high' | 'medium' | 'low';
      resolution_suggestions: string[];
    }> = [];

    for (const shift of shifts) {
      const existingShifts = await prismaClient.shift.findMany({
        where: {
          company_employee_id: shift.company_employee_id,
          shift_date: shift.shift_date,
          deleted_at: null,
        },
        include: {
          company_employee: {
            include: {
              user: true,
            },
          },
        },
      });

      const shiftStart = dateTimeToUtcTime(shift.start_time);
      const shiftEnd = dateTimeToUtcTime(shift.end_time);

      const conflictAnalysis = this.analyzeConflicts(
        shiftStart,
        shiftEnd,
        existingShifts
      );

      if (conflictAnalysis.hasConflicts) {
        conflicts.push({
          employee_id: shift.company_employee_id,
          date: shift.shift_date.toISOString().split('T')[0],
          conflicting_shifts: conflictAnalysis.conflictingShifts,
          conflict_type: conflictAnalysis.conflictType,
          severity: conflictAnalysis.severity,
          resolution_suggestions: conflictAnalysis.resolutionSuggestions,
        });
      }
    }

    return conflicts;
  },

  // Enhanced conflict analysis with detailed categorization
  analyzeConflicts(
    newStart: string,
    newEnd: string,
    existingShifts: any[]
  ): {
    hasConflicts: boolean;
    conflictingShifts: any[];
    conflictType: 'overlap' | 'adjacent' | 'duplicate';
    severity: 'high' | 'medium' | 'low';
    resolutionSuggestions: string[];
  } {
    const conflictingShifts: any[] = [];
    let conflictType: 'overlap' | 'adjacent' | 'duplicate' = 'overlap';
    let severity: 'high' | 'medium' | 'low' = 'low';
    const resolutionSuggestions: string[] = [];

    for (const existing of existingShifts) {
      const existingStart = dateTimeToUtcTime(existing.start_time as Date);
      const existingEnd = dateTimeToUtcTime(existing.end_time as Date);

      // Check for exact duplicate
      if (newStart === existingStart && newEnd === existingEnd) {
        conflictingShifts.push({
          ...existing,
          start_time: existingStart,
          end_time: existingEnd,
        });
        conflictType = 'duplicate';
        severity = 'high';
        resolutionSuggestions.push('This is an exact duplicate of an existing shift');
        resolutionSuggestions.push('Consider modifying the time or removing the duplicate');
        continue;
      }

      // Check for overlap
      if (overlap(newStart, newEnd, existingStart, existingEnd)) {
        conflictingShifts.push({
          ...existing,
          start_time: existingStart,
          end_time: existingEnd,
        });

        // Determine overlap severity
        const overlapMinutes = this.calculateOverlapMinutes(
          newStart, newEnd, existingStart, existingEnd
        );

        if (overlapMinutes >= 240) { // 4+ hours
          severity = 'high';
          resolutionSuggestions.push('Major overlap detected (4+ hours)');
          resolutionSuggestions.push('Consider splitting into separate shifts or adjusting times significantly');
        } else if (overlapMinutes >= 60) { // 1-4 hours
          severity = 'medium';
          resolutionSuggestions.push('Moderate overlap detected (1-4 hours)');
          resolutionSuggestions.push('Adjust start or end time to avoid conflict');
        } else {
          severity = 'low';
          resolutionSuggestions.push('Minor overlap detected (<1 hour)');
          resolutionSuggestions.push('Small time adjustment should resolve the conflict');
        }
        continue;
      }

      // Check for adjacent shifts (potential issues)
      if (this.areAdjacent(newStart, newEnd, existingStart, existingEnd)) {
        const timeBetween = this.calculateTimeBetweenShifts(
          newStart, newEnd, existingStart, existingEnd
        );

        if (timeBetween < 30) { // Less than 30 minutes between shifts
          conflictingShifts.push({
            ...existing,
            start_time: existingStart,
            end_time: existingEnd,
          });
          conflictType = 'adjacent';
          severity = 'low';
          resolutionSuggestions.push('Shifts are very close together (less than 30 minutes apart)');
          resolutionSuggestions.push('Consider if employee needs break time between shifts');
        }
      }
    }

    return {
      hasConflicts: conflictingShifts.length > 0,
      conflictingShifts,
      conflictType,
      severity,
      resolutionSuggestions: Array.from(new Set(resolutionSuggestions)), // Remove duplicates
    };
  },

  // Calculate overlap in minutes
  calculateOverlapMinutes(
    start1: string, end1: string,
    start2: string, end2: string
  ): number {
    const [s1h, s1m] = start1.split(':').map(Number);
    const [e1h, e1m] = end1.split(':').map(Number);
    const [s2h, s2m] = start2.split(':').map(Number);
    const [e2h, e2m] = end2.split(':').map(Number);

    const start1Minutes = s1h * 60 + s1m;
    const end1Minutes = e1h * 60 + e1m;
    const start2Minutes = s2h * 60 + s2m;
    const end2Minutes = e2h * 60 + e2m;

    const overlapStart = Math.max(start1Minutes, start2Minutes);
    const overlapEnd = Math.min(end1Minutes, end2Minutes);

    return Math.max(0, overlapEnd - overlapStart);
  },

  // Check if shifts are adjacent (back-to-back or close)
  areAdjacent(
    start1: string, end1: string,
    start2: string, end2: string
  ): boolean {
    const timeBetween = this.calculateTimeBetweenShifts(start1, end1, start2, end2);
    return timeBetween >= 0 && timeBetween <= 60; // Within 1 hour
  },

  // Calculate time between shifts in minutes
  calculateTimeBetweenShifts(
    start1: string, end1: string,
    start2: string, end2: string
  ): number {
    const [e1h, e1m] = end1.split(':').map(Number);
    const [s2h, s2m] = start2.split(':').map(Number);
    const [e2h, e2m] = end2.split(':').map(Number);
    const [s1h, s1m] = start1.split(':').map(Number);

    const end1Minutes = e1h * 60 + e1m;
    const start2Minutes = s2h * 60 + s2m;
    const end2Minutes = e2h * 60 + e2m;
    const start1Minutes = s1h * 60 + s1m;

    // Calculate both directions and return the minimum
    const gap1 = start2Minutes - end1Minutes; // Time from end of shift1 to start of shift2
    const gap2 = start1Minutes - end2Minutes; // Time from end of shift2 to start of shift1

    return Math.min(Math.abs(gap1), Math.abs(gap2));
  },

  // Enhanced conflict validation with business rules
  async validateShiftBusinessRules(
    employeeId: number,
    shiftDate: Date,
    startTime: string,
    endTime: string,
    companyId: number
  ): Promise<{
    isValid: boolean;
    violations: Array<{
      rule: string;
      severity: 'error' | 'warning';
      message: string;
    }>;
  }> {
    const violations: Array<{
      rule: string;
      severity: 'error' | 'warning';
      message: string;
    }> = [];

    // PLAN.md 5.2: Get company-specific settings for business rules
    const settings = await company_settings_service.getSettings(companyId);
    const maxDailyHours = parseFloat(settings.max_daily_hours.toString());
    const maxWeeklyHours = parseFloat(settings.max_weekly_hours.toString());
    const minBreakHours = parseFloat(settings.min_break_hours.toString());

    // Rule 1: Maximum daily hours (configured per company)
    const existingShifts = await prisma.shift.findMany({
      where: {
        company_employee_id: employeeId,
        shift_date: shiftDate,
        deleted_at: null,
      },
    });

    const newShiftDuration = this.calculateDurationHours(startTime, endTime);
    const existingDailyHours = existingShifts.reduce((total, shift) => {
      const start = dateTimeToUtcTime(shift.start_time as Date);
      const end = dateTimeToUtcTime(shift.end_time as Date);
      return total + this.calculateDurationHours(start, end);
    }, 0);

    const totalDailyHours = existingDailyHours + newShiftDuration;
    if (totalDailyHours > maxDailyHours) {
      violations.push({
        rule: 'MAX_DAILY_HOURS',
        severity: 'error',
        message: `Total daily hours (${totalDailyHours}h) exceeds maximum allowed (${maxDailyHours}h)`,
      });
    } else if (totalDailyHours > maxDailyHours * 0.83) { // 83% threshold for warning (e.g., 10h for 12h max)
      violations.push({
        rule: 'RECOMMENDED_DAILY_HOURS',
        severity: 'warning',
        message: `Total daily hours (${totalDailyHours}h) exceeds recommended limit (${Math.round(maxDailyHours * 0.83 * 10) / 10}h)`,
      });
    }

    // Rule 2: Minimum break between shifts (configured per company)
    const previousDay = new Date(shiftDate);
    previousDay.setDate(previousDay.getDate() - 1);
    const nextDay = new Date(shiftDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const adjacentShifts = await prisma.shift.findMany({
      where: {
        company_employee_id: employeeId,
        shift_date: { in: [previousDay, nextDay] },
        deleted_at: null,
      },
    });

    for (const adjacentShift of adjacentShifts) {
      const adjStart = dateTimeToUtcTime(adjacentShift.start_time as Date);
      const adjEnd = dateTimeToUtcTime(adjacentShift.end_time as Date);

      let breakHours = 0;
      if (adjacentShift.shift_date < shiftDate) {
        // Previous day shift
        breakHours = this.calculateBreakHours(adjEnd, startTime);
      } else {
        // Next day shift
        breakHours = this.calculateBreakHours(endTime, adjStart);
      }

      if (breakHours < minBreakHours) {
        violations.push({
          rule: 'MINIMUM_BREAK_HOURS',
          severity: 'error',
          message: `Insufficient break time (${breakHours}h) between shifts. Minimum ${minBreakHours}h required.`,
        });
      }
    }

    // Rule 3: Maximum weekly hours (configured per company)
    const weekStart = new Date(shiftDate);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    const weeklyShifts = await prisma.shift.findMany({
      where: {
        company_employee_id: employeeId,
        shift_date: {
          gte: weekStart,
          lte: weekEnd,
        },
        deleted_at: null,
      },
    });

    const weeklyHours = weeklyShifts.reduce((total, shift) => {
      const start = dateTimeToUtcTime(shift.start_time as Date);
      const end = dateTimeToUtcTime(shift.end_time as Date);
      return total + this.calculateDurationHours(start, end);
    }, 0) + newShiftDuration;

    if (weeklyHours > maxWeeklyHours) {
      violations.push({
        rule: 'MAX_WEEKLY_HOURS',
        severity: 'warning',
        message: `Total weekly hours (${weeklyHours}h) exceeds limit (${maxWeeklyHours}h)`,
      });
    }

    return {
      isValid: violations.filter(v => v.severity === 'error').length === 0,
      violations,
    };
  },

  // Calculate break hours between shifts
  calculateBreakHours(endTime: string, startTime: string): number {
    const [eh, em] = endTime.split(':').map(Number);
    const [sh, sm] = startTime.split(':').map(Number);
    
    let endMinutes = eh * 60 + em;
    let startMinutes = sh * 60 + sm;
    
    // Handle next day scenario
    if (startMinutes < endMinutes) {
      startMinutes += 24 * 60; // Add 24 hours
    }
    
    const breakMinutes = startMinutes - endMinutes;
    return Math.round(breakMinutes / 60 * 10) / 10; // Round to 1 decimal
  },

  // Bulk creation service methods
  async bulkCreate(data: bulk_create_shifts_body, admin_company_id: number) {
    return prisma.$transaction(async (tx) => {
      // 1) Validate employees belong to company
      const employees = await tx.company_employee.findMany({
        where: {
          id: { in: data.employee_ids },
          company_id: admin_company_id,
          deleted_at: null,
        },
      });

      if (employees.length !== data.employee_ids.length) {
        throw new Error('UNAUTHORIZED_EMPLOYEE_ACCESS');
      }

      // 2) Validate template if provided
      let templateData: { start_time: string; end_time: string } | null = null;
      if (data.template_id) {
        const template = await tx.shift_template.findFirst({
          where: {
            id: data.template_id,
            company_id: admin_company_id,
            deleted_at: null,
          },
        });

        if (!template) {
          throw new Error('TEMPLATE_NOT_FOUND');
        }

        templateData = {
          start_time: dateTimeToUtcTime(template.start_time as Date),
          end_time: dateTimeToUtcTime(template.end_time as Date),
        };

        // Update template usage count
        await tx.shift_template.update({
          where: { id: data.template_id },
          data: { usage_count: { increment: data.employee_ids.length * data.dates.length } },
        });
      }

      // 3) Use template data or provided times
      const startTime = templateData?.start_time || data.start_time;
      const endTime = templateData?.end_time || data.end_time;

      // 4) Validate time format and range
      if (!validateTimeFormat(startTime) || !validateTimeFormat(endTime)) {
        throw new Error('INVALID_TIME_FORMAT');
      }
      if (!timeLess(startTime, endTime)) {
        throw new Error('OVERNIGHT_NOT_ALLOWED');
      }

      // 5) Generate bulk creation plan
      const shiftsToCreate: Array<{
        company_employee_id: number;
        shift_date: Date;
        start_time: Date;
        end_time: Date;
        notes?: string;
      }> = [];

      for (const employeeId of data.employee_ids) {
        for (const dateStr of data.dates) {
          shiftsToCreate.push({
            company_employee_id: employeeId,
            shift_date: new Date(dateStr),
            start_time: utcTimeToDateTime(startTime),
            end_time: utcTimeToDateTime(endTime),
            notes: data.notes,
          });
        }
      }

      // 6) Preview mode - return what would be created without creating
      if (data.preview_only) {
        const conflicts = await this.checkConflicts(shiftsToCreate, tx);
        return {
          preview: shiftsToCreate.map(shift => ({
            ...shift,
            start_time: dateTimeToUtcTime(shift.start_time),
            end_time: dateTimeToUtcTime(shift.end_time),
            shift_date: shift.shift_date.toISOString().split('T')[0],
          })),
          conflicts,
          total_shifts: shiftsToCreate.length,
          estimated_conflicts: conflicts.length,
        };
      }

      // 7) Check for conflicts if resolution strategy requires it
      if (data.conflict_resolution === 'fail') {
        const conflicts = await this.checkConflicts(shiftsToCreate, tx);
        if (conflicts.length > 0) {
          throw new Error('BULK_CREATION_CONFLICTS_DETECTED');
        }
      }

      // 8) Handle conflicts based on resolution strategy
      let successfulCreations: any[] = [];
      let skippedCreations: any[] = [];

      for (const shiftData of shiftsToCreate) {
        try {
          if (data.conflict_resolution === 'overwrite') {
            // Delete existing conflicting shifts
            await tx.shift.updateMany({
              where: {
                company_employee_id: shiftData.company_employee_id,
                shift_date: shiftData.shift_date,
                deleted_at: null,
              },
              data: { deleted_at: new Date() },
            });
          } else if (data.conflict_resolution === 'skip') {
            // Check if conflict exists
            const existingShifts = await tx.shift.findMany({
              where: {
                company_employee_id: shiftData.company_employee_id,
                shift_date: shiftData.shift_date,
                deleted_at: null,
              },
            });

            const shiftStart = dateTimeToUtcTime(shiftData.start_time);
            const shiftEnd = dateTimeToUtcTime(shiftData.end_time);

            const hasConflict = existingShifts.some((existing: any) => {
              const existingStart = dateTimeToUtcTime(existing.start_time as Date);
              const existingEnd = dateTimeToUtcTime(existing.end_time as Date);
              return overlap(shiftStart, shiftEnd, existingStart, existingEnd);
            });

            if (hasConflict) {
              skippedCreations.push({
                ...shiftData,
                start_time: shiftStart,
                end_time: shiftEnd,
                shift_date: shiftData.shift_date.toISOString().split('T')[0],
                reason: 'CONFLICT_DETECTED',
              });
              continue;
            }
          }

          // Create the shift
          const created = await tx.shift.create({
            data: shiftData,
          });

          successfulCreations.push({
            ...created,
            start_time: dateTimeToUtcTime(created.start_time as Date),
            end_time: dateTimeToUtcTime(created.end_time as Date),
          });

        } catch (error: any) {
          if (data.conflict_resolution === 'skip') {
            skippedCreations.push({
              ...shiftData,
              start_time: dateTimeToUtcTime(shiftData.start_time),
              end_time: dateTimeToUtcTime(shiftData.end_time),
              shift_date: shiftData.shift_date.toISOString().split('T')[0],
              reason: error.message || 'UNKNOWN_ERROR',
            });
          } else {
            throw error;
          }
        }
      }

      return {
        successful: successfulCreations,
        skipped: skippedCreations,
        total_requested: shiftsToCreate.length,
        template_used: data.template_id || null,
      };
    });
  },

  // Enhanced conflict validation for external use
  async validateConflicts(data: validate_conflicts_body, admin_company_id: number) {
    // 1) Validate employees belong to company
    const employeeIdsSet = new Set(data.shifts.map(s => s.company_employee_id));
    const employeeIds = Array.from(employeeIdsSet);
    const employees = await prisma.company_employee.findMany({
      where: {
        id: { in: employeeIds },
        company_id: admin_company_id,
        deleted_at: null,
      },
    });

    if (employees.length !== employeeIds.length) {
      throw new Error('UNAUTHORIZED_EMPLOYEE_ACCESS');
    }

    // 2) Convert shifts to internal format for conflict checking
    const shiftsToCheck = data.shifts.map(shift => ({
      company_employee_id: shift.company_employee_id,
      shift_date: new Date(shift.shift_date),
      start_time: utcTimeToDateTime(shift.start_time),
      end_time: utcTimeToDateTime(shift.end_time),
    }));

    // 3) Check schedule conflicts
    const scheduleConflicts = await this.checkConflicts(shiftsToCheck);

    // 4) Check business rule violations
    const businessRuleViolations = await Promise.all(
      data.shifts.map(async (shift) => {
        const validation = await this.validateShiftBusinessRules(
          shift.company_employee_id,
          new Date(shift.shift_date),
          shift.start_time,
          shift.end_time,
          admin_company_id
        );

        return {
          employee_id: shift.company_employee_id,
          date: shift.shift_date,
          start_time: shift.start_time,
          end_time: shift.end_time,
          is_valid: validation.isValid,
          violations: validation.violations,
        };
      })
    );

    // 5) Generate alternative suggestions for conflicted shifts
    const conflictsWithSuggestions = await Promise.all(
      scheduleConflicts.map(async (conflict) => {
        const suggestions = await this.generateAlternativeTimeSlots(
          conflict.employee_id,
          conflict.date,
          admin_company_id
        );

        return {
          ...conflict,
          suggested_alternatives: suggestions,
        };
      })
    );

    // 6) Compile comprehensive validation results
    const hasScheduleConflicts = scheduleConflicts.length > 0;
    const hasBusinessRuleViolations = businessRuleViolations.some(v => !v.is_valid);
    const hasErrors = businessRuleViolations.some(v => 
      v.violations.some(violation => violation.severity === 'error')
    );

    return {
      schedule_conflicts: conflictsWithSuggestions,
      business_rule_violations: businessRuleViolations.filter(v => !v.is_valid),
      total_schedule_conflicts: scheduleConflicts.length,
      total_business_violations: businessRuleViolations.filter(v => !v.is_valid).length,
      has_conflicts: hasScheduleConflicts,
      has_violations: hasBusinessRuleViolations,
      has_errors: hasErrors,
      overall_valid: !hasScheduleConflicts && !hasErrors,
      summary: {
        total_shifts_validated: data.shifts.length,
        schedule_conflicts: scheduleConflicts.length,
        business_violations: businessRuleViolations.filter(v => !v.is_valid).length,
        warnings: businessRuleViolations.reduce((count, v) => 
          count + v.violations.filter(violation => violation.severity === 'warning').length, 0
        ),
        errors: businessRuleViolations.reduce((count, v) => 
          count + v.violations.filter(violation => violation.severity === 'error').length, 0
        ),
      },
    };
  },

  // Helper method to generate alternative time slots
  async generateAlternativeTimeSlots(
    employeeId: number,
    dateStr: string,
    companyId: number
  ): Promise<Array<{ start_time: string; end_time: string; reason: string }>> {
    const date = new Date(dateStr);
    const alternatives: Array<{ start_time: string; end_time: string; reason: string }> = [];

    // Get existing shifts for the day
    const existingShifts = await prisma.shift.findMany({
      where: {
        company_employee_id: employeeId,
        shift_date: date,
        deleted_at: null,
      },
      orderBy: { start_time: 'asc' },
    });

    // Common shift durations (in hours)
    const commonDurations = [4, 6, 8];
    
    // Time slots to try (24-hour format)
    const timeSlots = [
      '06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
      '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00',
      '20:00', '21:00', '22:00'
    ];

    for (const startTime of timeSlots) {
      for (const duration of commonDurations) {
        const startHour = parseInt(startTime.split(':')[0]);
        const endHour = startHour + duration;
        
        if (endHour > 23) continue; // No overnight shifts
        
        const endTime = `${endHour.toString().padStart(2, '0')}:00`;
        
        // Check if this slot conflicts with existing shifts
        const hasConflict = existingShifts.some((existing: any) => {
          const existingStart = dateTimeToUtcTime(existing.start_time as Date);
          const existingEnd = dateTimeToUtcTime(existing.end_time as Date);
          return overlap(startTime, endTime, existingStart, existingEnd);
        });

        if (!hasConflict) {
          alternatives.push({
            start_time: startTime,
            end_time: endTime,
            reason: `${duration}-hour shift slot`,
          });
        }
      }
    }

    // Limit to top 5 alternatives
    return alternatives.slice(0, 5);
  },

  // Pattern tracking and suggestions methods
  async updateEmployeePattern(
    employeeId: number,
    startTime: string,
    endTime: string,
    tx?: any
  ) {
    const prismaClient = tx || prisma;

    // Convert time strings to DateTime for database storage
    const startDateTime = utcTimeToDateTime(startTime);
    const endDateTime = utcTimeToDateTime(endTime);

    // Try to find existing pattern
    const existingPattern = await prismaClient.employee_shift_pattern.findUnique({
      where: {
        company_employee_id_start_time_end_time: {
          company_employee_id: employeeId,
          start_time: startDateTime,
          end_time: endDateTime,
        },
      },
    });

    if (existingPattern) {
      // Update frequency count and last used
      await prismaClient.employee_shift_pattern.update({
        where: { id: existingPattern.id },
        data: {
          frequency_count: { increment: 1 },
          last_used: new Date(),
          updated_at: new Date(),
        },
      });
    } else {
      // Create new pattern
      await prismaClient.employee_shift_pattern.create({
        data: {
          company_employee_id: employeeId,
          start_time: startDateTime,
          end_time: endDateTime,
          frequency_count: 1,
          last_used: new Date(),
        },
      });
    }
  },

  async getEmployeePatterns(query: get_employee_patterns_query, admin_company_id: number) {
    // 1) Validate employee belongs to company
    const employee = await prisma.company_employee.findFirst({
      where: {
        id: query.employee_id,
        company_id: admin_company_id,
        deleted_at: null,
      },
    });

    if (!employee) {
      throw new Error('UNAUTHORIZED_EMPLOYEE_ACCESS');
    }

    // 2) Get patterns ordered by frequency and recency
    const patterns = await prisma.employee_shift_pattern.findMany({
      where: {
        company_employee_id: query.employee_id,
      },
      orderBy: [
        { frequency_count: 'desc' },
        { last_used: 'desc' },
      ],
      take: query.limit,
    });

    // 3) Convert to response format
    return patterns.map(pattern => ({
      id: pattern.id,
      start_time: dateTimeToUtcTime(pattern.start_time as Date),
      end_time: dateTimeToUtcTime(pattern.end_time as Date),
      frequency_count: pattern.frequency_count,
      last_used: pattern.last_used.toISOString(),
      duration_hours: this.calculateDurationHours(
        dateTimeToUtcTime(pattern.start_time as Date),
        dateTimeToUtcTime(pattern.end_time as Date)
      ),
    }));
  },

  async getSuggestions(query: get_suggestions_query, admin_company_id: number) {
    // 1) Validate employee belongs to company
    const employee = await prisma.company_employee.findFirst({
      where: {
        id: query.employee_id,
        company_id: admin_company_id,
        deleted_at: null,
      },
    });

    if (!employee) {
      throw new Error('UNAUTHORIZED_EMPLOYEE_ACCESS');
    }

    const suggestions: Array<{
      start_time: string;
      end_time: string;
      frequency: number;
      source: 'pattern' | 'template' | 'recent';
      label: string;
      confidence: number;
    }> = [];

    // 2) Get employee patterns (top suggestions)
    const patterns = await prisma.employee_shift_pattern.findMany({
      where: {
        company_employee_id: query.employee_id,
      },
      orderBy: [
        { frequency_count: 'desc' },
        { last_used: 'desc' },
      ],
      take: 3,
    });

    patterns.forEach(pattern => {
      const startTime = dateTimeToUtcTime(pattern.start_time as Date);
      const endTime = dateTimeToUtcTime(pattern.end_time as Date);
      const duration = this.calculateDurationHours(startTime, endTime);
      
      suggestions.push({
        start_time: startTime,
        end_time: endTime,
        frequency: pattern.frequency_count,
        source: 'pattern',
        label: `${duration}h shift (used ${pattern.frequency_count} times)`,
        confidence: Math.min(pattern.frequency_count * 10, 100),
      });
    });

    // 3) Get recent shifts if patterns are limited
    if (patterns.length < 3) {
      const recentShifts = await prisma.shift.findMany({
        where: {
          company_employee_id: query.employee_id,
          deleted_at: null,
        },
        orderBy: { created_at: 'desc' },
        take: 5,
        distinct: ['start_time', 'end_time'],
      });

      recentShifts.forEach(shift => {
        const startTime = dateTimeToUtcTime(shift.start_time as Date);
        const endTime = dateTimeToUtcTime(shift.end_time as Date);
        const duration = this.calculateDurationHours(startTime, endTime);

        // Only add if not already in patterns
        const alreadyExists = suggestions.some(s => 
          s.start_time === startTime && s.end_time === endTime
        );

        if (!alreadyExists) {
          suggestions.push({
            start_time: startTime,
            end_time: endTime,
            frequency: 1,
            source: 'recent',
            label: `${duration}h shift (recent)`,
            confidence: 30,
          });
        }
      });
    }

    // 4) Get popular company templates if still need more suggestions
    if (suggestions.length < query.limit) {
      const templates = await prisma.shift_template.findMany({
        where: {
          company_id: admin_company_id,
          deleted_at: null,
        },
        orderBy: { usage_count: 'desc' },
        take: 3,
      });

      templates.forEach(template => {
        const startTime = dateTimeToUtcTime(template.start_time as Date);
        const endTime = dateTimeToUtcTime(template.end_time as Date);
        const duration = this.calculateDurationHours(startTime, endTime);

        // Only add if not already in suggestions
        const alreadyExists = suggestions.some(s => 
          s.start_time === startTime && s.end_time === endTime
        );

        if (!alreadyExists) {
          suggestions.push({
            start_time: startTime,
            end_time: endTime,
            frequency: template.usage_count,
            source: 'template',
            label: `${template.name} (${duration}h)`,
            confidence: Math.min(template.usage_count * 5, 80),
          });
        }
      });
    }

    // 5) Sort by confidence and limit results
    return suggestions
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, query.limit);
  },

  // Helper method to calculate duration in hours
  calculateDurationHours(startTime: string, endTime: string): number {
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    
    return Math.round((endMinutes - startMinutes) / 60 * 10) / 10; // Round to 1 decimal
  },

  // Method to clean up old patterns (optional maintenance)
  async cleanupOldPatterns(companyId: number, daysOld: number = 365) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    await prisma.employee_shift_pattern.deleteMany({
      where: {
        company_employee: {
          company_id: companyId,
        },
        last_used: {
          lt: cutoffDate,
        },
        frequency_count: {
          lt: 3, // Only delete patterns used less than 3 times
        },
      },
    });
  },
};


