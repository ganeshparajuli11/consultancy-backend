const express = require('express');
const { getAllClasses, getClassById, createClass, updateClass, deactivateClass, deleteClassPermanently, cancelClass, getClassStudents, enrollStudent } = require('../controllers/class/classController');
const authenticateJWT = require('../middleware/auth/authenticate');
const { checkIsAdmin } = require('../middleware/auth/role');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Classes
 *   description: API for managing classes
 */

/**
 * @swagger
 * /api/classes:
 *   get:
 *     summary: Get all active and non-cancelled classes
 *     tags: [Classes]
 *     responses:
 *       200:
 *         description: List of classes
 */
router.get(
  '/',
  getAllClasses
);

/**
 * @swagger
 * /api/classes/{id}:
 *   get:
 *     summary: Get a class by ID
 *     tags: [Classes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Class ID
 *     responses:
 *       200:
 *         description: Class object
 *       404:
 *         description: Class not found
 */
router.get(
  '/:id',
  getClassById
);

/**
 * @swagger
 * /api/classes:
 *   post:
 *     summary: Create a new class
 *     tags: [Classes]
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
 *               - language
 *               - level
 *               - tutor
 *               - schedule
 *             properties:
 *               name:
 *                 type: string
 *               code:
 *                 type: string
 *               description:
 *                 type: string
 *               language:
 *                 type: string
 *               level:
 *                 type: string
 *               section:
 *                 type: string
 *               tutor:
 *                 type: string
 *               schedule:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     day:
 *                       type: string
 *                     startTime:
 *                       type: string
 *                     endTime:
 *                       type: string
 *               capacity:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Class created successfully
 *       400:
 *         description: Validation error
 *       409:
 *         description: Class code already exists
 */
router.post(
  '/',
  authenticateJWT,
  checkIsAdmin,
  createClass
);

/**
 * @swagger
 * /api/classes/{id}:
 *   put:
 *     summary: Update a class by ID
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Class ID
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
 *               language:
 *                 type: string
 *               level:
 *                 type: string
 *               section:
 *                 type: string
 *               tutor:
 *                 type: string
 *               schedule:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     day:
 *                       type: string
 *                     startTime:
 *                       type: string
 *                     endTime:
 *                       type: string
 *               capacity:
 *                 type: integer
 *               isActive:
 *                 type: boolean
 *               isCancelled:
 *                 type: boolean
 *               cancellationReason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Class updated successfully
 *       400:
 *         description: Validation or ID error
 *       404:
 *         description: Class not found
 */
router.put(
  '/:id',
  authenticateJWT,
  checkIsAdmin,
  updateClass
);

/**
 * @swagger
 * /api/classes/{id}:
 *   delete:
 *     summary: Deactivate a class by ID (soft delete)
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Class ID
 *     responses:
 *       200:
 *         description: Class deactivated successfully
 *       404:
 *         description: Class not found
 */
router.delete(
  '/:id',
  authenticateJWT,
  checkIsAdmin,
  deactivateClass
);

/**
 * @swagger
 * /api/classes/{id}/hard:
 *   delete:
 *     summary: Permanently delete a class by ID
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Class ID
 *     responses:
 *       200:
 *         description: Class permanently deleted
 *       404:
 *         description: Class not found
 */
router.delete(
  '/:id/hard',
  authenticateJWT,
  checkIsAdmin,
  deleteClassPermanently
);

/**
 * @swagger
 * /api/classes/{id}/cancel:
 *   patch:
 *     summary: Cancel a class by ID
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Class ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Class cancelled successfully
 *       400:
 *         description: Cancellation reason required or invalid class
 */
router.patch(
  '/:id/cancel',
  authenticateJWT,
  checkIsAdmin,
  cancelClass
);

/**
 * @swagger
 * /api/classes/{id}/students:
 *   get:
 *     summary: Get all students enrolled in a class
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Class ID
 *     responses:
 *       200:
 *         description: List of students
 *       404:
 *         description: Class not found
 */
router.get(
  '/:id/students',
  authenticateJWT,
  checkIsAdmin,
  getClassStudents
);

/**
 * @swagger
 * /api/classes/{id}/enroll:
 *   post:
 *     summary: Enroll a student in a class
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Class ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - studentId
 *             properties:
 *               studentId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Student enrolled successfully
 *       400:
 *         description: Cannot enroll (invalid class or already enrolled)
 */
router.post(
  '/:id/enroll',
  authenticateJWT,
  checkIsAdmin,
  enrollStudent
);

module.exports = router;
