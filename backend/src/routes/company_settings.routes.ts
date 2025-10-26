import { Router } from 'express';
import { company_settings_controller } from '../controllers/company_settings.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * @openapi
 * /company_settings:
 *   get:
 *     tags: [company_settings]
 *     summary: Get all company_settingss
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
 *         description: List of company_settingss with pagination
 */
router.get('/', company_settings_controller.getAll);

/**
 * @openapi
 * /company_settings/{id}:
 *   get:
 *     tags: [company_settings]
 *     summary: Get company_settings by ID
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
 *         description: company_settings details
 *       404:
 *         description: company_settings not found
 */
router.get('/:id', company_settings_controller.getById);

/**
 * @openapi
 * /company_settings:
 *   post:
 *     tags: [company_settings]
 *     summary: Create new company_settings
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
 *         description: company_settings created successfully
 */
router.post('/', company_settings_controller.create);

/**
 * @openapi
 * /company_settings/{id}:
 *   put:
 *     tags: [company_settings]
 *     summary: Update company_settings
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
 *         description: company_settings updated successfully
 */
router.put('/:id', company_settings_controller.update);

/**
 * @openapi
 * /company_settings/{id}:
 *   delete:
 *     tags: [company_settings]
 *     summary: Delete company_settings (soft delete)
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
 *         description: company_settings deleted successfully
 */
router.delete('/:id', company_settings_controller.delete);

/**
 * @openapi
 * /company_settings/bulk/create:
 *   post:
 *     tags: [company_settings]
 *     summary: Bulk create company_settingss
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
 *         description: company_settingss created successfully
 */
router.post('/bulk/create', company_settings_controller.bulkCreate);

/**
 * @openapi
 * /company_settings/bulk/update:
 *   put:
 *     tags: [company_settings]
 *     summary: Bulk update company_settingss
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
 *         description: company_settingss updated successfully
 */
router.put('/bulk/update', company_settings_controller.bulkUpdate);

/**
 * @openapi
 * /company_settings/bulk/delete:
 *   delete:
 *     tags: [company_settings]
 *     summary: Bulk delete company_settingss
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
 *         description: company_settingss deleted successfully
 */
router.delete('/bulk/delete', company_settings_controller.bulkDelete);

export default router;
