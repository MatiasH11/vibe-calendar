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
      // Convertir string query params a tipos correctos
      const queryParams: any = { ...req.query };
      
      // Convertir strings a números donde sea necesario
      if (queryParams.page && typeof queryParams.page === 'string') {
        queryParams.page = parseInt(queryParams.page);
      }
      if (queryParams.limit && typeof queryParams.limit === 'string') {
        queryParams.limit = parseInt(queryParams.limit);
      }
      if (queryParams.role_id && typeof queryParams.role_id === 'string') {
        queryParams.role_id = parseInt(queryParams.role_id);
      }
      if (queryParams.user_id && typeof queryParams.user_id === 'string') {
        queryParams.user_id = parseInt(queryParams.user_id);
      }
      if (queryParams.is_active && typeof queryParams.is_active === 'string') {
        queryParams.is_active = queryParams.is_active === 'true';
      }
      
      req.query = schema.parse(queryParams);
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


