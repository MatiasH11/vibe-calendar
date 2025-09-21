import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { adminMiddleware } from '../middlewares/admin.middleware';
import { validate_body, validate_query } from '../middlewares/validation_middleware';
import { create_shift_schema, get_shifts_schema, update_shift_schema, duplicate_shift_schema, bulk_create_shifts_schema, validate_conflicts_schema, get_employee_patterns_schema, get_suggestions_schema } from '../validations/shift.validation';
import { create_shift_handler, delete_shift_handler, get_shifts_handler, update_shift_handler, duplicate_shifts_handler, bulk_create_shifts_handler, validate_conflicts_handler, get_employee_patterns_handler, get_suggestions_handler } from '../controllers/shift.controller';

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

/**
 * @openapi
 * /shifts/duplicate:
 *   post:
 *     summary: Duplicate shifts to different dates/employees
 *     tags: [Shifts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/duplicate_shift_body'
 *           examples:
 *             duplicate-to-dates:
 *               value: { source_shift_ids: [1, 2], target_dates: ["2025-08-12", "2025-08-13"], preserve_employee: true, conflict_resolution: "skip" }
 *             duplicate-to-employees:
 *               value: { source_shift_ids: [1], target_employee_ids: [5, 6], preserve_date: true, conflict_resolution: "fail" }
 *     responses:
 *       201:
 *         description: Created
 *       409:
 *         description: Conflicts detected
 */
router.post('/duplicate', authMiddleware, adminMiddleware, validate_body(duplicate_shift_schema), duplicate_shifts_handler);

/**
 * @openapi
 * /shifts/bulk-create:
 *   post:
 *     summary: Create multiple shifts simultaneously
 *     tags: [Shifts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/bulk_create_shifts_body'
 *           examples:
 *             bulk-create:
 *               value: { employee_ids: [1, 2, 3], dates: ["2025-08-12", "2025-08-13"], start_time: "09:00", end_time: "17:00", conflict_resolution: "skip" }
 *             with-template:
 *               value: { employee_ids: [1, 2], dates: ["2025-08-12"], template_id: 1, conflict_resolution: "fail" }
 *             preview-only:
 *               value: { employee_ids: [1, 2], dates: ["2025-08-12"], start_time: "09:00", end_time: "17:00", preview_only: true }
 *     responses:
 *       201:
 *         description: Created
 *       409:
 *         description: Conflicts detected
 */
router.post('/bulk-create', authMiddleware, adminMiddleware, validate_body(bulk_create_shifts_schema), bulk_create_shifts_handler);

/**
 * @openapi
 * /shifts/validate-conflicts:
 *   post:
 *     summary: Validate potential conflicts for shifts
 *     tags: [Shifts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/validate_conflicts_body'
 *           examples:
 *             validate-conflicts:
 *               value: { shifts: [{ company_employee_id: 1, shift_date: "2025-08-12", start_time: "09:00", end_time: "17:00" }] }
 *     responses:
 *       200:
 *         description: Validation results
 */
router.post('/validate-conflicts', authMiddleware, adminMiddleware, validate_body(validate_conflicts_schema), validate_conflicts_handler);

/**
 * @openapi
 * /shifts/patterns/{employeeId}:
 *   get:
 *     summary: Get employee shift patterns
 *     tags: [Shifts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: employeeId
 *         required: true
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         required: false
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200:
 *         description: Employee shift patterns
 */
router.get('/patterns/:employeeId', authMiddleware, adminMiddleware, validate_query(get_employee_patterns_schema), get_employee_patterns_handler);

/**
 * @openapi
 * /shifts/suggestions:
 *   get:
 *     summary: Get shift time suggestions for employee
 *     tags: [Shifts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: employee_id
 *         required: true
 *         schema: { type: integer }
 *       - in: query
 *         name: date
 *         required: false
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: limit
 *         required: false
 *         schema: { type: integer, default: 5 }
 *     responses:
 *       200:
 *         description: Time suggestions
 */
router.get('/suggestions', authMiddleware, adminMiddleware, validate_query(get_suggestions_schema), get_suggestions_handler);

export default router;


