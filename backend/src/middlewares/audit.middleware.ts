/**
 * Audit Middleware - Automatic audit logging for HTTP requests
 * Reference: PLAN.md Section 2.2
 *
 * Captures CREATE, UPDATE, DELETE operations and logs them to audit_log table.
 * Extracts IP address and user agent from request for forensic purposes.
 */

import { Request, Response, NextFunction } from 'express';
import { audit_service } from '../services/audit.service';
import { audit_action } from '@prisma/client';

// Extend Express Request type to include audit data
declare global {
  namespace Express {
    interface Request {
      auditData?: {
        entity_type: string;
        entity_id?: number;
        old_values?: Record<string, any>;
      };
    }
  }
}

/**
 * Extract IP address from request
 * Handles both direct connections and proxied requests
 */
function getIpAddress(req: Request): string | undefined {
  // Check X-Forwarded-For header (for proxied requests)
  const forwardedFor = req.headers['x-forwarded-for'];
  if (forwardedFor) {
    // X-Forwarded-For can contain multiple IPs, take the first one
    const ips = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
    return ips.split(',')[0].trim();
  }

  // Check X-Real-IP header (alternative proxy header)
  const realIp = req.headers['x-real-ip'];
  if (realIp && typeof realIp === 'string') {
    return realIp;
  }

  // Fallback to direct connection IP
  return req.socket.remoteAddress;
}

/**
 * Extract user agent from request
 */
function getUserAgent(req: Request): string | undefined {
  return req.headers['user-agent'];
}

/**
 * Determine action type from HTTP method
 */
function getActionFromMethod(method: string): audit_action | null {
  switch (method) {
    case 'POST':
      return 'CREATE';
    case 'PUT':
    case 'PATCH':
      return 'UPDATE';
    case 'DELETE':
      return 'DELETE';
    default:
      return null; // GET requests are not audited
  }
}

/**
 * Middleware to automatically log audit trail for critical operations
 *
 * Usage:
 * router.post('/shifts', authMiddleware, auditMiddleware('shift'), createShiftHandler);
 * router.put('/shifts/:id', authMiddleware, auditMiddleware('shift'), updateShiftHandler);
 *
 * @param entity_type - Type of entity being modified (e.g., 'shift', 'employee')
 * @returns Express middleware function
 */
export const auditMiddleware = (entity_type: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Skip if user is not authenticated
    if (!req.user) {
      return next();
    }

    const action = getActionFromMethod(req.method);

    // Skip GET requests (read-only operations)
    if (!action) {
      return next();
    }

    // Initialize audit data on request for later use
    req.auditData = {
      entity_type,
    };

    // Capture response to log after operation completes
    const originalJson = res.json.bind(res);

    res.json = function (data: any) {
      // Only log if operation was successful
      if (data.success) {
        setImmediate(async () => {
          try {
            const user_id = req.user!.user_id;
            const company_id = req.user!.company_id;
            const ip_address = getIpAddress(req);
            const user_agent = getUserAgent(req);

            // Extract entity ID from response or params
            const entity_id =
              data.data?.id ||
              (req.params.id ? parseInt(req.params.id, 10) : undefined);

            // Log based on action type
            switch (action) {
              case 'CREATE':
                await audit_service.logCreate(
                  user_id,
                  company_id,
                  entity_type,
                  entity_id!,
                  data.data,
                  ip_address,
                  user_agent
                );
                break;

              case 'UPDATE':
                await audit_service.logUpdate(
                  user_id,
                  company_id,
                  entity_type,
                  entity_id!,
                  req.auditData?.old_values || {},
                  data.data,
                  ip_address,
                  user_agent
                );
                break;

              case 'DELETE':
                await audit_service.logDelete(
                  user_id,
                  company_id,
                  entity_type,
                  entity_id!,
                  req.auditData?.old_values || {},
                  ip_address,
                  user_agent
                );
                break;
            }
          } catch (error) {
            // Log error but don't affect response
            console.error('[Audit Middleware] Failed to log audit:', error);
          }
        });
      }

      return originalJson(data);
    };

    next();
  };
};

/**
 * Middleware to capture old values before UPDATE/DELETE operations
 *
 * Must be used BEFORE the main handler to capture pre-modification state.
 * Works in conjunction with auditMiddleware.
 *
 * Usage:
 * router.put('/shifts/:id',
 *   authMiddleware,
 *   captureOldValues(getShiftById),
 *   auditMiddleware('shift'),
 *   updateShiftHandler
 * );
 *
 * @param fetchFunction - Async function to fetch entity by ID
 * @returns Express middleware function
 */
export const captureOldValues = (
  fetchFunction: (id: number, company_id: number) => Promise<any>
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Skip if not authenticated or no ID param
      if (!req.user || !req.params.id) {
        return next();
      }

      const id = parseInt(req.params.id, 10);
      const company_id = req.user.company_id;

      // Fetch current state
      const oldEntity = await fetchFunction(id, company_id);

      // Store in request for audit middleware
      if (!req.auditData) {
        req.auditData = { entity_type: '' };
      }
      req.auditData.old_values = oldEntity;
      req.auditData.entity_id = id;
    } catch (error) {
      // Continue even if fetch fails (entity might not exist)
      console.error('[Audit Middleware] Failed to capture old values:', error);
    }

    next();
  };
};

/**
 * Specialized middleware for authentication events (LOGIN/LOGOUT)
 *
 * Usage in auth routes:
 * router.post('/login', validate_body(login_schema), login_handler, auditAuthMiddleware('LOGIN'));
 * router.post('/logout', authMiddleware, logout_handler, auditAuthMiddleware('LOGOUT'));
 */
export const auditAuthMiddleware = (action: 'LOGIN' | 'LOGOUT') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Capture response
    const originalJson = res.json.bind(res);

    res.json = function (data: any) {
      if (data.success) {
        setImmediate(async () => {
          try {
            const user_id =
              action === 'LOGIN'
                ? data.data?.user?.id // For LOGIN, extract from response
                : req.user?.user_id; // For LOGOUT, from auth token

            const company_id =
              action === 'LOGIN'
                ? data.data?.company_id
                : req.user?.company_id;

            if (user_id && company_id) {
              const ip_address = getIpAddress(req);
              const user_agent = getUserAgent(req);

              if (action === 'LOGIN') {
                await audit_service.logLogin(
                  user_id,
                  company_id,
                  ip_address,
                  user_agent
                );
              } else {
                await audit_service.logLogout(
                  user_id,
                  company_id,
                  ip_address,
                  user_agent
                );
              }
            }
          } catch (error) {
            console.error('[Audit Auth Middleware] Failed to log auth event:', error);
          }
        });
      }

      return originalJson(data);
    };

    next();
  };
};
