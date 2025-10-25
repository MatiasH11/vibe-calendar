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

