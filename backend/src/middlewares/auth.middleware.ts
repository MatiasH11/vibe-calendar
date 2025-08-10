import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/environment';
import { HTTP_CODES } from '../constants/http_codes';
import { jwt_payload } from '../types/jwt.types';

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization || '';
  const [scheme, token] = authHeader.split(' ');

  if (!token || scheme !== 'Bearer') {
    return res
      .status(HTTP_CODES.UNAUTHORIZED)
      .json({ success: false, error: { error_code: 'UNAUTHORIZED', message: 'Missing or invalid Authorization header' } });
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as jwt_payload;
    req.user = decoded;
    return next();
  } catch {
    return res
      .status(HTTP_CODES.FORBIDDEN)
      .json({ success: false, error: { error_code: 'FORBIDDEN', message: 'Invalid token' } });
  }
};


