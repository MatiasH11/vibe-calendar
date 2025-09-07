import { Request, Response, NextFunction } from 'express';
import { HTTP_CODES } from '../constants/http_codes';
import { USER_TYPES } from '../constants/auth';

export const adminMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(HTTP_CODES.UNAUTHORIZED).json({ 
      success: false, 
      error: { error_code: 'UNAUTHORIZED', message: 'Missing user context' } 
    });
  }

  // Verificar permisos de administrador usando user_type
  if (req.user.user_type !== USER_TYPES.ADMIN) {
    return res.status(HTTP_CODES.FORBIDDEN).json({ 
      success: false, 
      error: { error_code: 'FORBIDDEN', message: 'Access denied. Admin privileges required.' } 
    });
  }

  return next();
};


