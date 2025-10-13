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
  } catch (error) {
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
  } catch (error) {
    next(error);
  }
};


