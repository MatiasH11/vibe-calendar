import { Router } from 'express';
import { department_controller } from '../controllers/department.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * @openapi
 * /department:
 *   get:
 *     tags: [department]
 *     summary: Get all departments
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
 *         description: List of departments with pagination
 */
router.get('/', department_controller.getAll);

/**
 * @openapi
 * /department/{id}:
 *   get:
 *     tags: [department]
 *     summary: Get department by ID
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
 *         description: department details
 *       404:
 *         description: department not found
 */
router.get('/:id', department_controller.getById);

/**
 * @openapi
 * /department:
 *   post:
 *     tags: [department]
 *     summary: Create new department
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
 *         description: department created successfully
 */
router.post('/', department_controller.create);

/**
 * @openapi
 * /department/{id}:
 *   put:
 *     tags: [department]
 *     summary: Update department
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
 *         description: department updated successfully
 */
router.put('/:id', department_controller.update);

/**
 * @openapi
 * /department/{id}:
 *   delete:
 *     tags: [department]
 *     summary: Delete department (soft delete)
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
 *         description: department deleted successfully
 */
router.delete('/:id', department_controller.delete);

/**
 * @openapi
 * /department/bulk/create:
 *   post:
 *     tags: [department]
 *     summary: Bulk create departments
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
 *         description: departments created successfully
 */
router.post('/bulk/create', department_controller.bulkCreate);

/**
 * @openapi
 * /department/bulk/update:
 *   put:
 *     tags: [department]
 *     summary: Bulk update departments
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
 *         description: departments updated successfully
 */
router.put('/bulk/update', department_controller.bulkUpdate);

/**
 * @openapi
 * /department/bulk/delete:
 *   delete:
 *     tags: [department]
 *     summary: Bulk delete departments
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
 *         description: departments deleted successfully
 */
router.delete('/bulk/delete', department_controller.bulkDelete);

export default router;
