import { Router } from 'express';
import { scheduling_batch_controller } from '../controllers/scheduling_batch.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * @openapi
 * /scheduling_batch:
 *   get:
 *     tags: [scheduling_batch]
 *     summary: Get all scheduling_batchs
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
 *         description: List of scheduling_batchs with pagination
 */
router.get('/', scheduling_batch_controller.getAll);

/**
 * @openapi
 * /scheduling_batch/{id}:
 *   get:
 *     tags: [scheduling_batch]
 *     summary: Get scheduling_batch by ID
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
 *         description: scheduling_batch details
 *       404:
 *         description: scheduling_batch not found
 */
router.get('/:id', scheduling_batch_controller.getById);

/**
 * @openapi
 * /scheduling_batch:
 *   post:
 *     tags: [scheduling_batch]
 *     summary: Create new scheduling_batch
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
 *         description: scheduling_batch created successfully
 */
router.post('/', scheduling_batch_controller.create);

/**
 * @openapi
 * /scheduling_batch/{id}:
 *   put:
 *     tags: [scheduling_batch]
 *     summary: Update scheduling_batch
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
 *         description: scheduling_batch updated successfully
 */
router.put('/:id', scheduling_batch_controller.update);

/**
 * @openapi
 * /scheduling_batch/{id}:
 *   delete:
 *     tags: [scheduling_batch]
 *     summary: Delete scheduling_batch (soft delete)
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
 *         description: scheduling_batch deleted successfully
 */
router.delete('/:id', scheduling_batch_controller.delete);

/**
 * @openapi
 * /scheduling_batch/bulk/create:
 *   post:
 *     tags: [scheduling_batch]
 *     summary: Bulk create scheduling_batchs
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
 *         description: scheduling_batchs created successfully
 */
router.post('/bulk/create', scheduling_batch_controller.bulkCreate);

/**
 * @openapi
 * /scheduling_batch/bulk/update:
 *   put:
 *     tags: [scheduling_batch]
 *     summary: Bulk update scheduling_batchs
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
 *         description: scheduling_batchs updated successfully
 */
router.put('/bulk/update', scheduling_batch_controller.bulkUpdate);

/**
 * @openapi
 * /scheduling_batch/bulk/delete:
 *   delete:
 *     tags: [scheduling_batch]
 *     summary: Bulk delete scheduling_batchs
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
 *         description: scheduling_batchs deleted successfully
 */
router.delete('/bulk/delete', scheduling_batch_controller.bulkDelete);

export default router;
