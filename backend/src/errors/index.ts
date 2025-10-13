// Base error class
export { AppError } from './app-error';

// Authentication errors
export {
  EmailAlreadyExistsError,
  CompanyNameAlreadyExistsError,
  InvalidCredentialsError,
  UserNotAssociatedWithCompanyError,
  TransactionFailedError,
} from './auth-errors';

// Employee errors
export {
  UnauthorizedCompanyAccessError,
  UnauthorizedEmployeeAccessError,
  EmployeeNotFoundError,
  EmployeeAlreadyExistsError,
} from './employee-errors';

// Shift errors
export {
  InvalidTimeFormatError,
  OvernightNotAllowedError,
  ShiftOverlapError,
  UnauthorizedShiftAccessError,
  DuplicationConflictsDetectedError,
  BulkCreationConflictsDetectedError,
  InvalidStartTimeFormatError,
  InvalidEndTimeFormatError,
} from './shift-errors';

// Role errors
export {
  DuplicateRoleError,
  RoleNotFoundError,
  RoleHasEmployeesError,
} from './role-errors';

// Template errors
export {
  DuplicateTemplateNameError,
  TemplateNotFoundError,
} from './template-errors';
