const express = require('express');
const {
  getAllLevels,
  getLevelById,
  createLevel,
  updateLevel,
  archiveLevel,
  restoreLevel,
  deleteLevelPermanently
} = require('../controllers/level/levelController');
const authenticateJWT = require('../middleware/auth/authenticate');
const { checkIsAdmin } = require('../middleware/auth/role');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Levels
 *   description: API for managing levels
 */

/**
 * @swagger
 * /api/levels:
 *   get:
 *     summary: Get all levels
 *     tags: [Levels]
 *     parameters:
 *       - in: query
 *         name: active
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *       - in: query
 *         name: includeDeleted
 *         schema:
 *           type: boolean
 *         description: Include archived (soft-deleted) levels
 *     responses:
 *       200:
 *         description: Array of levels
 */
router.get(
  '/',
  getAllLevels
);

/**
 * @swagger
 * /api/levels/{id}:
 *   get:
 *     summary: Get a level by ID
 *     tags: [Levels]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Level ID
 *     responses:
 *       200:
 *         description: Level object
 *       404:
 *         description: Level not found
 */
router.get(
  '/:id',
  getLevelById
);

/**
 * @swagger
 * /api/levels:
 *   post:
 *     summary: Create a new level
 *     tags: [Levels]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - code
 *               - order
 *             properties:
 *               name:
 *                 type: string
 *               code:
 *                 type: string
 *               description:
 *                 type: string
 *               order:
 *                 type: integer
 *               language:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Level created successfully
 *       400:
 *         description: Validation error
 *       409:
 *         description: Level already exists
 */
router.post(
  '/',
  authenticateJWT,
  checkIsAdmin,
  createLevel
);

/**
 * @swagger
 * /api/levels/{id}:
 *   put:
 *     summary: Update a level by ID
 *     tags: [Levels]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Level ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               code:
 *                 type: string
 *               description:
 *                 type: string
 *               order:
 *                 type: integer
 *               language:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Level updated successfully
 *       400:
 *         description: Validation or ID error
 *       404:
 *         description: Level not found
 */
router.put(
  '/:id',
  authenticateJWT,
  checkIsAdmin,
  updateLevel
);

/**
 * @swagger
 * /api/levels/{id}:
 *   delete:
 *     summary: Soft delete (archive) a level by ID
 *     tags: [Levels]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Level ID
 *     responses:
 *       200:
 *         description: Level archived successfully
 *       400:
 *         description: Cannot archive due to dependencies
 *       404:
 *         description: Level not found
 */
router.delete(
  '/:id',
  authenticateJWT,
  checkIsAdmin,
  archiveLevel
);

/**
 * @swagger
 * /api/levels/{id}/restore:
 *   patch:
 *     summary: Restore an archived level
 *     tags: [Levels]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Level ID
 *     responses:
 *       200:
 *         description: Level restored successfully
 *       404:
 *         description: Level not found or not archived
 */
router.patch(
  '/:id/restore',
  authenticateJWT,
  checkIsAdmin,
  restoreLevel
);

/**
 * @swagger
 * /api/levels/{id}/hard:
 *   delete:
 *     summary: Permanently delete a level by ID
 *     tags: [Levels]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Level ID
 *     responses:
 *       200:
 *         description: Level permanently deleted
 *       400:
 *         description: Cannot delete due to dependencies
 *       404:
 *         description: Level not found
 */
router.delete(
  '/:id/hard',
  authenticateJWT,
  checkIsAdmin,
  deleteLevelPermanently
);

module.exports = router;
