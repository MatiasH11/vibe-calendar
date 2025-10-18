import { Request, Response, NextFunction } from 'express';
import { HTTP_CODES } from '../constants/http_codes';
import { env } from '../config/environment';
import { AppError } from '../errors';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { logger } from '../utils/logger';

export const error_handler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  // Log error with context
  logger.error('Request error', {
    errorName: err.name,
    errorMessage: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    userId: req.user?.user_id,
    companyId: req.user?.company_id,
    requestId: (req as any).id,
    body: env.NODE_ENV === 'development' ? req.body : undefined,
  });

  // Handle custom application errors
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.toJSON(),
    });
  }

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    return res.status(HTTP_CODES.BAD_REQUEST).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        metadata: {
          issues: err.errors,
        },
      },
    });
  }

  // Handle Prisma errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // Unique constraint violation
    if (err.code === 'P2002') {
      return res.status(HTTP_CODES.CONFLICT).json({
        success: false,
        error: {
          code: 'UNIQUE_CONSTRAINT_VIOLATION',
          message: 'A record with this value already exists',
          metadata: {
            target: err.meta?.target,
          },
        },
      });
    }

    // Foreign key constraint violation
    if (err.code === 'P2003') {
      return res.status(HTTP_CODES.BAD_REQUEST).json({
        success: false,
        error: {
          code: 'FOREIGN_KEY_CONSTRAINT',
          message: 'Referenced record does not exist',
          metadata: {
            field: err.meta?.field_name,
          },
        },
      });
    }

    // Record not found
    if (err.code === 'P2025') {
      return res.status(HTTP_CODES.NOT_FOUND).json({
        success: false,
        error: {
          code: 'RECORD_NOT_FOUND',
          message: 'The requested record was not found',
        },
      });
    }
  }

  // Handle Prisma validation errors
  if (err instanceof Prisma.PrismaClientValidationError) {
    return res.status(HTTP_CODES.BAD_REQUEST).json({
      success: false,
      error: {
        code: 'DATABASE_VALIDATION_ERROR',
        message: 'Invalid data provided for database operation',
      },
    });
  }

  // Default to 500 Internal Server Error
  const statusCode = HTTP_CODES.INTERNAL_SERVER_ERROR;
  const message = 'An unexpected error occurred';

  const errorResponse = {
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message,
      ...(env.NODE_ENV === 'development' && {
        metadata: {
          originalError: err.message,
          stack: err.stack,
        },
      }),
    },
  };

  res.status(statusCode).json(errorResponse);
};


