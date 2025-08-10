import { jwt_payload } from './jwt.types';

declare global {
  namespace Express {
    // Extend Express Request to include user decoded from JWT
    interface Request {
      user?: jwt_payload;
    }
  }
}

export {};


