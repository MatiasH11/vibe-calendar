import { Request, Response, NextFunction } from 'express';
import { user_type } from '@prisma/client';
import { HTTP_CODES } from '../constants/http_codes';

/**
 * Middleware to verify user has ADMIN permissions
 * Must be used after authMiddleware
 *
 * Permission levels:
 * - SUPER_ADMIN: Can access all companies
 * - ADMIN: Can manage their own company
 * - USER: Regular employees (cannot access admin routes)
 *
 * @example
 * // Only ADMIN and SUPER_ADMIN can delete locations
 * router.delete('/:id', authMiddleware, requireAdmin, controller.delete);
 */
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  // Ensure user is authenticated
  if (!req.user) {
    return res.status(HTTP_CODES.UNAUTHORIZED).json({
      success: false,
      error: {
        error_code: 'UNAUTHORIZED',
        message: 'Authentication required',
      },
    });
  }

  // Allow SUPER_ADMIN and ADMIN
  if (req.user.user_type === 'SUPER_ADMIN' || req.user.user_type === 'ADMIN') {
    return next();
  }

  return res.status(HTTP_CODES.FORBIDDEN).json({
    success: false,
    error: {
      error_code: 'INSUFFICIENT_PERMISSIONS',
      message: `This action requires administrator privileges. Your permission level: ${req.user.user_type}`,
    },
  });
};

/**
 * Middleware to verify user is SUPER_ADMIN (platform-level)
 * Used for routes that should only be accessible to system administrators
 *
 * @example
 * // Only SUPER_ADMIN can view all companies
 * router.get('/companies', authMiddleware, requireSuperAdmin, controller.getAllCompanies);
 */
export const requireSuperAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(HTTP_CODES.UNAUTHORIZED).json({
      success: false,
      error: {
        error_code: 'UNAUTHORIZED',
        message: 'Authentication required',
      },
    });
  }

  if (req.user.user_type !== 'SUPER_ADMIN') {
    return res.status(HTTP_CODES.FORBIDDEN).json({
      success: false,
      error: {
        error_code: 'SUPER_ADMIN_REQUIRED',
        message: 'This action requires super administrator privileges',
      },
    });
  }

  return next();
};
