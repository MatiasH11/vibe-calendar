import { Router } from 'express';
import { employee_controller } from '../controllers/employee.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * @openapi
 * /employee:
 *   get:
 *     tags: [employee]
 *     summary: Get all employees
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
 *         description: List of employees with pagination
 */
router.get('/', employee_controller.getAll);

/**
 * @openapi
 * /employee/{id}:
 *   get:
 *     tags: [employee]
 *     summary: Get employee by ID
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
 *         description: employee details
 *       404:
 *         description: employee not found
 */
router.get('/:id', employee_controller.getById);

/**
 * @openapi
 * /employee:
 *   post:
 *     tags: [employee]
 *     summary: Create new employee
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
 *         description: employee created successfully
 */
router.post('/', employee_controller.create);

/**
 * @openapi
 * /employee/{id}:
 *   put:
 *     tags: [employee]
 *     summary: Update employee
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
 *         description: employee updated successfully
 */
router.put('/:id', employee_controller.update);

/**
 * @openapi
 * /employee/{id}:
 *   delete:
 *     tags: [employee]
 *     summary: Delete employee (soft delete)
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
 *         description: employee deleted successfully
 */
router.delete('/:id', employee_controller.delete);

/**
 * @openapi
 * /employee/bulk/create:
 *   post:
 *     tags: [employee]
 *     summary: Bulk create employees
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
 *         description: employees created successfully
 */
router.post('/bulk/create', employee_controller.bulkCreate);

/**
 * @openapi
 * /employee/bulk/update:
 *   put:
 *     tags: [employee]
 *     summary: Bulk update employees
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
 *         description: employees updated successfully
 */
router.put('/bulk/update', employee_controller.bulkUpdate);

/**
 * @openapi
 * /employee/bulk/delete:
 *   delete:
 *     tags: [employee]
 *     summary: Bulk delete employees
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
 *         description: employees deleted successfully
 */
router.delete('/bulk/delete', employee_controller.bulkDelete);

export default router;
