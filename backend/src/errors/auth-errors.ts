import { AppError } from './app-error';
import { HTTP_CODES } from '../constants/http_codes';

/**
 * Thrown when user tries to register with an email that already exists
 */
export class EmailAlreadyExistsError extends AppError {
  readonly statusCode = HTTP_CODES.CONFLICT;
  readonly code = 'EMAIL_ALREADY_EXISTS';

  constructor(email: string) {
    super('A user with this email already exists', { email });
  }
}

/**
 * Thrown when company tries to register with a name that already exists
 */
export class CompanyNameAlreadyExistsError extends AppError {
  readonly statusCode = HTTP_CODES.CONFLICT;
  readonly code = 'COMPANY_NAME_ALREADY_EXISTS';

  constructor(companyName: string) {
    super('A company with this name already exists', { companyName });
  }
}

/**
 * Thrown when login credentials are invalid
 */
export class InvalidCredentialsError extends AppError {
  readonly statusCode = HTTP_CODES.UNAUTHORIZED;
  readonly code = 'INVALID_CREDENTIALS';

  constructor() {
    super('Invalid email or password');
  }
}

/**
 * Thrown when user is not associated with any company
 */
export class UserNotAssociatedWithCompanyError extends AppError {
  readonly statusCode = HTTP_CODES.FORBIDDEN;
  readonly code = 'USER_NOT_ASSOCIATED_WITH_COMPANY';

  constructor(userId: number) {
    super('User is not associated with any company', { userId });
  }
}

/**
 * Thrown when a database transaction fails
 */
export class TransactionFailedError extends AppError {
  readonly statusCode = HTTP_CODES.INTERNAL_SERVER_ERROR;
  readonly code = 'TRANSACTION_FAILED';

  constructor(context?: string) {
    super('Database transaction failed', { context });
  }
}

/**
 * Thrown when a requested resource is not found
 */
export class ResourceNotFoundError extends AppError {
  readonly statusCode = HTTP_CODES.NOT_FOUND;
  readonly code = 'RESOURCE_NOT_FOUND';

  constructor(resourceType: string, resourceId: number | string) {
    super(`${resourceType} not found`, { resourceType, resourceId });
  }
}

/**
 * Thrown when user tries to access a resource from a different company
 */
export class UnauthorizedCompanyAccessError extends AppError {
  readonly statusCode = HTTP_CODES.FORBIDDEN;
  readonly code = 'UNAUTHORIZED_COMPANY_ACCESS';

  constructor(resourceType: string, resourceId: number) {
    super(`Unauthorized access to ${resourceType}`, { resourceType, resourceId });
  }
}

/**
 * Thrown when a shift assignment conflicts with existing shifts
 */
export class ShiftConflictError extends AppError {
  readonly statusCode = HTTP_CODES.CONFLICT;
  readonly code = 'SHIFT_CONFLICT';

  constructor(employeeId: number, conflictingShiftId?: number) {
    super('Shift assignment conflicts with existing shift', {
      employeeId,
      conflictingShiftId,
    });
  }
}

/**
 * Thrown when a shift assignment violates business rules
 */
export class BusinessRuleViolationError extends AppError {
  readonly statusCode = HTTP_CODES.BAD_REQUEST;
  readonly code = 'BUSINESS_RULE_VIOLATION';

  constructor(message: string, violations?: string[]) {
    super(message, { violations });
  }
}
