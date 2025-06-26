// routes/noticeRoutes.js
const express = require('express');
const multer = require('multer');
const authenticateJWT = require('../../middleware/auth/authenticate');
const { createNotice, getNotices, markAsRead } = require('../../controllers/notice/noticeController');


const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Notice
 *   description: Endpoints to manage announcements/notices
 */

/**
 * @swagger
 * /api/notices/:
 *   post:
 *     summary: Create a new notice or announcement
 *     tags: [Notice]
 *     security:
 *       - bearerAuth: []
 *     consumes:
 *       - multipart/form-data
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - message
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Festival Holiday Notice"
 *               message:
 *                 type: string
 *                 example: "Langzy will remain closed on Dashain due to the festival."
 *               sendEmail:
 *                 type: boolean
 *                 example: true
 *               poster:
 *                 type: string
 *                 format: binary
 *               targetRoles:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [student, tutor, counsellor, admin, owner]
 *               targetUsers:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: hex
 *               allUsers:
 *                 type: boolean
 *                 example: false
 *     responses:
 *       201:
 *         description: Notice created successfully
 *       400:
 *         description: Validation error
 *       500:
 *         description: Internal server error
 */
const upload = multer({ dest: 'uploads/' }).single('poster');
router.post(
  '/',
  authenticateJWT,
  upload,
  createNotice
);

/**
 * @swagger
 * /api/notices/:
 *   get:
 *     summary: Retrieve all active notices for the current user
 *     tags: [Notice]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Array of notice objects
 *       500:
 *         description: Internal server error
 */
router.get(
  '/',
  authenticateJWT,
  getNotices
);

/**
 * @swagger
 * /notices/{id}/read:
 *   post:
 *     summary: Mark a specific notice as read
 *     tags: [Notice]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the notice to mark as read
 *     responses:
 *       200:
 *         description: Notice marked as read
 *       404:
 *         description: Notice not found
 *       500:
 *         description: Internal server error
 */
router.post(
  '/:id/read',
  authenticateJWT,
  markAsRead
);

module.exports = router;
