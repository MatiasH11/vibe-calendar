import {
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
import { ApiErrorResponse, ErrorMetadata, HttpStatus } from './types';

/**
 * Transform backend error response into typed ApiError
 */
export function createApiError(response: ApiErrorResponse | Error | unknown): ApiError {
  // Handle network/fetch errors
  if (response instanceof Error) {
    if (response.name === 'AbortError' || response.message.includes('timeout')) {
      return new NetworkError('Request timeout', {
        originalError: response,
      });
    }
    if (response.message.includes('fetch') || response.message.includes('network')) {
      return new NetworkError(response.message, {
        originalError: response,
      });
    }
    // Generic error
    return new UnknownError(response.message, {
      originalError: response,
    });
  }

  // Handle backend API error responses
  if (isApiErrorResponse(response)) {
    const statusCode = response.statusCode || response.error?.statusCode || 0;
    const message = response.error?.message || 'Unknown error';
    const metadata: ErrorMetadata = {
      originalError: response,
    };

    // Extract additional metadata from error details
    if (response.error?.details) {
      const details = response.error.details as Record<string, unknown>;

      // Validation field errors
      if (details.fields) {
        metadata.fields = details.fields as Record<string, string[]>;
      }

      // Conflict details
      if (details.conflicts || details.conflictDetails) {
        metadata.conflictDetails = details.conflicts || details.conflictDetails;
      }

      // Business rule violations
      if (details.violations || details.ruleViolations) {
        metadata.ruleViolations = details.violations || details.ruleViolations;
      }

      // Request ID for debugging
      if (details.requestId) {
        metadata.requestId = details.requestId as string;
      }
    }

    // Map status code to error type
    switch (statusCode) {
      case HttpStatus.BAD_REQUEST:
        return new ValidationError(message, metadata);

      case HttpStatus.UNAUTHORIZED:
        return new UnauthorizedError(message, metadata);

      case HttpStatus.FORBIDDEN:
        return new ForbiddenError(message, metadata);

      case HttpStatus.NOT_FOUND:
        return new NotFoundError(message, metadata);

      case HttpStatus.CONFLICT:
        return new ConflictError(message, metadata);

      case HttpStatus.UNPROCESSABLE_ENTITY:
        return new BusinessRuleError(message, metadata);

      case HttpStatus.INTERNAL_SERVER_ERROR:
      case HttpStatus.SERVICE_UNAVAILABLE:
        return new InternalServerError(message, metadata);

      case HttpStatus.TOO_MANY_REQUESTS:
        return new BusinessRuleError('Too many requests. Please try again later.', metadata);

      default:
        // Unknown status code
        if (statusCode >= 400 && statusCode < 500) {
          return new ValidationError(message, metadata);
        }
        if (statusCode >= 500) {
          return new InternalServerError(message, metadata);
        }
        return new UnknownError(message, metadata);
    }
  }

  // Fallback for unknown error types
  return new UnknownError('An unexpected error occurred', {
    originalError: response,
  });
}

/**
 * Type guard to check if response is ApiErrorResponse
 */
function isApiErrorResponse(response: unknown): response is ApiErrorResponse {
  return (
    typeof response === 'object' &&
    response !== null &&
    'success' in response &&
    (response as ApiErrorResponse).success === false &&
    'error' in response
  );
}

/**
 * Extract field errors from ValidationError
 */
export function extractFieldErrors(error: ApiError): Record<string, string> {
  if (!(error instanceof ValidationError)) {
    return {};
  }

  const fieldErrors = error.getFieldErrors();
  const result: Record<string, string> = {};

  // Convert array of errors to single string per field
  Object.entries(fieldErrors).forEach(([field, errors]) => {
    result[field] = errors.join(', ');
  });

  return result;
}

/**
 * Check if error is retryable (network, timeout, 5xx)
 */
export function isRetryableError(error: ApiError): boolean {
  return (
    error instanceof NetworkError ||
    error instanceof InternalServerError ||
    error.statusCode >= 500
  );
}

/**
 * Check if error requires authentication
 */
export function requiresAuthentication(error: ApiError): boolean {
  return error instanceof UnauthorizedError;
}

/**
 * Check if error is permission-related
 */
export function isPermissionError(error: ApiError): boolean {
  return error instanceof ForbiddenError;
}
