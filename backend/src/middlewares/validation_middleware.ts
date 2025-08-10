import { Request, Response, NextFunction } from 'express';
import { ZodError, ZodSchema } from 'zod';
import { HTTP_CODES } from '../constants/http_codes';

const formatZodError = (error: ZodError) => {
  return error.issues.map(issue => ({
    message: issue.message,
    path: issue.path.join('.'),
  }));
};

const validate = (schema: ZodSchema, data: unknown) => {
  try {
    schema.parse(data);
    return null;
  } catch (error) {
    if (error instanceof ZodError) {
      return { status: HTTP_CODES.BAD_REQUEST, errors: formatZodError(error) };
    }
    throw error;
  }
};

export const validate_body = (schema: ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
  const error = validate(schema, req.body);
  if (error) {
    return res.status(error.status).json({ errors: error.errors });
  }
  next();
};

export const validate_query = (schema: ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
  const error = validate(schema, req.query);
  if (error) {
    return res.status(error.status).json({ errors: error.errors });
  }
  next();
};


