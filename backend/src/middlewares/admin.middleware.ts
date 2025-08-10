import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma_client';
import { HTTP_CODES } from '../constants/http_codes';
import { ADMIN_ROLE_NAME } from '../constants/auth';

export const adminMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(HTTP_CODES.UNAUTHORIZED).json({ success: false, error: { error_code: 'UNAUTHORIZED', message: 'Missing user context' } });
  }

  const role = await prisma.role.findUnique({ where: { id: req.user.role_id } });
  if (!role || role.name !== ADMIN_ROLE_NAME) {
    return res.status(HTTP_CODES.FORBIDDEN).json({ success: false, error: { error_code: 'FORBIDDEN', message: 'Access denied. Admin privileges required.' } });
  }

  return next();
};


