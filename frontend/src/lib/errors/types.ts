/**
 * Error type definitions for API errors
 */

// Base error response structure from backend
export interface ApiErrorResponse {
  success: false;
  error: {
    message: string;
    code?: string;
    statusCode?: number;
    details?: unknown;
  };
  statusCode?: number;
}

// Error metadata for additional context
export interface ErrorMetadata {
  fields?: Record<string, string[]>; // Validation field errors
  conflictDetails?: unknown; // Conflict information
  ruleViolations?: unknown; // Business rule violations
  originalError?: unknown; // Original error object
  timestamp?: string;
  requestId?: string;
  [key: string]: unknown;
}

// Error codes from backend
export enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  BUSINESS_RULE_VIOLATION = 'BUSINESS_RULE_VIOLATION',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT = 'TIMEOUT',
  UNKNOWN = 'UNKNOWN',
}

// HTTP status codes
export enum HttpStatus {
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  UNPROCESSABLE_ENTITY = 422,
  TOO_MANY_REQUESTS = 429,
  INTERNAL_SERVER_ERROR = 500,
  SERVICE_UNAVAILABLE = 503,
}
