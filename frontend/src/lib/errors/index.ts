/**
 * Error handling system for API requests
 * Provides typed errors matching backend error responses
 */

// Export all error classes
export {
  ApiError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  BusinessRuleError,
  InternalServerError,
  NetworkError,
  UnknownError,
} from './ApiError';

// Export factory functions
export {
  createApiError,
  extractFieldErrors,
  isRetryableError,
  requiresAuthentication,
  isPermissionError,
} from './factory';

// Export types
export type { ApiErrorResponse, ErrorMetadata } from './types';
export { ErrorCode, HttpStatus } from './types';
