/**
 * Audit Routes - API endpoints for audit log management
 * Reference: PLAN.md Section 2.3
 */

import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { adminMiddleware } from '../middlewares/admin.middleware';
import { validate_query, validate_params } from '../middlewares/validation_middleware';
import {
  audit_query_schema,
  entity_history_params_schema,
  audit_statistics_query_schema,
} from '../validations/audit.validation';
import {
  getAuditLogsHandler,
  getEntityHistoryHandler,
  getRecentAuditLogsHandler,
  getAuditStatisticsHandler,
} from '../controllers/audit.controller';

const router = Router();

/**
 * @openapi
 * /audit:
 *   get:
 *     summary: Query audit logs with filters and pagination
 *     tags: [Audit]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: user_id
 *         schema: { type: integer }
 *         description: Filter by user who performed the action
 *       - in: query
 *         name: action
 *         schema: { type: string, enum: [CREATE, UPDATE, DELETE, LOGIN, LOGOUT, EXPORT, IMPORT] }
 *         description: Filter by action type
 *       - in: query
 *         name: entity_type
 *         schema: { type: string }
 *         description: Filter by entity type (e.g., "shift", "employee")
 *       - in: query
 *         name: entity_id
 *         schema: { type: integer }
 *         description: Filter by specific entity ID
 *       - in: query
 *         name: start_date
 *         schema: { type: string, format: date, example: "2025-08-01" }
 *         description: Filter by start date (YYYY-MM-DD)
 *       - in: query
 *         name: end_date
 *         schema: { type: string, format: date, example: "2025-08-31" }
 *         description: Filter by end date (YYYY-MM-DD)
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 50, maximum: 100 }
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Audit logs retrieved successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data: [{ id: 1, action: "CREATE", entity_type: "shift", user: { first_name: "John" } }]
 *               pagination: { total: 150, page: 1, limit: 50, totalPages: 3, hasNext: true, hasPrev: false }
 */
router.get(
  '/',
  authMiddleware,
  adminMiddleware,
  validate_query(audit_query_schema),
  getAuditLogsHandler as any
);

/**
 * @openapi
 * /audit/entity/{type}/{id}:
 *   get:
 *     summary: Get complete audit history for a specific entity
 *     tags: [Audit]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema: { type: string, example: "shift" }
 *         description: Entity type (e.g., "shift", "employee", "role")
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer, example: 123 }
 *         description: Entity ID
 *     responses:
 *       200:
 *         description: Entity audit history retrieved
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data:
 *                 entity_type: "shift"
 *                 entity_id: 123
 *                 history: [{ action: "CREATE", created_at: "2025-08-15T10:00:00Z", user: { first_name: "John" } }]
 *                 total_changes: 3
 */
router.get(
  '/entity/:type/:id',
  authMiddleware,
  adminMiddleware,
  validate_params(entity_history_params_schema),
  getEntityHistoryHandler as any
);

/**
 * @openapi
 * /audit/recent:
 *   get:
 *     summary: Get recent audit logs (for dashboard widget)
 *     tags: [Audit]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10, maximum: 50 }
 *         description: Number of recent logs to retrieve
 *     responses:
 *       200:
 *         description: Recent audit logs retrieved
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data: [{ id: 100, action: "UPDATE", entity_type: "shift", created_at: "2025-08-15T14:30:00Z" }]
 */
router.get(
  '/recent',
  authMiddleware,
  adminMiddleware,
  getRecentAuditLogsHandler
);

/**
 * @openapi
 * /audit/statistics:
 *   get:
 *     summary: Get audit statistics grouped by action type
 *     tags: [Audit]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: start_date
 *         schema: { type: string, format: date }
 *         description: Optional start date filter (YYYY-MM-DD)
 *       - in: query
 *         name: end_date
 *         schema: { type: string, format: date }
 *         description: Optional end date filter (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Audit statistics retrieved
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data:
 *                 statistics: [{ action: "CREATE", count: 150 }, { action: "UPDATE", count: 80 }]
 *                 total_actions: 230
 *                 period: { start_date: null, end_date: null }
 */
router.get(
  '/statistics',
  authMiddleware,
  adminMiddleware,
  validate_query(audit_statistics_query_schema),
  getAuditStatisticsHandler
);

export default router;
