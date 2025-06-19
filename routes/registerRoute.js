const express = require('express');
const router  = express.Router();

const {
  register,
  adminSignupController,
  checkUsernameAvailability
} = require('../controllers/authentication/register');

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user and send verification email
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - userName
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 example: "John Doe"
 *               userName:
 *                 type: string
 *                 example: "john123"
 *               email:
 *                 type: string
 *                 example: "john@example.com"
 *               password:
 *                 type: string
 *                 example: "StrongPass@123"
 *               language:
 *                 type: string
 *                 example: "665f7cc8c4a6f2ec0d8ba152"
 *               level:
 *                 type: string
 *                 example: "665f7ceac4a6f2ec0d8ba153"
 *     responses:
 *       201:
 *         description: Registration successful, email sent
 *       400:
 *         description: Validation error
 *       409:
 *         description: Email or username already taken
 *       500:
 *         description: Server error
 */
router.post('/register', register);

/**
 * @swagger
 * /auth/admin/register:
 *   post:
 *     summary: Register a new admin account
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Admin User"
 *               email:
 *                 type: string
 *                 example: "admin@example.com"
 *               password:
 *                 type: string
 *                 example: "AdminSecure123"
 *     responses:
 *       201:
 *         description: Admin account created
 *       400:
 *         description: Validation error
 *       409:
 *         description: Email already taken
 *       500:
 *         description: Server error
 */
router.post('/admin/register', adminSignupController);

/**
 * @swagger
 * /auth/check-username:
 *   get:
 *     summary: Check if a username is available
 *     tags: [Auth]
 *     parameters:
 *       - in: query
 *         name: userName
 *         schema:
 *           type: string
 *         required: true
 *         description: Username to check
 *     responses:
 *       200:
 *         description: Availability status and suggestions if unavailable
 *       400:
 *         description: Invalid username format
 */
router.get('/check-username', checkUsernameAvailability);

module.exports = router;
