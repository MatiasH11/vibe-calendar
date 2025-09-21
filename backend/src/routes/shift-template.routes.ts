import { Router } from 'express';
import { 
  create_shift_template_handler,
  get_shift_templates_handler,
  get_shift_template_handler,
  update_shift_template_handler,
  delete_shift_template_handler,
  increment_template_usage_handler,
  get_template_statistics_handler
} from '../controllers/shift-template.controller';
import { 
  create_shift_template_schema,
  update_shift_template_schema,
  get_shift_templates_schema,
  shift_template_id_schema
} from '../validations/shift-template.validation';
import { validate_body, validate_query, validate_params } from '../middlewares/validation_middleware';
import { authMiddleware } from '../middlewares/auth.middleware';
import { adminMiddleware } from '../middlewares/admin.middleware';

const router = Router();

// All routes require authentication and admin privileges
router.use(authMiddleware);
router.use(adminMiddleware);

/**
 * @swagger
 * /api/shift-templates:
 *   post:
 *     summary: Create a new shift template
 *     tags: [Shift Templates]
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
 *                 maxLength: 100
 *                 description: Template name (must be unique within company)
 *               description:
 *                 type: string
 *                 maxLength: 500
 *                 description: Optional template description
 *               start_time:
 *                 type: string
 *                 pattern: '^([01]\d|2[0-3]):([0-5]\d)$'
 *                 description: Start time in HH:mm format
 *               end_time:
 *                 type: string
 *                 pattern: '^([01]\d|2[0-3]):([0-5]\d)$'
 *                 description: End time in HH:mm format
 *     responses:
 *       201:
 *         description: Template created successfully
 *       400:
 *         description: Invalid input data
 *       409:
 *         description: Template name already exists
 */
router.post(
  '/',
  validate_body(create_shift_template_schema),
  create_shift_template_handler
);

/**
 * @swagger
 * /api/shift-templates:
 *   get:
 *     summary: Get all shift templates for the company
 *     tags: [Shift Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in template name and description
 *       - in: query
 *         name: sort_by
 *         schema:
 *           type: string
 *           enum: [name, usage_count, created_at]
 *           default: name
 *         description: Sort field
 *       - in: query
 *         name: sort_order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *         description: Sort order
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Templates retrieved successfully
 */
router.get(
  '/',
  validate_query(get_shift_templates_schema),
  get_shift_templates_handler as any
);

/**
 * @swagger
 * /api/shift-templates/statistics:
 *   get:
 *     summary: Get template usage statistics for the company
 *     tags: [Shift Templates]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 */
router.get('/statistics', get_template_statistics_handler);

/**
 * @swagger
 * /api/shift-templates/{id}:
 *   get:
 *     summary: Get a specific shift template
 *     tags: [Shift Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Template ID
 *     responses:
 *       200:
 *         description: Template retrieved successfully
 *       404:
 *         description: Template not found
 */
router.get(
  '/:id',
  validate_params(shift_template_id_schema),
  get_shift_template_handler as any
);

/**
 * @swagger
 * /api/shift-templates/{id}:
 *   put:
 *     summary: Update a shift template
 *     tags: [Shift Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Template ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 100
 *                 description: Template name (must be unique within company)
 *               description:
 *                 type: string
 *                 maxLength: 500
 *                 description: Template description
 *               start_time:
 *                 type: string
 *                 pattern: '^([01]\d|2[0-3]):([0-5]\d)$'
 *                 description: Start time in HH:mm format
 *               end_time:
 *                 type: string
 *                 pattern: '^([01]\d|2[0-3]):([0-5]\d)$'
 *                 description: End time in HH:mm format
 *     responses:
 *       200:
 *         description: Template updated successfully
 *       400:
 *         description: Invalid input data
 *       404:
 *         description: Template not found
 *       409:
 *         description: Template name already exists
 */
router.put(
  '/:id',
  validate_params(shift_template_id_schema),
  validate_body(update_shift_template_schema),
  update_shift_template_handler as any
);

/**
 * @swagger
 * /api/shift-templates/{id}:
 *   delete:
 *     summary: Delete a shift template
 *     tags: [Shift Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Template ID
 *     responses:
 *       204:
 *         description: Template deleted successfully
 *       404:
 *         description: Template not found
 */
router.delete(
  '/:id',
  validate_params(shift_template_id_schema),
  delete_shift_template_handler as any
);

/**
 * @swagger
 * /api/shift-templates/{id}/increment-usage:
 *   post:
 *     summary: Increment template usage count
 *     tags: [Shift Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Template ID
 *     responses:
 *       200:
 *         description: Usage count incremented successfully
 *       404:
 *         description: Template not found
 */
router.post(
  '/:id/increment-usage',
  validate_params(shift_template_id_schema),
  increment_template_usage_handler as any
);

export default router;