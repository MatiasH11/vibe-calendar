import { Router } from 'express';
import { shift_assignment_controller } from '../controllers/shift_assignment.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * @openapi
 * /shift_assignment:
 *   get:
 *     tags: [shift_assignment]
 *     summary: Get all shift_assignments
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
 *         description: List of shift_assignments with pagination
 */
router.get('/', shift_assignment_controller.getAll);

/**
 * @openapi
 * /shift_assignment/{id}:
 *   get:
 *     tags: [shift_assignment]
 *     summary: Get shift_assignment by ID
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
 *         description: shift_assignment details
 *       404:
 *         description: shift_assignment not found
 */
router.get('/:id', shift_assignment_controller.getById);

/**
 * @openapi
 * /shift_assignment:
 *   post:
 *     tags: [shift_assignment]
 *     summary: Create new shift_assignment
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
 *         description: shift_assignment created successfully
 */
router.post('/', shift_assignment_controller.create);

/**
 * @openapi
 * /shift_assignment/{id}:
 *   put:
 *     tags: [shift_assignment]
 *     summary: Update shift_assignment
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
 *         description: shift_assignment updated successfully
 */
router.put('/:id', shift_assignment_controller.update);

/**
 * @openapi
 * /shift_assignment/{id}:
 *   delete:
 *     tags: [shift_assignment]
 *     summary: Delete shift_assignment (soft delete)
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
 *         description: shift_assignment deleted successfully
 */
router.delete('/:id', shift_assignment_controller.delete);

/**
 * @openapi
 * /shift_assignment/{id}/confirm:
 *   patch:
 *     tags: [shift_assignment]
 *     summary: Confirm shift_assignment (change status from pending to confirmed)
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
 *         description: shift_assignment confirmed successfully
 *       404:
 *         description: shift_assignment not found
 *       409:
 *         description: shift_assignment cannot be confirmed (not in pending status)
 */
router.patch('/:id/confirm', shift_assignment_controller.confirmShift);

/**
 * @openapi
 * /shift_assignment/bulk/create:
 *   post:
 *     tags: [shift_assignment]
 *     summary: Bulk create shift_assignments
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
 *         description: shift_assignments created successfully
 */
router.post('/bulk/create', shift_assignment_controller.bulkCreate);

/**
 * @openapi
 * /shift_assignment/bulk/update:
 *   put:
 *     tags: [shift_assignment]
 *     summary: Bulk update shift_assignments
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
 *         description: shift_assignments updated successfully
 */
router.put('/bulk/update', shift_assignment_controller.bulkUpdate);

/**
 * @openapi
 * /shift_assignment/bulk/delete:
 *   delete:
 *     tags: [shift_assignment]
 *     summary: Bulk delete shift_assignments
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
 *         description: shift_assignments deleted successfully
 */
router.delete('/bulk/delete', shift_assignment_controller.bulkDelete);

export default router;
