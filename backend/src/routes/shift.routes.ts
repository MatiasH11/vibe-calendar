import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { adminMiddleware } from '../middlewares/admin.middleware';
import { validate_body, validate_query } from '../middlewares/validation_middleware';
import { 
  create_shift_schema, 
  get_shifts_schema, 
  update_shift_schema, 
  duplicate_shift_schema, 
  bulk_create_shifts_schema, 
  validate_conflicts_schema, 
  get_employee_patterns_schema, 
  get_suggestions_schema 
} from '../validations/shift.validation';
import { 
  create_shift_handler, 
  get_shifts_handler, 
  update_shift_handler, 
  delete_shift_handler, 
  duplicate_shifts_handler, 
  bulk_create_shifts_handler, 
  validate_conflicts_handler, 
  get_employee_patterns_handler, 
  get_suggestions_handler 
} from '../controllers/shift.controller';

const router = Router();

/**
 * @openapi
 * /shifts:
 *   post:
 *     summary: Create a new shift
 *     tags: [Shifts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateShiftBody'
 *     responses:
 *       201:
 *         description: Created
 *       409:
 *         description: Conflict
 */
router.post('/', authMiddleware, adminMiddleware, validate_body(create_shift_schema), create_shift_handler);

/**
 * @openapi
 * /shifts:
 *   get:
 *     summary: Get shifts for a company
 *     tags: [Shifts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: start_date
 *         schema: { type: string, format: date }
 *         description: Start date of the range (YYYY-MM-DD)
 *       - in: query
 *         name: end_date
 *         schema: { type: string, format: date }
 *         description: End date of the range (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: OK
 */
router.get('/', authMiddleware, validate_query(get_shifts_schema), get_shifts_handler);

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
 *         description: Shift ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateShiftBody'
 *     responses:
 *       200:
 *         description: OK
 *       404:
 *         description: Not Found
 */
router.put('/:id', authMiddleware, adminMiddleware, validate_body(update_shift_schema), update_shift_handler);

/**
 * @openapi
 * /shifts/{id}:
 *   delete:
 *     summary: Delete a shift
 *     tags: [Shifts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *         description: Shift ID
 *     responses:
 *       204:
 *         description: No Content
 *       404:
 *         description: Not Found
 */
router.delete('/:id', authMiddleware, adminMiddleware, delete_shift_handler);

/**
 * @openapi
 * /shifts/duplicate:
 *   post:
 *     summary: Duplicate shifts
 *     tags: [Shifts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DuplicateShiftBody'
 *     responses:
 *       201:
 *         description: Created
 */
router.post('/duplicate', authMiddleware, adminMiddleware, validate_body(duplicate_shift_schema), duplicate_shifts_handler);

/**
 * @openapi
 * /shifts/bulk-create:
 *   post:
 *     summary: Bulk create shifts
 *     tags: [Shifts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BulkCreateShiftsBody'
 *     responses:
 *       201:
 *         description: Created
 */
router.post('/bulk-create', authMiddleware, adminMiddleware, validate_body(bulk_create_shifts_schema), bulk_create_shifts_handler);

/**
 * @openapi
 * /shifts/validate-conflicts:
 *   post:
 *     summary: Validate shift conflicts
 *     tags: [Shifts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ValidateConflictsBody'
 *     responses:
 *       200:
 *         description: OK
 */
router.post('/validate-conflicts', authMiddleware, adminMiddleware, validate_body(validate_conflicts_schema), validate_conflicts_handler);

/**
 * @openapi
 * /shifts/employee-patterns/{employeeId}:
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
 *         description: Employee ID
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *         description: Max number of patterns to return
 *     responses:
 *       200:
 *         description: OK
 */
router.get('/employee-patterns/:employeeId', authMiddleware, adminMiddleware, validate_query(get_employee_patterns_schema), get_employee_patterns_handler);

/**
 * @openapi
 * /shifts/suggestions:
 *   get:
 *     summary: Get shift suggestions
 *     tags: [Shifts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: employee_id
 *         required: true
 *         schema: { type: integer }
 *         description: Employee ID
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 5 }
 *         description: Max number of suggestions to return
 *       - in: query
 *         name: date
 *         schema: { type: string, format: date }
 *         description: Date for suggestions
 *     responses:
 *       200:
 *         description: OK
 */
router.get('/suggestions', authMiddleware, adminMiddleware, validate_query(get_suggestions_schema), get_suggestions_handler);

import { bulk_delete_shifts_schema } from '../validations/shift.validation';
import { bulkDeleteShiftsHandler } from '../controllers/shift.controller';

// ... (existing code)

/**
 * @openapi
 * /shifts/bulk:
 *   delete:
 *     summary: Bulk delete shifts (Soft Delete)
 *     tags: [Shifts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BulkDeleteShiftsBody'
 *     responses:
 *       200:
 *         description: Shifts deleted successfully
 *       403:
 *         description: Forbidden, one or more shifts do not belong to the company
 */
router.delete('/bulk', authMiddleware, adminMiddleware, validate_body(bulk_delete_shifts_schema), bulkDeleteShiftsHandler);

export default router;