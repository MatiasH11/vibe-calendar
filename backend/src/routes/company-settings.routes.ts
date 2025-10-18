import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { adminMiddleware } from '../middlewares/admin.middleware';
import { validate_body } from '../middlewares/validation_middleware';
import { update_company_settings_schema } from '../validations/company-settings.validation';
import {
  getCompanySettingsHandler,
  updateCompanySettingsHandler,
  getDefaultSettingsHandler,
} from '../controllers/company-settings.controller';

const router = Router();

/**
 * @openapi
 * /companies/settings:
 *   get:
 *     summary: Get current company settings
 *     description: Retrieves configuration settings for the authenticated company. Creates default settings if none exist.
 *     tags: [Company Settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Company settings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     company_id:
 *                       type: integer
 *                       example: 1
 *                     max_daily_hours:
 *                       type: number
 *                       format: float
 *                       example: 12.0
 *                       description: Maximum hours an employee can work per day
 *                     max_weekly_hours:
 *                       type: number
 *                       format: float
 *                       example: 40.0
 *                       description: Maximum hours an employee can work per week
 *                     min_break_hours:
 *                       type: number
 *                       format: float
 *                       example: 11.0
 *                       description: Minimum hours required between shifts
 *                     allow_overnight_shifts:
 *                       type: boolean
 *                       example: false
 *                       description: Whether shifts can span across midnight
 *                     timezone:
 *                       type: string
 *                       example: "UTC"
 *                       description: Company timezone in IANA format
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 *             examples:
 *               default_settings:
 *                 value:
 *                   success: true
 *                   data:
 *                     id: 1
 *                     company_id: 1
 *                     max_daily_hours: 12.0
 *                     max_weekly_hours: 40.0
 *                     min_break_hours: 11.0
 *                     allow_overnight_shifts: false
 *                     timezone: "UTC"
 *                     created_at: "2025-10-18T12:00:00Z"
 *                     updated_at: "2025-10-18T12:00:00Z"
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 */
router.get('/', authMiddleware, adminMiddleware, getCompanySettingsHandler);

/**
 * @openapi
 * /companies/settings:
 *   put:
 *     summary: Update company settings
 *     description: Updates configuration settings for the authenticated company. All fields are optional.
 *     tags: [Company Settings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               max_daily_hours:
 *                 type: number
 *                 format: float
 *                 minimum: 0.1
 *                 maximum: 24.0
 *                 example: 10.0
 *                 description: Maximum hours per day (must be <= max_weekly_hours)
 *               max_weekly_hours:
 *                 type: number
 *                 format: float
 *                 minimum: 0.1
 *                 maximum: 168.0
 *                 example: 48.0
 *                 description: Maximum hours per week
 *               min_break_hours:
 *                 type: number
 *                 format: float
 *                 minimum: 0.0
 *                 maximum: 24.0
 *                 example: 12.0
 *                 description: Minimum break time between shifts
 *               allow_overnight_shifts:
 *                 type: boolean
 *                 example: true
 *                 description: Allow shifts that span midnight
 *               timezone:
 *                 type: string
 *                 pattern: '^[A-Za-z_]+\/[A-Za-z_]+$'
 *                 example: "America/New_York"
 *                 description: Company timezone in IANA format (e.g., "America/New_York", "Europe/London")
 *           examples:
 *             update_hours:
 *               summary: Update work hour limits
 *               value:
 *                 max_daily_hours: 10.0
 *                 max_weekly_hours: 48.0
 *             enable_overnight:
 *               summary: Enable overnight shifts
 *               value:
 *                 allow_overnight_shifts: true
 *             change_timezone:
 *               summary: Change company timezone
 *               value:
 *                 timezone: "America/New_York"
 *             full_update:
 *               summary: Update all settings
 *               value:
 *                 max_daily_hours: 10.0
 *                 max_weekly_hours: 45.0
 *                 min_break_hours: 12.0
 *                 allow_overnight_shifts: true
 *                 timezone: "Europe/London"
 *     responses:
 *       200:
 *         description: Settings updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   description: Updated settings (same structure as GET)
 *                 message:
 *                   type: string
 *                   example: "Company settings updated successfully"
 *       400:
 *         description: Bad Request - Invalid input values
 *         content:
 *           application/json:
 *             examples:
 *               invalid_daily_hours:
 *                 value:
 *                   success: false
 *                   error:
 *                     error_code: "INVALID_SETTINGS"
 *                     message: "max_daily_hours cannot exceed max_weekly_hours"
 *               invalid_timezone:
 *                 value:
 *                   success: false
 *                   error:
 *                     error_code: "VALIDATION_ERROR"
 *                     message: "timezone must be in IANA format"
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       403:
 *         description: Forbidden - User is not an admin
 *       404:
 *         description: Company not found
 */
router.put('/', authMiddleware, adminMiddleware, validate_body(update_company_settings_schema), updateCompanySettingsHandler);

/**
 * @openapi
 * /companies/settings/defaults:
 *   get:
 *     summary: Get default settings values
 *     description: Returns the default configuration values used when creating new company settings. Useful for frontend forms.
 *     tags: [Company Settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Default settings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     max_daily_hours:
 *                       type: number
 *                       example: 12.0
 *                     max_weekly_hours:
 *                       type: number
 *                       example: 40.0
 *                     min_break_hours:
 *                       type: number
 *                       example: 11.0
 *                     allow_overnight_shifts:
 *                       type: boolean
 *                       example: false
 *                     timezone:
 *                       type: string
 *                       example: "UTC"
 *             example:
 *               success: true
 *               data:
 *                 max_daily_hours: 12.0
 *                 max_weekly_hours: 40.0
 *                 min_break_hours: 11.0
 *                 allow_overnight_shifts: false
 *                 timezone: "UTC"
 */
router.get('/defaults', authMiddleware, getDefaultSettingsHandler);

export default router;
