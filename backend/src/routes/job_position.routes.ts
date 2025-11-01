import { Router } from 'express';
import { job_position_controller } from '../controllers/job_position.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * @openapi
 * /job_position:
 *   get:
 *     tags: [job_position]
 *     summary: Get all job_positions
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
 *         description: List of job_positions with pagination
 */
router.get('/', job_position_controller.getAll);

/**
 * @openapi
 * /job_position/{id}:
 *   get:
 *     tags: [job_position]
 *     summary: Get job_position by ID
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
 *         description: job_position details
 *       404:
 *         description: job_position not found
 */
router.get('/:id', job_position_controller.getById);

/**
 * @openapi
 * /job_position:
 *   post:
 *     tags: [job_position]
 *     summary: Create new job_position
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
 *         description: job_position created successfully
 */
router.post('/', job_position_controller.create);

/**
 * @openapi
 * /job_position/{id}:
 *   put:
 *     tags: [job_position]
 *     summary: Update job_position
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
 *         description: job_position updated successfully
 */
router.put('/:id', job_position_controller.update);

/**
 * @openapi
 * /job_position/{id}:
 *   delete:
 *     tags: [job_position]
 *     summary: Delete job_position (soft delete)
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
 *         description: job_position deleted successfully
 */
router.delete('/:id', job_position_controller.delete);

/**
 * @openapi
 * /job_position/bulk/create:
 *   post:
 *     tags: [job_position]
 *     summary: Bulk create job_positions
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
 *         description: job_positions created successfully
 */
router.post('/bulk/create', job_position_controller.bulkCreate);

/**
 * @openapi
 * /job_position/bulk/update:
 *   put:
 *     tags: [job_position]
 *     summary: Bulk update job_positions
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
 *         description: job_positions updated successfully
 */
router.put('/bulk/update', job_position_controller.bulkUpdate);

/**
 * @openapi
 * /job_position/bulk/delete:
 *   delete:
 *     tags: [job_position]
 *     summary: Bulk delete job_positions
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
 *         description: job_positions deleted successfully
 */
router.delete('/bulk/delete', job_position_controller.bulkDelete);

export default router;
