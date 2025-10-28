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
 *     description: |
 *       Get all employees with pagination and optional filters.
 *
 *       **Employee Filters (filter which employees are returned):**
 *       - `search` - Search by employee name or position
 *       - `is_active` - Filter by active status
 *       - `created_after` / `created_before` - Filter by employee creation date
 *       - `updated_after` / `updated_before` - Filter by employee last update date
 *
 *       **Include Pattern:**
 *       - Use `include=shifts` to fetch employees with their shifts
 *       - When including shifts, use `shift_start_date` and `shift_end_date` to filter by date range
 *       - Shifts are returned ordered by shift_date (ascending)
 *
 *       **Examples:**
 *       - `/employee?include=shifts&shift_start_date=2025-10-21&shift_end_date=2025-10-27`
 *         Returns all employees with their shifts for that week
 *       - `/employee?created_after=2025-10-01&created_before=2025-10-31`
 *         Returns employees created in October 2025
 *       - `/employee?created_after=2025-10-01&include=shifts&shift_start_date=2025-10-21&shift_end_date=2025-10-27`
 *         Returns employees created after Oct 1st with their shifts for that week
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *           maximum: 100
 *         description: Items per page (max 100)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in employee name or position
 *       - in: query
 *         name: is_active
 *         schema:
 *           type: string
 *           enum: [true, false]
 *         description: Filter by active status
 *       - in: query
 *         name: sort_by
 *         schema:
 *           type: string
 *         description: Field to sort by
 *       - in: query
 *         name: sort_order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: Sort order (ascending or descending)
 *       - in: query
 *         name: include
 *         schema:
 *           type: string
 *           enum: [shifts]
 *         description: Include related resources (e.g., "shifts" to include employee shifts)
 *       - in: query
 *         name: shift_start_date
 *         schema:
 *           type: string
 *           pattern: '^\d{4}-\d{2}-\d{2}$'
 *           example: "2025-10-21"
 *         description: Start date filter for shifts (ISO format YYYY-MM-DD). Only used when include=shifts
 *       - in: query
 *         name: shift_end_date
 *         schema:
 *           type: string
 *           pattern: '^\d{4}-\d{2}-\d{2}$'
 *           example: "2025-10-27"
 *         description: End date filter for shifts (ISO format YYYY-MM-DD). Only used when include=shifts
 *       - in: query
 *         name: created_after
 *         schema:
 *           type: string
 *           pattern: '^\d{4}-\d{2}-\d{2}$'
 *           example: "2025-10-01"
 *         description: Filter employees created on or after this date (ISO format YYYY-MM-DD)
 *       - in: query
 *         name: created_before
 *         schema:
 *           type: string
 *           pattern: '^\d{4}-\d{2}-\d{2}$'
 *           example: "2025-10-31"
 *         description: Filter employees created on or before this date (ISO format YYYY-MM-DD)
 *       - in: query
 *         name: updated_after
 *         schema:
 *           type: string
 *           pattern: '^\d{4}-\d{2}-\d{2}$'
 *           example: "2025-10-01"
 *         description: Filter employees updated on or after this date (ISO format YYYY-MM-DD)
 *       - in: query
 *         name: updated_before
 *         schema:
 *           type: string
 *           pattern: '^\d{4}-\d{2}-\d{2}$'
 *           example: "2025-10-31"
 *         description: Filter employees updated on or before this date (ISO format YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: List of employees with pagination (optionally with shifts)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     items:
 *                       type: array
 *                       items:
 *                         type: object
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         total:
 *                           type: integer
 *                         total_pages:
 *                           type: integer
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
