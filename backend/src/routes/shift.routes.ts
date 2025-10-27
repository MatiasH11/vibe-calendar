import { Router } from 'express';
import { shift_controller } from '../controllers/shift.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * @openapi
 * /shift:
 *   get:
 *     tags: [shift]
 *     summary: Get all shifts
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *           maximum: 100
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: is_active
 *         schema:
 *           type: string
 *           enum: [true, false]
 *       - in: query
 *         name: sort_by
 *         schema:
 *           type: string
 *       - in: query
 *         name: sort_order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *     responses:
 *       200:
 *         description: List of shifts with pagination
 */
router.get('/', shift_controller.getAll);

/**
 * @openapi
 * /shift/{id}:
 *   get:
 *     tags: [shift]
 *     summary: Get shift by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: shift details
 *       404:
 *         description: shift not found
 */
router.get('/:id', shift_controller.getById);

/**
 * @openapi
 * /shift:
 *   post:
 *     tags: [shift]
 *     summary: Create new shift
 *     description: |
 *       Create a new shift with UTC date/time format and business logic validation.
 *
 *       **IMPORTANT - UTC Date/Time Format:**
 *       - `shift_date` must be in ISO format YYYY-MM-DD (e.g., "2025-10-26")
 *       - `start_time` and `end_time` must be in UTC HH:mm format (e.g., "14:30", "09:00")
 *       - Times MUST be in 24-hour format (00:00 to 23:59)
 *       - NO timezone indicators allowed (Z, +00:00, etc. will be rejected)
 *       - Backend ONLY accepts/returns UTC dates and times
 *       - Frontend is responsible for timezone conversions for display
 *
 *       **Business Logic Validation:**
 *       - Conflict detection: No overlapping shifts for same employee on same date
 *       - Max daily hours: Validates against company_settings.max_daily_hours
 *       - Employee validation: Ensures employee belongs to company
 *       - Pattern tracking: Automatically learns employee shift patterns
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - employee_id
 *               - shift_date
 *               - start_time
 *               - end_time
 *             properties:
 *               employee_id:
 *                 type: integer
 *                 minimum: 1
 *                 description: Employee ID (must belong to company)
 *                 example: 5
 *               shift_date:
 *                 type: string
 *                 pattern: '^\d{4}-\d{2}-\d{2}$'
 *                 description: Shift date in ISO YYYY-MM-DD format
 *                 example: "2025-10-26"
 *               start_time:
 *                 type: string
 *                 pattern: '^([01]\d|2[0-3]):[0-5]\d$'
 *                 description: Start time in UTC HH:mm format (24-hour)
 *                 example: "09:00"
 *               end_time:
 *                 type: string
 *                 pattern: '^([01]\d|2[0-3]):[0-5]\d$'
 *                 description: End time in UTC HH:mm format (24-hour)
 *                 example: "17:00"
 *               notes:
 *                 type: string
 *                 description: Optional shift notes
 *                 example: "Please arrive 10 minutes early"
 *               status:
 *                 type: string
 *                 enum: [draft, confirmed, cancelled]
 *                 default: confirmed
 *                 description: Shift status
 *                 example: "confirmed"
 *           example:
 *             employee_id: 5
 *             shift_date: "2025-10-26"
 *             start_time: "09:00"
 *             end_time: "17:00"
 *             notes: "Please arrive 10 minutes early"
 *             status: "confirmed"
 *     responses:
 *       201:
 *         description: Shift created successfully
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
 *                     employee_id:
 *                       type: integer
 *                       example: 5
 *                     shift_date:
 *                       type: string
 *                       example: "2025-10-26"
 *                     start_time:
 *                       type: string
 *                       example: "09:00"
 *                     end_time:
 *                       type: string
 *                       example: "17:00"
 *                     notes:
 *                       type: string
 *                       example: "Please arrive 10 minutes early"
 *                     status:
 *                       type: string
 *                       example: "confirmed"
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: |
 *           Validation error:
 *           - Invalid date/time format
 *           - Times are equal
 *           - Shift overlaps with existing shift
 *           - Exceeds max daily hours
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Employee not found
 */
router.post('/', shift_controller.create);

/**
 * @openapi
 * /shift/{id}:
 *   put:
 *     tags: [shift]
 *     summary: Update shift
 *     description: |
 *       Update an existing shift (partial update supported).
 *
 *       **IMPORTANT - UTC Date/Time Format:**
 *       - `shift_date` must be in ISO format YYYY-MM-DD (e.g., "2025-10-26")
 *       - `start_time` and `end_time` must be in UTC HH:mm format (e.g., "14:30", "09:00")
 *       - Times MUST be in 24-hour format (00:00 to 23:59)
 *       - NO timezone indicators allowed (Z, +00:00, etc. will be rejected)
 *       - All fields are optional for partial updates
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Shift ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               employee_id:
 *                 type: integer
 *                 minimum: 1
 *                 description: Employee ID
 *                 example: 5
 *               shift_date:
 *                 type: string
 *                 pattern: '^\d{4}-\d{2}-\d{2}$'
 *                 description: Shift date in ISO YYYY-MM-DD format
 *                 example: "2025-10-27"
 *               start_time:
 *                 type: string
 *                 pattern: '^([01]\d|2[0-3]):[0-5]\d$'
 *                 description: Start time in UTC HH:mm format
 *                 example: "10:00"
 *               end_time:
 *                 type: string
 *                 pattern: '^([01]\d|2[0-3]):[0-5]\d$'
 *                 description: End time in UTC HH:mm format
 *                 example: "18:00"
 *               notes:
 *                 type: string
 *                 example: "Updated shift notes"
 *               status:
 *                 type: string
 *                 enum: [draft, confirmed, cancelled]
 *                 example: "confirmed"
 *           example:
 *             shift_date: "2025-10-27"
 *             start_time: "10:00"
 *             end_time: "18:00"
 *             status: "confirmed"
 *     responses:
 *       200:
 *         description: Shift updated successfully
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
 *       400:
 *         description: Validation error
 *       404:
 *         description: Shift not found
 */
router.put('/:id', shift_controller.update);

/**
 * @openapi
 * /shift/{id}:
 *   delete:
 *     tags: [shift]
 *     summary: Delete shift (soft delete)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: shift deleted successfully
 */
router.delete('/:id', shift_controller.delete);

/**
 * @openapi
 * /shift/bulk/create:
 *   post:
 *     tags: [shift]
 *     summary: Bulk create shifts
 *     description: |
 *       Create multiple shifts in a single operation (max 100).
 *
 *       **IMPORTANT - UTC Date/Time Format:**
 *       - All dates must be in ISO YYYY-MM-DD format (e.g., "2025-10-26")
 *       - All times must be in UTC HH:mm format (e.g., "14:30", "09:00")
 *       - NO timezone indicators allowed
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - items
 *             properties:
 *               items:
 *                 type: array
 *                 minItems: 1
 *                 maxItems: 100
 *                 items:
 *                   type: object
 *                   required:
 *                     - employee_id
 *                     - shift_date
 *                     - start_time
 *                     - end_time
 *                   properties:
 *                     employee_id:
 *                       type: integer
 *                       minimum: 1
 *                       example: 5
 *                     shift_date:
 *                       type: string
 *                       pattern: '^\d{4}-\d{2}-\d{2}$'
 *                       example: "2025-10-26"
 *                     start_time:
 *                       type: string
 *                       pattern: '^([01]\d|2[0-3]):[0-5]\d$'
 *                       example: "09:00"
 *                     end_time:
 *                       type: string
 *                       pattern: '^([01]\d|2[0-3]):[0-5]\d$'
 *                       example: "17:00"
 *                     notes:
 *                       type: string
 *                       example: "Optional notes"
 *                     status:
 *                       type: string
 *                       enum: [draft, confirmed, cancelled]
 *                       default: confirmed
 *                       example: "confirmed"
 *           example:
 *             items:
 *               - employee_id: 5
 *                 shift_date: "2025-10-26"
 *                 start_time: "09:00"
 *                 end_time: "17:00"
 *                 status: "confirmed"
 *               - employee_id: 6
 *                 shift_date: "2025-10-26"
 *                 start_time: "17:00"
 *                 end_time: "01:00"
 *                 notes: "Overnight shift"
 *                 status: "confirmed"
 *     responses:
 *       201:
 *         description: Shifts created successfully
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
 *                     created:
 *                       type: integer
 *                       example: 2
 *                     total:
 *                       type: integer
 *                       example: 2
 */
router.post('/bulk/create', shift_controller.bulkCreate);

/**
 * @openapi
 * /shift/bulk/update:
 *   put:
 *     tags: [shift]
 *     summary: Bulk update shifts
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 minItems: 1
 *                 maxItems: 100
 *               data:
 *                 type: object
 *     responses:
 *       200:
 *         description: shifts updated successfully
 */
router.put('/bulk/update', shift_controller.bulkUpdate);

/**
 * @openapi
 * /shift/bulk/delete:
 *   delete:
 *     tags: [shift]
 *     summary: Bulk delete shifts
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 minItems: 1
 *                 maxItems: 100
 *     responses:
 *       200:
 *         description: shifts deleted successfully
 */
router.delete('/bulk/delete', shift_controller.bulkDelete);

export default router;
