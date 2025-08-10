import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { adminMiddleware } from '../middlewares/admin.middleware';
import { validate_body, validate_query } from '../middlewares/validation_middleware';
import { create_shift_schema, get_shifts_schema, update_shift_schema } from '../validations/shift.validation';
import { create_shift_handler, delete_shift_handler, get_shifts_handler, update_shift_handler } from '../controllers/shift.controller';

const router = Router();

/**
 * @openapi
 * /shifts:
 *   post:
 *     summary: Create a shift
 *     tags: [Shifts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/create_shift_body'
 *           examples:
 *             example-1:
 *               value: { company_employee_id: 5, shift_date: "2025-08-11", start_time: "09:00", end_time: "13:00", notes: "Morning" }
 *     responses:
 *       201:
 *         description: Created
 */
router.post('/', authMiddleware, adminMiddleware, validate_body(create_shift_schema), create_shift_handler);

/**
 * @openapi
 * /shifts:
 *   get:
 *     summary: List shifts by date range (optional)
 *     tags: [Shifts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: start_date
 *         required: false
 *         description: Fecha de inicio (YYYY-MM-DD). Si se usa, debe combinarse con end_date.
 *         schema: { type: string, format: date, example: '2025-08-11' }
 *       - in: query
 *         name: end_date
 *         required: false
 *         description: Fecha de fin (YYYY-MM-DD). Si se usa, debe combinarse con start_date.
 *         schema: { type: string, format: date, example: '2025-08-17' }
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             examples:
 *               all-shifts:
 *                 summary: Sin filtros (todos los shifts de la empresa)
 *                 value:
 *                   success: true
 *                   data: [ { id: 1, company_employee_id: 5, shift_date: "2025-08-11", start_time: "09:00", end_time: "13:00" } ]
 *               by-range:
 *                 summary: Con rango de fechas
 *                 value:
 *                   success: true
 *                   data: [ { id: 2, company_employee_id: 5, shift_date: "2025-08-12", start_time: "13:00", end_time: "17:00" } ]
 */
router.get('/', authMiddleware, adminMiddleware, validate_query(get_shifts_schema), get_shifts_handler);

/**
 * @openapi
 * /shifts/{id}:
 *   put:
 *     summary: Update a shift
 *     tags: [Shifts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/update_shift_body'
 *           examples:
 *             example-1:
 *               value: { start_time: "13:00", end_time: "17:00" }
 *     responses:
 *       200:
 *         description: OK
 */
router.put('/:id', authMiddleware, adminMiddleware, validate_body(update_shift_schema), update_shift_handler);

/**
 * @openapi
 * /shifts/{id}:
 *   delete:
 *     summary: Soft delete a shift
 *     tags: [Shifts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       204:
 *         description: No Content
 */
router.delete('/:id', authMiddleware, adminMiddleware, delete_shift_handler);

export default router;


