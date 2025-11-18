import { Request, Response, NextFunction } from 'express';
import { company_role } from '@prisma/client';
import { HTTP_CODES } from '../constants/http_codes';

/**
 * Middleware to verify user has required company-level role
 * Must be used after authMiddleware
 *
 * Role hierarchy (from highest to lowest):
 * OWNER > ADMIN > MANAGER > EMPLOYEE
 *
 * @param allowedRoles - Array of company_role values that are allowed to access the route
 *
 * @example
 * // Only OWNER and ADMIN can delete locations
 * router.delete('/:id', authMiddleware, requireCompanyRole(['OWNER', 'ADMIN']), controller.delete);
 *
 * // Only OWNER can transfer ownership
 * router.post('/transfer', authMiddleware, requireCompanyRole(['OWNER']), controller.transfer);
 */
export const requireCompanyRole = (allowedRoles: company_role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
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

    // SUPER_ADMIN bypasses all company role checks
    if (req.user.user_type === 'SUPER_ADMIN') {
      return next();
    }

    // Check if user has one of the allowed company roles
    const userRole = req.user.company_role;
    if (!allowedRoles.includes(userRole)) {
      return res.status(HTTP_CODES.FORBIDDEN).json({
        success: false,
        error: {
          error_code: 'INSUFFICIENT_PERMISSIONS',
          message: `This action requires one of the following roles: ${allowedRoles.join(', ')}. Your role: ${userRole}`,
        },
      });
    }

    return next();
  };
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
