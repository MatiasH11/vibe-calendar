import { ErrorCode, ErrorMetadata, HttpStatus } from './types';

/**
 * Base API Error class
 * All API errors extend from this class
 */
export abstract class ApiError extends Error {
  abstract code: ErrorCode;
  abstract statusCode: number;
  metadata: ErrorMetadata;

  constructor(message: string, metadata: ErrorMetadata = {}) {
    super(message);
    this.name = this.constructor.name;
    this.metadata = {
      ...metadata,
      timestamp: new Date().toISOString(),
    };

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Get user-friendly error message
   */
  getUserMessage(): string {
    return this.message;
  }

  /**
   * Check if error has field validation errors
   */
  hasFieldErrors(): boolean {
    return !!this.metadata.fields && Object.keys(this.metadata.fields).length > 0;
  }

  /**
   * Get field validation errors
   */
  getFieldErrors(): Record<string, string[]> {
    return this.metadata.fields || {};
  }

  /**
   * Convert to JSON for logging
   */
  toJSON() {
    return {
      name: this.name,
      code: this.code,
      statusCode: this.statusCode,
      message: this.message,
      metadata: this.metadata,
      stack: this.stack,
    };
  }
}

/**
 * Validation Error (400)
 * Thrown when request data fails validation
 */
export class ValidationError extends ApiError {
  code = ErrorCode.VALIDATION_ERROR;
  statusCode = HttpStatus.BAD_REQUEST;

  constructor(message: string, metadata: ErrorMetadata = {}) {
    super(message || 'Validation failed', metadata);
  }

  getUserMessage(): string {
    if (this.hasFieldErrors()) {
      const fieldCount = Object.keys(this.getFieldErrors()).length;
      return `Invalid input in ${fieldCount} field${fieldCount > 1 ? 's' : ''}`;
    }
    return this.message;
  }
}

/**
 * Unauthorized Error (401)
 * Thrown when authentication is required or failed
 */
export class UnauthorizedError extends ApiError {
  code = ErrorCode.UNAUTHORIZED;
  statusCode = HttpStatus.UNAUTHORIZED;

  constructor(message: string = 'Authentication required', metadata: ErrorMetadata = {}) {
    super(message, metadata);
  }

  getUserMessage(): string {
    return 'Please log in to continue';
  }
}

/**
 * Forbidden Error (403)
 * Thrown when user lacks permission for the operation
 */
export class ForbiddenError extends ApiError {
  code = ErrorCode.FORBIDDEN;
  statusCode = HttpStatus.FORBIDDEN;

  constructor(message: string = 'Access denied', metadata: ErrorMetadata = {}) {
    super(message, metadata);
  }

  getUserMessage(): string {
    return "You don't have permission to perform this action";
  }
}

/**
 * Not Found Error (404)
 * Thrown when requested resource doesn't exist
 */
export class NotFoundError extends ApiError {
  code = ErrorCode.NOT_FOUND;
  statusCode = HttpStatus.NOT_FOUND;

  constructor(message: string = 'Resource not found', metadata: ErrorMetadata = {}) {
    super(message, metadata);
  }

  getUserMessage(): string {
    return 'The requested resource was not found';
  }
}

/**
 * Conflict Error (409)
 * Thrown when operation conflicts with current state
 */
export class ConflictError extends ApiError {
  code = ErrorCode.CONFLICT;
  statusCode = HttpStatus.CONFLICT;

  constructor(message: string = 'Conflict detected', metadata: ErrorMetadata = {}) {
    super(message, metadata);
  }

  getUserMessage(): string {
    return this.message || 'This operation conflicts with existing data';
  }
}

/**
 * Business Rule Error (422)
 * Thrown when operation violates business rules
 */
export class BusinessRuleError extends ApiError {
  code = ErrorCode.BUSINESS_RULE_VIOLATION;
  statusCode = HttpStatus.UNPROCESSABLE_ENTITY;

  constructor(message: string = 'Business rule violation', metadata: ErrorMetadata = {}) {
    super(message, metadata);
  }

  getUserMessage(): string {
    return this.message || 'This operation violates business rules';
  }
}

/**
 * Internal Server Error (500)
 * Thrown when server encounters an unexpected error
 */
export class InternalServerError extends ApiError {
  code = ErrorCode.INTERNAL_SERVER_ERROR;
  statusCode = HttpStatus.INTERNAL_SERVER_ERROR;

  constructor(message: string = 'Internal server error', metadata: ErrorMetadata = {}) {
    super(message, metadata);
  }

  getUserMessage(): string {
    return 'An unexpected error occurred. Please try again later.';
  }
}

/**
 * Network Error
 * Thrown when network request fails (connection, timeout, etc.)
 */
export class NetworkError extends ApiError {
  code = ErrorCode.NETWORK_ERROR;
  statusCode = 0;

  constructor(message: string = 'Network error', metadata: ErrorMetadata = {}) {
    super(message, metadata);
  }

  getUserMessage(): string {
    if (this.message.includes('timeout')) {
      return 'Request timed out. Please check your connection and try again.';
    }
    return 'Network error. Please check your connection and try again.';
  }
}

/**
 * Unknown Error
 * Fallback for unrecognized errors
 */
export class UnknownError extends ApiError {
  code = ErrorCode.UNKNOWN;
  statusCode = 0;

  constructor(message: string = 'An unknown error occurred', metadata: ErrorMetadata = {}) {
    super(message, metadata);
  }

  getUserMessage(): string {
    return 'An unexpected error occurred. Please try again.';
  }
}
