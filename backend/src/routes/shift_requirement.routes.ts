import { Router } from 'express';
import { shift_requirement_controller } from '../controllers/shift_requirement.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * @openapi
 * /shift_requirement:
 *   get:
 *     tags: [shift_requirement]
 *     summary: Get all shift_requirements
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
 *         description: List of shift_requirements with pagination
 */
router.get('/', shift_requirement_controller.getAll);

/**
 * @openapi
 * /shift_requirement/{id}:
 *   get:
 *     tags: [shift_requirement]
 *     summary: Get shift_requirement by ID
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
 *         description: shift_requirement details
 *       404:
 *         description: shift_requirement not found
 */
router.get('/:id', shift_requirement_controller.getById);

/**
 * @openapi
 * /shift_requirement:
 *   post:
 *     tags: [shift_requirement]
 *     summary: Create new shift_requirement
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
 *         description: shift_requirement created successfully
 */
router.post('/', shift_requirement_controller.create);

/**
 * @openapi
 * /shift_requirement/{id}:
 *   put:
 *     tags: [shift_requirement]
 *     summary: Update shift_requirement
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
 *         description: shift_requirement updated successfully
 */
router.put('/:id', shift_requirement_controller.update);

/**
 * @openapi
 * /shift_requirement/{id}:
 *   delete:
 *     tags: [shift_requirement]
 *     summary: Delete shift_requirement (soft delete)
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
 *         description: shift_requirement deleted successfully
 */
router.delete('/:id', shift_requirement_controller.delete);

/**
 * @openapi
 * /shift_requirement/bulk/create:
 *   post:
 *     tags: [shift_requirement]
 *     summary: Bulk create shift_requirements
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
 *         description: shift_requirements created successfully
 */
router.post('/bulk/create', shift_requirement_controller.bulkCreate);

/**
 * @openapi
 * /shift_requirement/bulk/update:
 *   put:
 *     tags: [shift_requirement]
 *     summary: Bulk update shift_requirements
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
 *         description: shift_requirements updated successfully
 */
router.put('/bulk/update', shift_requirement_controller.bulkUpdate);

/**
 * @openapi
 * /shift_requirement/bulk/delete:
 *   delete:
 *     tags: [shift_requirement]
 *     summary: Bulk delete shift_requirements
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
 *         description: shift_requirements deleted successfully
 */
router.delete('/bulk/delete', shift_requirement_controller.bulkDelete);

export default router;
