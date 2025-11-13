import { Router } from 'express';
import { template_shift_controller } from '../controllers/template_shift.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * @openapi
 * /template_shift:
 *   get:
 *     tags: [template_shift]
 *     summary: Get all template_shifts
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
 *         description: List of template_shifts with pagination
 */
router.get('/', template_shift_controller.getAll);

/**
 * @openapi
 * /template_shift/{id}:
 *   get:
 *     tags: [template_shift]
 *     summary: Get template_shift by ID
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
 *         description: template_shift details
 *       404:
 *         description: template_shift not found
 */
router.get('/:id', template_shift_controller.getById);

/**
 * @openapi
 * /template_shift:
 *   post:
 *     tags: [template_shift]
 *     summary: Create new template_shift
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
 *         description: template_shift created successfully
 */
router.post('/', template_shift_controller.create);

/**
 * @openapi
 * /template_shift/{id}:
 *   put:
 *     tags: [template_shift]
 *     summary: Update template_shift
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
 *         description: template_shift updated successfully
 */
router.put('/:id', template_shift_controller.update);

/**
 * @openapi
 * /template_shift/{id}:
 *   delete:
 *     tags: [template_shift]
 *     summary: Delete template_shift (soft delete)
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
 *         description: template_shift deleted successfully
 */
router.delete('/:id', template_shift_controller.delete);

/**
 * @openapi
 * /template_shift/bulk/create:
 *   post:
 *     tags: [template_shift]
 *     summary: Bulk create template_shifts
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
 *         description: template_shifts created successfully
 */
router.post('/bulk/create', template_shift_controller.bulkCreate);

/**
 * @openapi
 * /template_shift/bulk/update:
 *   put:
 *     tags: [template_shift]
 *     summary: Bulk update template_shifts
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
 *         description: template_shifts updated successfully
 */
router.put('/bulk/update', template_shift_controller.bulkUpdate);

/**
 * @openapi
 * /template_shift/bulk/delete:
 *   delete:
 *     tags: [template_shift]
 *     summary: Bulk delete template_shifts
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
 *         description: template_shifts deleted successfully
 */
router.delete('/bulk/delete', template_shift_controller.bulkDelete);

export default router;
