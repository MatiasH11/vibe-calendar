import { AppError } from './app-error';
import { HTTP_CODES } from '../constants/http_codes';

/**
 * Thrown when shift time format is invalid
 */
export class InvalidTimeFormatError extends AppError {
  readonly statusCode = HTTP_CODES.BAD_REQUEST;
  readonly code = 'INVALID_TIME_FORMAT';

  constructor(field: string, value: string) {
    super(`Invalid time format for ${field}. Expected HH:mm format`, {
      field,
      value,
    });
  }
}

/**
 * Thrown when trying to create overnight shift (not allowed)
 */
export class OvernightNotAllowedError extends AppError {
  readonly statusCode = HTTP_CODES.BAD_REQUEST;
  readonly code = 'OVERNIGHT_NOT_ALLOWED';

  constructor(startTime?: string, endTime?: string) {
    super('Overnight shifts are not allowed. End time must be after start time', {
      startTime,
      endTime,
    });
  }
}

/**
 * Thrown when shift overlaps with existing shift
 */
export class ShiftOverlapError extends AppError {
  readonly statusCode = HTTP_CODES.CONFLICT;
  readonly code = 'SHIFT_OVERLAP';

  constructor(employeeId: number, date: string, existingShift?: any) {
    super('Shift overlaps with an existing shift', {
      employeeId,
      date,
      existingShift,
    });
  }
}

/**
 * Thrown when trying to access shift from different company
 */
export class UnauthorizedShiftAccessError extends AppError {
  readonly statusCode = HTTP_CODES.FORBIDDEN;
  readonly code = 'UNAUTHORIZED_SHIFT_ACCESS';

  constructor(shiftId: number, companyId: number) {
    super('Shift does not belong to your company', {
      shiftId,
      companyId,
    });
  }
}

/**
 * Thrown when conflicts detected during duplication
 */
export class DuplicationConflictsDetectedError extends AppError {
  readonly statusCode = HTTP_CODES.CONFLICT;
  readonly code = 'DUPLICATION_CONFLICTS_DETECTED';

  constructor(conflicts: any[]) {
    super('Conflicts detected during duplication. Use conflict_resolution strategy to handle them', {
      conflictCount: conflicts.length,
      conflicts,
    });
  }
}

/**
 * Thrown when conflicts detected during bulk creation
 */
export class BulkCreationConflictsDetectedError extends AppError {
  readonly statusCode = HTTP_CODES.CONFLICT;
  readonly code = 'BULK_CREATION_CONFLICTS_DETECTED';

  constructor(conflicts: any[]) {
    super('Conflicts detected during bulk creation. Use conflict_resolution strategy to handle them', {
      conflictCount: conflicts.length,
      conflicts,
    });
  }
}

/**
 * Thrown when shift start time format is invalid
 */
export class InvalidStartTimeFormatError extends AppError {
  readonly statusCode = HTTP_CODES.BAD_REQUEST;
  readonly code = 'INVALID_START_TIME_FORMAT';

  constructor(value: string) {
    super('Invalid start_time format. Expected HH:mm', { value });
  }
}

/**
 * Thrown when shift end time format is invalid
 */
export class InvalidEndTimeFormatError extends AppError {
  readonly statusCode = HTTP_CODES.BAD_REQUEST;
  readonly code = 'INVALID_END_TIME_FORMAT';

  constructor(value: string) {
    super('Invalid end_time format. Expected HH:mm', { value });
  }
}
