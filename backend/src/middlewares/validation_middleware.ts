import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { HTTP_CODES } from '../constants/http_codes';

// Middleware existente mantenido
export const validate_body = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(HTTP_CODES.BAD_REQUEST).json({
          success: false,
          error: {
            error_code: 'VALIDATION_ERROR',
            message: 'Invalid request body',
            details: error.errors,
          },
        });
      }
      next(error);
    }
  };
};

// NUEVO: Middleware para validar query parameters
export const validate_query = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.query = schema.parse(req.query);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(HTTP_CODES.BAD_REQUEST).json({
          success: false,
          error: {
            error_code: 'VALIDATION_ERROR',
            message: 'Invalid query parameters',
            details: error.errors,
          },
        });
      }
      next(error);
    }
  };
};

// NUEVO: Middleware para validar path parameters
export const validate_params = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.params = schema.parse(req.params);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(HTTP_CODES.BAD_REQUEST).json({
          success: false,
          error: {
            error_code: 'VALIDATION_ERROR',
            message: 'Invalid path parameters',
            details: error.errors,
          },
        });
      }
      next(error);
    }
  };
};


