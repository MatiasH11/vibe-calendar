/**
 * Audit Controller - HTTP handlers for audit log endpoints
 * Reference: PLAN.md Section 2.3
 *
 * Provides API endpoints for querying and analyzing audit logs
 */

import { Request, Response, NextFunction } from 'express';
import { audit_service } from '../services/audit.service';
import { HTTP_CODES } from '../constants/http_codes';
import {
  AuditQueryParams,
  EntityHistoryParams,
  AuditStatisticsQuery,
} from '../validations/audit.validation';

/**
 * GET /api/v1/audit
 * Query audit logs with filters and pagination
 */
export const getAuditLogsHandler = async (
  req: Request<{}, {}, {}, AuditQueryParams>,
  res: Response,
  next: NextFunction
) => {
  try {
    const company_id = req.user!.admin_company_id;

    // Build filter object
    const filters = {
      company_id, // Always filter by current user's company
      user_id: req.query.user_id,
      action: req.query.action,
      entity_type: req.query.entity_type,
      entity_id: req.query.entity_id,
      start_date: req.query.start_date,
      end_date: req.query.end_date,
      page: req.query.page,
      limit: req.query.limit,
    };

    const result = await audit_service.query(filters);

    return res.status(HTTP_CODES.OK).json({
      success: true,
      data: result.logs,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/audit/entity/:type/:id
 * Get complete audit history for a specific entity
 */
export const getEntityHistoryHandler = async (
  req: Request<EntityHistoryParams>,
  res: Response,
  next: NextFunction
) => {
  try {
    const company_id = req.user!.admin_company_id;
    const { type, id } = req.params;

    const history = await audit_service.getEntityHistory(type, id, company_id);

    return res.status(HTTP_CODES.OK).json({
      success: true,
      data: {
        entity_type: type,
        entity_id: id,
        history,
        total_changes: history.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/audit/recent
 * Get recent audit logs for dashboard widget
 */
export const getRecentAuditLogsHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const company_id = req.user!.admin_company_id;
    const limit = req.query.limit
      ? Math.min(parseInt(req.query.limit as string, 10), 50)
      : 10;

    const logs = await audit_service.getRecentLogs(company_id, limit);

    return res.status(HTTP_CODES.OK).json({
      success: true,
      data: logs,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/audit/statistics
 * Get audit statistics grouped by action type
 */
export const getAuditStatisticsHandler = async (
  req: Request<{}, {}, {}, AuditStatisticsQuery>,
  res: Response,
  next: NextFunction
) => {
  try {
    const company_id = req.user!.admin_company_id;
    const { start_date, end_date } = req.query;

    const stats = await audit_service.getStatistics(
      company_id,
      start_date,
      end_date
    );

    // Calculate totals
    const totalActions = stats.reduce((sum, stat) => sum + stat.count, 0);

    return res.status(HTTP_CODES.OK).json({
      success: true,
      data: {
        statistics: stats,
        total_actions: totalActions,
        period: {
          start_date: start_date || null,
          end_date: end_date || null,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};
