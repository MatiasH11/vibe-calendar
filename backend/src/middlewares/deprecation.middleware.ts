
import { Request, Response, NextFunction } from 'express';

// Using console.warn for now. It can be replaced with a proper logger (like Winston) later.
// As planned in section 17 of PLAN.md

/**
 * Middleware to issue a deprecation warning for legacy API endpoints.
 * @param newEndpoint A string describing the new endpoint that should be used instead.
 * @returns Express middleware function.
 */
export const deprecationWarning = (newEndpoint: string) => 
  (req: Request, res: Response, next: NextFunction) => {
    const message = `Legacy route ${req.method} ${req.originalUrl} is deprecated and will be removed in a future version. Please use ${newEndpoint} instead.`;
    
    res.setHeader('X-Deprecated', 'true');
    res.setHeader('X-Deprecation-Info', message);
    
    console.warn(message, {
      userId: (req as any).user?.id,
      companyId: (req as any).user?.company_id,
      route: req.originalUrl,
    });

    next();
};
