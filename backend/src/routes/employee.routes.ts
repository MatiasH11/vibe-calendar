import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { adminMiddleware } from '../middlewares/admin.middleware';
import { validate_body, validate_query } from '../middlewares/validation_middleware';
import { 
  add_employee_schema, 
  employee_filters_schema, 
  update_employee_schema 
} from '../validations/employee.validation';
import { 
  addEmployeeHandler, 
  getEmployeesHandler,
  getEmployeesWithFiltersHandler,
  getEmployeesForShiftsHandler,
  getEmployeeByIdHandler,
  updateEmployeeHandler,
  deleteEmployeeHandler
} from '../controllers/employee.controller';

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
 *           examples:
 *             example-1:
 *               value: { email: "emp1@example.com", first_name: "Emp", last_name: "One", role_id: 2, position: "Staff" }
 *     responses:
 *       201:
 *         description: Created
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data: { id: 5, company_id: 1, user_id: 10, role_id: 2, position: "Staff", user: { id: 10, email: "emp1@example.com" }, role: { id: 2, name: "Cashier" } }
 *       409:
 *         description: Conflict
 */
router.post('/', authMiddleware, adminMiddleware, validate_body(add_employee_schema), addEmployeeHandler);

/**
 * @openapi
 * /employees:
 *   get:
 *     summary: List employees with advanced filters (NEW - Enhanced)
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Search in name, email, role, position
 *       - in: query
 *         name: role_id
 *         schema: { type: integer }
 *         description: Filter by specific role
 *       - in: query
 *         name: is_active
 *         schema: { type: boolean }
 *         description: Filter by active status
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10, maximum: 100 }
 *         description: Items per page
 *       - in: query
 *         name: sort_by
 *         schema: { type: string, enum: [created_at, user.first_name, user.last_name, role.name] }
 *         description: Sort field
 *       - in: query
 *         name: sort_order
 *         schema: { type: string, enum: [asc, desc] }
 *         description: Sort order
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data: [ 
 *                 { id: 5, position: "Staff", user: { email: "emp1@example.com" }, role: { name: "Cashier" } } 
 *               ]
 *               pagination: { total: 25, page: 1, limit: 10, totalPages: 3, hasNext: true, hasPrev: false }
 */
// NUEVA RUTA con filtros avanzados
router.get('/advanced', authMiddleware, adminMiddleware, validate_query(employee_filters_schema), getEmployeesWithFiltersHandler as any);

/**
 * @openapi
 * /employees/with-shifts:
 *   get:
 *     summary: Get all employees with their shifts for any date range (IMPROVED)
 *     tags: [Employees]
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
 *       - in: query
 *         name: week_start
 *         schema: { type: string, format: date }
 *         description: Start of the week (YYYY-MM-DD) - Legacy compatibility
 *       - in: query
 *         name: week_end
 *         schema: { type: string, format: date }
 *         description: End of the week (YYYY-MM-DD) - Legacy compatibility
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data: [
 *                 {
 *                   id: 1,
 *                   user: { first_name: "John", last_name: "Doe" },
 *                   role: { name: "Bar", color: "#8B5CF6" },
 *                   shifts: [
 *                     { date: "2025-08-25", shifts: [] },
 *                     { date: "2025-08-26", shifts: [{ id: 1, start_time: "09:00", end_time: "17:00" }] }
 *                   ]
 *                 }
 *               ]
 *               meta: {
 *                 start_date: "2025-08-25",
 *                 end_date: "2025-08-31",
 *                 total_employees: 1,
 *                 employees_with_shifts: 1,
 *                 total_shifts: 1
 *               }
 */
// NUEVA RUTA mejorada para vista de turnos
router.get('/with-shifts', authMiddleware, adminMiddleware, getEmployeesForShiftsHandler);

/**
 * @openapi
 * /employees/for-shifts:
 *   get:
 *     summary: Get all employees for shifts view with their weekly shifts (LEGACY)
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: week_start
 *         schema: { type: string, format: date }
 *         description: Start of the week (YYYY-MM-DD)
 *       - in: query
 *         name: week_end
 *         schema: { type: string, format: date }
 *         description: End of the week (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data: [
 *                 {
 *                   id: 1,
 *                   user: { first_name: "John", last_name: "Doe" },
 *                   role: { name: "Bar", color: "#8B5CF6" },
 *                   shifts: [
 *                     { date: "2025-08-25", shifts: [] },
 *                     { date: "2025-08-26", shifts: [{ id: 1, start_time: "09:00", end_time: "17:00" }] }
 *                   ]
 *                 }
 *               ]
 *               meta: {
 *                 start_date: "2025-08-25",
 *                 end_date: "2025-08-31",
 *                 total_employees: 1,
 *                 employees_with_shifts: 1,
 *                 total_shifts: 1
 *               }
 */
// RUTA LEGACY mantenida para compatibilidad
router.get('/for-shifts', authMiddleware, adminMiddleware, getEmployeesForShiftsHandler);

/**
 * @openapi
 * /employees:
 *   get:
 *     summary: List employees of the company (LEGACY - Simple)
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data: [ { id: 5, position: "Staff", user: { email: "emp1@example.com" }, role: { name: "Cashier" } } ]
 */
// RUTA EXISTENTE mantenida para compatibilidad
router.get('/', authMiddleware, adminMiddleware, getEmployeesHandler);

/**
 * @openapi
 * /employees/{id}:
 *   get:
 *     summary: Get employee by ID (NEW)
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *         description: Employee ID
 *     responses:
 *       200:
 *         description: OK
 *       404:
 *         description: Employee not found
 */
router.get('/:id', authMiddleware, adminMiddleware, getEmployeeByIdHandler);

/**
 * @openapi
 * /employees/{id}:
 *   put:
 *     summary: Update employee (NEW)
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *         description: Employee ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               role_id: { type: number }
 *               position: { type: string }
 *               is_active: { type: boolean }
 *           examples:
 *             example-1:
 *               value: { role_id: 3, position: "Senior Staff", is_active: true }
 *     responses:
 *       200:
 *         description: OK
 *       404:
 *         description: Employee not found
 */
router.put('/:id', authMiddleware, adminMiddleware, validate_body(update_employee_schema), updateEmployeeHandler);

/**
 * @openapi
 * /employees/{id}:
 *   delete:
 *     summary: Delete employee (NEW - Soft Delete)
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *         description: Employee ID
 *     responses:
 *       200:
 *         description: Employee deleted successfully
 *       404:
 *         description: Employee not found
 */
router.delete('/:id', authMiddleware, adminMiddleware, deleteEmployeeHandler);

export default router;


