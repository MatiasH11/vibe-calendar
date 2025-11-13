import { Router } from 'express';
import { template_shift_position_controller } from '../controllers/template_shift_position.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * @openapi
 * /template_shift_position:
 *   get:
 *     tags: [template_shift_position]
 *     summary: Get all template_shift_positions
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
 *         description: List of template_shift_positions with pagination
 */
router.get('/', template_shift_position_controller.getAll);

/**
 * @openapi
 * /template_shift_position/{id}:
 *   get:
 *     tags: [template_shift_position]
 *     summary: Get template_shift_position by ID
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
 *         description: template_shift_position details
 *       404:
 *         description: template_shift_position not found
 */
router.get('/:id', template_shift_position_controller.getById);

/**
 * @openapi
 * /template_shift_position:
 *   post:
 *     tags: [template_shift_position]
 *     summary: Create new template_shift_position
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
 *         description: template_shift_position created successfully
 */
router.post('/', template_shift_position_controller.create);

/**
 * @openapi
 * /template_shift_position/{id}:
 *   put:
 *     tags: [template_shift_position]
 *     summary: Update template_shift_position
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
 *         description: template_shift_position updated successfully
 */
router.put('/:id', template_shift_position_controller.update);

/**
 * @openapi
 * /template_shift_position/{id}:
 *   delete:
 *     tags: [template_shift_position]
 *     summary: Delete template_shift_position (soft delete)
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
 *         description: template_shift_position deleted successfully
 */
router.delete('/:id', template_shift_position_controller.delete);

/**
 * @openapi
 * /template_shift_position/bulk/create:
 *   post:
 *     tags: [template_shift_position]
 *     summary: Bulk create template_shift_positions
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
 *         description: template_shift_positions created successfully
 */
router.post('/bulk/create', template_shift_position_controller.bulkCreate);

/**
 * @openapi
 * /template_shift_position/bulk/update:
 *   put:
 *     tags: [template_shift_position]
 *     summary: Bulk update template_shift_positions
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
 *         description: template_shift_positions updated successfully
 */
router.put('/bulk/update', template_shift_position_controller.bulkUpdate);

/**
 * @openapi
 * /template_shift_position/bulk/delete:
 *   delete:
 *     tags: [template_shift_position]
 *     summary: Bulk delete template_shift_positions
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
 *         description: template_shift_positions deleted successfully
 */
router.delete('/bulk/delete', template_shift_position_controller.bulkDelete);

export default router;
