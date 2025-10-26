import { Router } from 'express';
import { company_controller } from '../controllers/company.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * @openapi
 * /companys:
 *   get:
 *     tags: [companys]
 *     summary: Get all companys
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
 *         description: List of companys with pagination
 */
router.get('/', company_controller.getAll);

/**
 * @openapi
 * /companys/{id}:
 *   get:
 *     tags: [companys]
 *     summary: Get company by ID
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
 *         description: company details
 *       404:
 *         description: company not found
 */
router.get('/:id', company_controller.getById);

/**
 * @openapi
 * /companys:
 *   post:
 *     tags: [companys]
 *     summary: Create new company
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
 *         description: company created successfully
 */
router.post('/', company_controller.create);

/**
 * @openapi
 * /companys/{id}:
 *   put:
 *     tags: [companys]
 *     summary: Update company
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
 *         description: company updated successfully
 */
router.put('/:id', company_controller.update);

/**
 * @openapi
 * /companys/{id}:
 *   delete:
 *     tags: [companys]
 *     summary: Delete company (soft delete)
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
 *         description: company deleted successfully
 */
router.delete('/:id', company_controller.delete);

/**
 * @openapi
 * /companys/bulk/create:
 *   post:
 *     tags: [companys]
 *     summary: Bulk create companys
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
 *         description: companys created successfully
 */
router.post('/bulk/create', company_controller.bulkCreate);

/**
 * @openapi
 * /companys/bulk/update:
 *   put:
 *     tags: [companys]
 *     summary: Bulk update companys
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
 *         description: companys updated successfully
 */
router.put('/bulk/update', company_controller.bulkUpdate);

/**
 * @openapi
 * /companys/bulk/delete:
 *   delete:
 *     tags: [companys]
 *     summary: Bulk delete companys
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
 *         description: companys deleted successfully
 */
router.delete('/bulk/delete', company_controller.bulkDelete);

export default router;
