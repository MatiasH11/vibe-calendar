import { Request, Response, NextFunction } from 'express';
import { HTTP_CODES } from '../constants/http_codes';
import { env } from '../config/environment';

export const error_handler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  // eslint-disable-next-line no-console
  console.error(err);

  const statusCode = HTTP_CODES.INTERNAL_SERVER_ERROR;
  const message = 'An unexpected error occurred.';

  const errorResponse = env.NODE_ENV === 'development'
    ? { message, error: err.message, stack: (err as Error).stack }
    : { message };

  res.status(statusCode).json(errorResponse);
};


