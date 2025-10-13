import { AppError } from './app-error';
import { HTTP_CODES } from '../constants/http_codes';

/**
 * Thrown when trying to create role with duplicate name
 */
export class DuplicateRoleError extends AppError {
  readonly statusCode = HTTP_CODES.CONFLICT;
  readonly code = 'DUPLICATE_ROLE';

  constructor(roleName: string, companyId: number) {
    super('A role with this name already exists in your company', {
      roleName,
      companyId,
    });
  }
}

/**
 * Thrown when role not found
 */
export class RoleNotFoundError extends AppError {
  readonly statusCode = HTTP_CODES.NOT_FOUND;
  readonly code = 'ROLE_NOT_FOUND';

  constructor(roleId: number) {
    super('Role not found', { roleId });
  }
}

/**
 * Thrown when trying to delete role that has employees
 */
export class RoleHasEmployeesError extends AppError {
  readonly statusCode = HTTP_CODES.CONFLICT;
  readonly code = 'ROLE_HAS_EMPLOYEES';

  constructor(roleId: number, employeeCount: number) {
    super('Cannot delete role because it has employees assigned to it', {
      roleId,
      employeeCount,
    });
  }
}
