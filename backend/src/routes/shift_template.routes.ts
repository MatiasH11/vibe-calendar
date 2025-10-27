import { Router } from 'express';
import { shift_template_controller } from '../controllers/shift_template.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * @openapi
 * /shift_template:
 *   get:
 *     tags: [shift_template]
 *     summary: Get all shift_templates
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
 *         description: List of shift_templates with pagination
 */
router.get('/', shift_template_controller.getAll);

/**
 * @openapi
 * /shift_template/{id}:
 *   get:
 *     tags: [shift_template]
 *     summary: Get shift_template by ID
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
 *         description: shift_template details
 *       404:
 *         description: shift_template not found
 */
router.get('/:id', shift_template_controller.getById);

/**
 * @openapi
 * /shift_template:
 *   post:
 *     tags: [shift_template]
 *     summary: Create new shift template
 *     description: |
 *       Create a reusable shift template with UTC time format.
 *
 *       **IMPORTANT - UTC Time Format:**
 *       - `start_time` and `end_time` must be in UTC HH:mm format (e.g., "14:30", "09:00")
 *       - Times MUST be in 24-hour format (00:00 to 23:59)
 *       - NO timezone indicators allowed (Z, +00:00, etc. will be rejected)
 *       - Backend ONLY accepts/returns UTC times
 *       - Frontend is responsible for timezone conversions for display
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - start_time
 *               - end_time
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *                 description: Template name
 *                 example: "Morning Shift"
 *               description:
 *                 type: string
 *                 description: Optional template description
 *                 example: "Standard morning shift for weekdays"
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
 *           example:
 *             name: "Morning Shift"
 *             description: "Standard morning shift for weekdays"
 *             start_time: "09:00"
 *             end_time: "17:00"
 *     responses:
 *       201:
 *         description: Shift template created successfully
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
 *                     name:
 *                       type: string
 *                       example: "Morning Shift"
 *                     description:
 *                       type: string
 *                       example: "Standard morning shift for weekdays"
 *                     start_time:
 *                       type: string
 *                       example: "09:00"
 *                     end_time:
 *                       type: string
 *                       example: "17:00"
 *                     usage_count:
 *                       type: integer
 *                       example: 0
 *                     created_by:
 *                       type: integer
 *                       example: 1
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Validation error (invalid time format or times are equal)
 *       401:
 *         description: Unauthorized
 */
router.post('/', shift_template_controller.create);

/**
 * @openapi
 * /shift_template/{id}:
 *   put:
 *     tags: [shift_template]
 *     summary: Update shift template
 *     description: |
 *       Update an existing shift template (partial update supported).
 *
 *       **IMPORTANT - UTC Time Format:**
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
 *         description: Shift template ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *                 example: "Afternoon Shift"
 *               description:
 *                 type: string
 *                 example: "Updated description"
 *               start_time:
 *                 type: string
 *                 pattern: '^([01]\d|2[0-3]):[0-5]\d$'
 *                 description: Start time in UTC HH:mm format
 *                 example: "13:00"
 *               end_time:
 *                 type: string
 *                 pattern: '^([01]\d|2[0-3]):[0-5]\d$'
 *                 description: End time in UTC HH:mm format
 *                 example: "21:00"
 *           example:
 *             name: "Afternoon Shift"
 *             start_time: "13:00"
 *             end_time: "21:00"
 *     responses:
 *       200:
 *         description: Shift template updated successfully
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
 *         description: Shift template not found
 */
router.put('/:id', shift_template_controller.update);

/**
 * @openapi
 * /shift_template/{id}:
 *   delete:
 *     tags: [shift_template]
 *     summary: Delete shift_template (soft delete)
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
 *         description: shift_template deleted successfully
 */
router.delete('/:id', shift_template_controller.delete);

/**
 * @openapi
 * /shift_template/bulk/create:
 *   post:
 *     tags: [shift_template]
 *     summary: Bulk create shift templates
 *     description: |
 *       Create multiple shift templates in a single operation (max 100).
 *
 *       **IMPORTANT - UTC Time Format:**
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
 *                     - name
 *                     - start_time
 *                     - end_time
 *                   properties:
 *                     name:
 *                       type: string
 *                       example: "Morning Shift"
 *                     description:
 *                       type: string
 *                       example: "Standard morning shift"
 *                     start_time:
 *                       type: string
 *                       pattern: '^([01]\d|2[0-3]):[0-5]\d$'
 *                       example: "09:00"
 *                     end_time:
 *                       type: string
 *                       pattern: '^([01]\d|2[0-3]):[0-5]\d$'
 *                       example: "17:00"
 *           example:
 *             items:
 *               - name: "Morning Shift"
 *                 description: "Standard morning shift"
 *                 start_time: "09:00"
 *                 end_time: "17:00"
 *               - name: "Evening Shift"
 *                 description: "Standard evening shift"
 *                 start_time: "17:00"
 *                 end_time: "01:00"
 *     responses:
 *       201:
 *         description: Shift templates created successfully
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
router.post('/bulk/create', shift_template_controller.bulkCreate);

/**
 * @openapi
 * /shift_template/bulk/update:
 *   put:
 *     tags: [shift_template]
 *     summary: Bulk update shift_templates
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
 *         description: shift_templates updated successfully
 */
router.put('/bulk/update', shift_template_controller.bulkUpdate);

/**
 * @openapi
 * /shift_template/bulk/delete:
 *   delete:
 *     tags: [shift_template]
 *     summary: Bulk delete shift_templates
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
 *         description: shift_templates deleted successfully
 */
router.delete('/bulk/delete', shift_template_controller.bulkDelete);

export default router;
