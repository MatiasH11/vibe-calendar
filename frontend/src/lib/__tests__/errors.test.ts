/**
 * Error Handling Tests
 * Tests for error transformation and typed error classes
 */

import {
  ApiError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  ServerError,
  NetworkError,
  TimeoutError,
  ErrorCode,
  HttpStatus,
} from '../errors/ApiError';
import { createApiError, isApiError, getErrorMessage } from '../errors/factory';

describe('Error Classes', () => {
  describe('ValidationError', () => {
    it('should create validation error with correct properties', () => {
      const error = new ValidationError('Validation failed', {
        validationErrors: [
          { field: 'email', message: 'Invalid email format' },
        ],
      });

      expect(error).toBeInstanceOf(ApiError);
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
      expect(error.statusCode).toBe(HttpStatus.BAD_REQUEST);
      expect(error.message).toBe('Validation failed');
      expect(error.metadata.validationErrors).toHaveLength(1);
    });

    it('should have correct name property', () => {
      const error = new ValidationError('Test');
      expect(error.name).toBe('ValidationError');
    });
  });

  describe('UnauthorizedError', () => {
    it('should create unauthorized error with correct properties', () => {
      const error = new UnauthorizedError('Token expired');

      expect(error).toBeInstanceOf(ApiError);
      expect(error.code).toBe(ErrorCode.UNAUTHORIZED);
      expect(error.statusCode).toBe(HttpStatus.UNAUTHORIZED);
      expect(error.message).toBe('Token expired');
    });
  });

  describe('ForbiddenError', () => {
    it('should create forbidden error with correct properties', () => {
      const error = new ForbiddenError('Access denied', {
        requiredPermission: 'admin',
      });

      expect(error).toBeInstanceOf(ApiError);
      expect(error.code).toBe(ErrorCode.FORBIDDEN);
      expect(error.statusCode).toBe(HttpStatus.FORBIDDEN);
      expect(error.metadata.requiredPermission).toBe('admin');
    });
  });

  describe('NotFoundError', () => {
    it('should create not found error with correct properties', () => {
      const error = new NotFoundError('Resource not found', {
        resourceType: 'Employee',
        resourceId: 123,
      });

      expect(error).toBeInstanceOf(ApiError);
      expect(error.code).toBe(ErrorCode.NOT_FOUND);
      expect(error.statusCode).toBe(HttpStatus.NOT_FOUND);
      expect(error.metadata.resourceType).toBe('Employee');
      expect(error.metadata.resourceId).toBe(123);
    });
  });

  describe('ConflictError', () => {
    it('should create conflict error with correct properties', () => {
      const error = new ConflictError('Shift conflict detected', {
        conflictType: 'overlap',
        conflictingShifts: [1, 2],
      });

      expect(error).toBeInstanceOf(ApiError);
      expect(error.code).toBe(ErrorCode.CONFLICT);
      expect(error.statusCode).toBe(HttpStatus.CONFLICT);
      expect(error.metadata.conflictType).toBe('overlap');
      expect(error.metadata.conflictingShifts).toEqual([1, 2]);
    });
  });

  describe('ServerError', () => {
    it('should create server error with correct properties', () => {
      const error = new ServerError('Database connection failed', {
        internalCode: 'DB_CONN_ERROR',
      });

      expect(error).toBeInstanceOf(ApiError);
      expect(error.code).toBe(ErrorCode.SERVER_ERROR);
      expect(error.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(error.metadata.internalCode).toBe('DB_CONN_ERROR');
    });
  });

  describe('NetworkError', () => {
    it('should create network error with correct properties', () => {
      const error = new NetworkError('Request failed');

      expect(error).toBeInstanceOf(ApiError);
      expect(error.code).toBe(ErrorCode.NETWORK_ERROR);
      expect(error.statusCode).toBe(HttpStatus.SERVICE_UNAVAILABLE);
    });
  });

  describe('TimeoutError', () => {
    it('should create timeout error with correct properties', () => {
      const error = new TimeoutError('Request timed out', {
        timeout: 5000,
      });

      expect(error).toBeInstanceOf(ApiError);
      expect(error.code).toBe(ErrorCode.TIMEOUT);
      expect(error.statusCode).toBe(HttpStatus.REQUEST_TIMEOUT);
      expect(error.metadata.timeout).toBe(5000);
    });
  });
});

describe('Error Factory', () => {
  describe('createApiError', () => {
    it('should create ValidationError from 400 response', () => {
      const response = {
        message: 'Validation failed',
        statusCode: 400,
        metadata: {
          validationErrors: [
            { field: 'name', message: 'Name is required' },
          ],
        },
      };

      const error = createApiError(response);

      expect(error).toBeInstanceOf(ValidationError);
      expect(error.message).toBe('Validation failed');
      expect(error.metadata.validationErrors).toHaveLength(1);
    });

    it('should create UnauthorizedError from 401 response', () => {
      const response = {
        message: 'Invalid token',
        statusCode: 401,
      };

      const error = createApiError(response);

      expect(error).toBeInstanceOf(UnauthorizedError);
      expect(error.message).toBe('Invalid token');
    });

    it('should create ForbiddenError from 403 response', () => {
      const response = {
        message: 'Access denied',
        statusCode: 403,
        metadata: { requiredPermission: 'admin' },
      };

      const error = createApiError(response);

      expect(error).toBeInstanceOf(ForbiddenError);
      expect(error.message).toBe('Access denied');
      expect(error.metadata.requiredPermission).toBe('admin');
    });

    it('should create NotFoundError from 404 response', () => {
      const response = {
        message: 'Employee not found',
        statusCode: 404,
        metadata: { resourceType: 'Employee', resourceId: 123 },
      };

      const error = createApiError(response);

      expect(error).toBeInstanceOf(NotFoundError);
      expect(error.message).toBe('Employee not found');
    });

    it('should create ConflictError from 409 response', () => {
      const response = {
        message: 'Shift conflict',
        statusCode: 409,
        metadata: { conflictType: 'overlap' },
      };

      const error = createApiError(response);

      expect(error).toBeInstanceOf(ConflictError);
      expect(error.message).toBe('Shift conflict');
    });

    it('should create TimeoutError from 408 response', () => {
      const response = {
        message: 'Request timeout',
        statusCode: 408,
      };

      const error = createApiError(response);

      expect(error).toBeInstanceOf(TimeoutError);
      expect(error.message).toBe('Request timeout');
    });

    it('should create ServerError from 500 response', () => {
      const response = {
        message: 'Internal server error',
        statusCode: 500,
      };

      const error = createApiError(response);

      expect(error).toBeInstanceOf(ServerError);
      expect(error.message).toBe('Internal server error');
    });

    it('should create ServerError from 503 response', () => {
      const response = {
        message: 'Service unavailable',
        statusCode: 503,
      };

      const error = createApiError(response);

      expect(error).toBeInstanceOf(ServerError);
      expect(error.message).toBe('Service unavailable');
    });

    it('should handle Error objects', () => {
      const nativeError = new Error('Network failure');
      const error = createApiError(nativeError);

      expect(error).toBeInstanceOf(NetworkError);
      expect(error.message).toBe('Network failure');
    });

    it('should handle unknown error types', () => {
      const unknownError = 'Something went wrong';
      const error = createApiError(unknownError);

      expect(error).toBeInstanceOf(ServerError);
      expect(error.message).toBe('An unexpected error occurred');
    });

    it('should extract metadata from backend error response', () => {
      const response = {
        message: 'Conflict detected',
        statusCode: 409,
        metadata: {
          conflictingShifts: [1, 2, 3],
          conflictType: 'overlap',
          details: {
            startTime: '09:00',
            endTime: '17:00',
          },
        },
      };

      const error = createApiError(response);

      expect(error.metadata.conflictingShifts).toEqual([1, 2, 3]);
      expect(error.metadata.conflictType).toBe('overlap');
      expect(error.metadata.details).toEqual({
        startTime: '09:00',
        endTime: '17:00',
      });
    });

    it('should handle missing statusCode', () => {
      const response = {
        message: 'Error without status code',
      };

      const error = createApiError(response);

      expect(error).toBeInstanceOf(ServerError);
    });

    it('should handle DOMException for AbortError', () => {
      const abortError = new DOMException('Aborted', 'AbortError');
      const error = createApiError(abortError);

      expect(error).toBeInstanceOf(NetworkError);
      expect(error.message).toBe('Aborted');
    });
  });

  describe('isApiError', () => {
    it('should return true for ApiError instances', () => {
      const error = new ValidationError('Test');
      expect(isApiError(error)).toBe(true);
    });

    it('should return true for all error subclasses', () => {
      expect(isApiError(new ValidationError('Test'))).toBe(true);
      expect(isApiError(new UnauthorizedError('Test'))).toBe(true);
      expect(isApiError(new ForbiddenError('Test'))).toBe(true);
      expect(isApiError(new NotFoundError('Test'))).toBe(true);
      expect(isApiError(new ConflictError('Test'))).toBe(true);
      expect(isApiError(new ServerError('Test'))).toBe(true);
      expect(isApiError(new NetworkError('Test'))).toBe(true);
      expect(isApiError(new TimeoutError('Test'))).toBe(true);
    });

    it('should return false for native Error', () => {
      const error = new Error('Test');
      expect(isApiError(error)).toBe(false);
    });

    it('should return false for non-error objects', () => {
      expect(isApiError({ message: 'test' })).toBe(false);
      expect(isApiError('string')).toBe(false);
      expect(isApiError(null)).toBe(false);
      expect(isApiError(undefined)).toBe(false);
    });
  });

  describe('getErrorMessage', () => {
    it('should return message from ApiError', () => {
      const error = new ValidationError('Validation failed');
      expect(getErrorMessage(error)).toBe('Validation failed');
    });

    it('should return message from native Error', () => {
      const error = new Error('Something went wrong');
      expect(getErrorMessage(error)).toBe('Something went wrong');
    });

    it('should return user-friendly message for validation errors', () => {
      const error = new ValidationError('Validation failed', {
        validationErrors: [
          { field: 'email', message: 'Invalid email' },
          { field: 'password', message: 'Too short' },
        ],
      });

      const message = getErrorMessage(error, true);
      expect(message).toContain('Invalid email');
      expect(message).toContain('Too short');
    });

    it('should return default message for unknown errors', () => {
      expect(getErrorMessage('random string')).toBe('An unexpected error occurred');
      expect(getErrorMessage(null)).toBe('An unexpected error occurred');
      expect(getErrorMessage(undefined)).toBe('An unexpected error occurred');
    });

    it('should return message from object with message property', () => {
      const errorObj = { message: 'Custom error message' };
      expect(getErrorMessage(errorObj)).toBe('Custom error message');
    });

    it('should handle validation errors with user-friendly flag', () => {
      const error = new ValidationError('Validation failed', {
        validationErrors: [
          { field: 'name', message: 'Name is required' },
        ],
      });

      const userMessage = getErrorMessage(error, true);
      expect(userMessage).toContain('Name is required');
    });

    it('should return generic message for server errors in user-friendly mode', () => {
      const error = new ServerError('Database connection failed');
      const userMessage = getErrorMessage(error, true);

      expect(userMessage).toBe('A server error occurred. Please try again later.');
    });

    it('should return specific message for unauthorized errors', () => {
      const error = new UnauthorizedError('Token expired');
      const userMessage = getErrorMessage(error, true);

      expect(userMessage).toBe('Your session has expired. Please log in again.');
    });

    it('should return specific message for network errors', () => {
      const error = new NetworkError('Network request failed');
      const userMessage = getErrorMessage(error, true);

      expect(userMessage).toBe('Network connection failed. Please check your internet connection.');
    });
  });
});

describe('Error Metadata', () => {
  it('should preserve all metadata fields', () => {
    const metadata = {
      field1: 'value1',
      field2: 123,
      field3: { nested: 'object' },
      field4: ['array', 'values'],
    };

    const error = new ValidationError('Test', metadata);

    expect(error.metadata).toEqual(metadata);
  });

  it('should handle empty metadata', () => {
    const error = new ValidationError('Test');

    expect(error.metadata).toEqual({});
  });

  it('should handle validation errors metadata', () => {
    const metadata = {
      validationErrors: [
        { field: 'email', message: 'Invalid' },
        { field: 'password', message: 'Too short' },
      ],
    };

    const error = new ValidationError('Validation failed', metadata);

    expect(error.metadata.validationErrors).toHaveLength(2);
    expect(error.metadata.validationErrors[0].field).toBe('email');
    expect(error.metadata.validationErrors[1].field).toBe('password');
  });

  it('should handle conflict metadata', () => {
    const metadata = {
      conflictType: 'overlap',
      conflictingShifts: [1, 2, 3],
      conflictDetails: {
        employee: 'John Doe',
        date: '2024-01-15',
      },
    };

    const error = new ConflictError('Conflict detected', metadata);

    expect(error.metadata.conflictType).toBe('overlap');
    expect(error.metadata.conflictingShifts).toEqual([1, 2, 3]);
    expect(error.metadata.conflictDetails).toEqual({
      employee: 'John Doe',
      date: '2024-01-15',
    });
  });
});
