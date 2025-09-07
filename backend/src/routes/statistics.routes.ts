import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { adminMiddleware } from '../middlewares/admin.middleware';
import { 
  getEmployeeStatsHandler, 
  getRoleStatsHandler, 
  getDashboardStatsHandler,
  getGrowthStatsHandler
} from '../controllers/statistics.controller';

const router = Router();

/**
 * @openapi
 * /statistics/employees:
 *   get:
 *     summary: Get employee statistics for the company
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data: { 
 *                 total_employees: 25, 
 *                 active_employees: 23, 
 *                 inactive_employees: 2,
 *                 active_percentage: 92,
 *                 distribution_by_role: [
 *                   { role_id: 1, role_name: "Cashier", total_employees: 8, active_employees: 7 }
 *                 ]
 *               }
 */
router.get('/employees', authMiddleware, adminMiddleware, getEmployeeStatsHandler);

/**
 * @openapi
 * /statistics/roles:
 *   get:
 *     summary: Get role statistics for the company
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data: { 
 *                 total_roles: 5, 
 *                 roles_with_employees: 3, 
 *                 empty_roles: 2,
 *                 utilization_percentage: 60
 *               }
 */
router.get('/roles', authMiddleware, adminMiddleware, getRoleStatsHandler);

/**
 * @openapi
 * /statistics/dashboard:
 *   get:
 *     summary: Get complete dashboard statistics
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data: { 
 *                 employees: { total_employees: 25 },
 *                 roles: { total_roles: 5 },
 *                 growth: { monthly_growth_rate: 8 }
 *               }
 */
router.get('/dashboard', authMiddleware, adminMiddleware, getDashboardStatsHandler);

/**
 * @openapi
 * /statistics/growth:
 *   get:
 *     summary: Get growth and trend statistics
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: OK
 */
router.get('/growth', authMiddleware, adminMiddleware, getGrowthStatsHandler);

export default router;
