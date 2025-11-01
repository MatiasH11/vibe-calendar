import { Router } from 'express';
import { location_controller } from '../controllers/location.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * @openapi
 * /location:
 *   get:
 *     tags: [location]
 *     summary: Get all locations
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
 *         description: List of locations with pagination
 */
router.get('/', location_controller.getAll);

/**
 * @openapi
 * /location/{id}:
 *   get:
 *     tags: [location]
 *     summary: Get location by ID
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
 *         description: location details
 *       404:
 *         description: location not found
 */
router.get('/:id', location_controller.getById);

/**
 * @openapi
 * /location:
 *   post:
 *     tags: [location]
 *     summary: Create new location
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
 *         description: location created successfully
 */
router.post('/', location_controller.create);

/**
 * @openapi
 * /location/{id}:
 *   put:
 *     tags: [location]
 *     summary: Update location
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
 *         description: location updated successfully
 */
router.put('/:id', location_controller.update);

/**
 * @openapi
 * /location/{id}:
 *   delete:
 *     tags: [location]
 *     summary: Delete location (soft delete)
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
 *         description: location deleted successfully
 */
router.delete('/:id', location_controller.delete);

/**
 * @openapi
 * /location/bulk/create:
 *   post:
 *     tags: [location]
 *     summary: Bulk create locations
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
 *         description: locations created successfully
 */
router.post('/bulk/create', location_controller.bulkCreate);

/**
 * @openapi
 * /location/bulk/update:
 *   put:
 *     tags: [location]
 *     summary: Bulk update locations
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
 *         description: locations updated successfully
 */
router.put('/bulk/update', location_controller.bulkUpdate);

/**
 * @openapi
 * /location/bulk/delete:
 *   delete:
 *     tags: [location]
 *     summary: Bulk delete locations
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
 *         description: locations deleted successfully
 */
router.delete('/bulk/delete', location_controller.bulkDelete);

export default router;
