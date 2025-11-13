import { Router } from 'express';
import { day_template_controller } from '../controllers/day_template.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * @openapi
 * /day_template:
 *   get:
 *     tags: [day_template]
 *     summary: Get all day_templates
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
 *         description: List of day_templates with pagination
 */
router.get('/', day_template_controller.getAll);

/**
 * @openapi
 * /day_template/{id}:
 *   get:
 *     tags: [day_template]
 *     summary: Get day_template by ID
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
 *         description: day_template details
 *       404:
 *         description: day_template not found
 */
router.get('/:id', day_template_controller.getById);

/**
 * @openapi
 * /day_template:
 *   post:
 *     tags: [day_template]
 *     summary: Create new day_template
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: day_template created successfully
 */
router.post('/', day_template_controller.create);

/**
 * @openapi
 * /day_template/{id}:
 *   put:
 *     tags: [day_template]
 *     summary: Update day_template
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: day_template updated successfully
 */
router.put('/:id', day_template_controller.update);

/**
 * @openapi
 * /day_template/{id}:
 *   delete:
 *     tags: [day_template]
 *     summary: Delete day_template (soft delete)
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
 *         description: day_template deleted successfully
 */
router.delete('/:id', day_template_controller.delete);

/**
 * @openapi
 * /day_template/bulk/create:
 *   post:
 *     tags: [day_template]
 *     summary: Bulk create day_templates
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               items:
 *                 type: array
 *                 minItems: 1
 *                 maxItems: 100
 *     responses:
 *       201:
 *         description: day_templates created successfully
 */
router.post('/bulk/create', day_template_controller.bulkCreate);

/**
 * @openapi
 * /day_template/bulk/update:
 *   put:
 *     tags: [day_template]
 *     summary: Bulk update day_templates
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
 *         description: day_templates updated successfully
 */
router.put('/bulk/update', day_template_controller.bulkUpdate);

/**
 * @openapi
 * /day_template/bulk/delete:
 *   delete:
 *     tags: [day_template]
 *     summary: Bulk delete day_templates
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
 *         description: day_templates deleted successfully
 */
router.delete('/bulk/delete', day_template_controller.bulkDelete);

export default router;
