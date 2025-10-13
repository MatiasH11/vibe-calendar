import { AppError } from './app-error';
import { HTTP_CODES } from '../constants/http_codes';

/**
 * Thrown when trying to access employee from different company
 */
export class UnauthorizedCompanyAccessError extends AppError {
  readonly statusCode = HTTP_CODES.FORBIDDEN;
  readonly code = 'UNAUTHORIZED_COMPANY_ACCESS';

  constructor(resourceType: string, resourceId: number, companyId: number) {
    super(`${resourceType} does not belong to your company`, {
      resourceType,
      resourceId,
      companyId,
    });
  }
}

/**
 * Thrown when trying to access employee that doesn't belong to company
 */
export class UnauthorizedEmployeeAccessError extends AppError {
  readonly statusCode = HTTP_CODES.FORBIDDEN;
  readonly code = 'UNAUTHORIZED_EMPLOYEE_ACCESS';

  constructor(employeeId: number, companyId: number) {
    super('Employee does not belong to your company', {
      employeeId,
      companyId,
    });
  }
}

/**
 * Thrown when employee not found
 */
export class EmployeeNotFoundError extends AppError {
  readonly statusCode = HTTP_CODES.NOT_FOUND;
  readonly code = 'EMPLOYEE_NOT_FOUND';

  constructor(employeeId: number) {
    super('Employee not found', { employeeId });
  }
}

/**
 * Thrown when trying to create employee that already exists
 */
export class EmployeeAlreadyExistsError extends AppError {
  readonly statusCode = HTTP_CODES.CONFLICT;
  readonly code = 'EMPLOYEE_ALREADY_EXISTS';

  constructor(userId: number, companyId: number) {
    super('User is already an employee of this company', {
      userId,
      companyId,
    });
  }
}
