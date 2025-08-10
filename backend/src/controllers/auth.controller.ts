import { Request, Response, NextFunction } from 'express';
import { register_body, login_body } from '../validations/auth.validation';
import { auth_service } from '../services/auth.service';
import { HTTP_CODES } from '../constants/http_codes';

export const register_handler = async (
  req: Request<{}, {}, register_body>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await auth_service.register(req.body);
    return res.status(HTTP_CODES.CREATED).json(result);
  } catch (error: any) {
    if (error?.message === 'EMAIL_ALREADY_EXISTS') {
      return res.status(HTTP_CODES.CONFLICT).json({ success: false, error: { error_code: 'EMAIL_ALREADY_EXISTS', message: 'Email already exists' } });
    }
    if (error?.message === 'COMPANY_NAME_ALREADY_EXISTS') {
      return res.status(HTTP_CODES.CONFLICT).json({ success: false, error: { error_code: 'COMPANY_NAME_ALREADY_EXISTS', message: 'Company name already exists' } });
    }
    if (error?.message === 'TRANSACTION_FAILED') {
      return res.status(HTTP_CODES.INTERNAL_SERVER_ERROR).json({ success: false, error: { error_code: 'TRANSACTION_FAILED', message: 'Transaction failed' } });
    }
    next(error);
  }
};

export const login_handler = async (
  req: Request<{}, {}, login_body>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await auth_service.login(req.body);
    return res.status(HTTP_CODES.OK).json(result);
  } catch (error: any) {
    if (error?.message === 'INVALID_CREDENTIALS') {
      return res.status(HTTP_CODES.UNAUTHORIZED).json({ success: false, error: { error_code: 'INVALID_CREDENTIALS', message: 'Invalid credentials' } });
    }
    if (error?.message === 'USER_NOT_ASSOCIATED_WITH_COMPANY') {
      return res.status(HTTP_CODES.UNAUTHORIZED).json({ success: false, error: { error_code: 'USER_NOT_ASSOCIATED_WITH_COMPANY', message: 'User not associated with company' } });
    }
    next(error);
  }
};


