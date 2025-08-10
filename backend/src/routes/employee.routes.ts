import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { adminMiddleware } from '../middlewares/admin.middleware';
import { validate_body } from '../middlewares/validation_middleware';
import { add_employee_schema } from '../validations/employee.validation';
import { addEmployeeHandler, getEmployeesHandler } from '../controllers/employee.controller';

const router = Router();

/**
 * @openapi
 * /employees:
 *   post:
 *     summary: Add an employee to the company
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email: { type: string }
 *               first_name: { type: string }
 *               last_name: { type: string }
 *               role_id: { type: number }
 *               position: { type: string }
 *     responses:
 *       201:
 *         description: Created
 *       409:
 *         description: Conflict
 */
router.post('/', authMiddleware, adminMiddleware, validate_body(add_employee_schema), addEmployeeHandler);

/**
 * @openapi
 * /employees:
 *   get:
 *     summary: List employees of the company
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: OK
 */
router.get('/', authMiddleware, adminMiddleware, getEmployeesHandler);

export default router;


