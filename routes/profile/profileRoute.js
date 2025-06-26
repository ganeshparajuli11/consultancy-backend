// routes/profileRoutes.js
const express = require('express');
const multer = require('multer');
const authenticateJWT = require('../../middleware/auth/authenticate');
const { updatePassword, updateUsername, updateProfile, requestEmailChange, verifyEmailChange } = require('../../controllers/user/profileController');


const upload = multer({ dest: 'uploads/' });
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Profile
 *   description: User profile management
 */

/**
 * @swagger
 * /user/profile/password:
 *   put:
 *     summary: Change user password
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - oldPassword
 *               - newPassword
 *             properties:
 *               oldPassword:
 *                 type: string
 *                 example: "OldPass123"
 *               newPassword:
 *                 type: string
 *                 example: "NewSecurePass456"
 *     responses:
 *       200:
 *         description: Password updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Invalid credentials
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.put(
  '/profile/password',
  authenticateJWT,
  updatePassword
);

/**
 * @swagger
 * /user/profile/username:
 *   put:
 *     summary: Change user username
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userName
 *             properties:
 *               userName:
 *                 type: string
 *                 example: "newusername123"
 *     responses:
 *       200:
 *         description: Username updated successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: User not found
 *       409:
 *         description: Username taken (includes suggestions)
 *       500:
 *         description: Internal server error
 */
router.put(
  '/profile/username',
  authenticateJWT,
  updateUsername
);

/**
 * @swagger
 * /user/profile:
 *   put:
 *     summary: Update user profile (name, language, level, profile image)
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     consumes:
 *       - multipart/form-data
 *     requestBody:
 *       required: false
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "John Doe"
 *               language:
 *                 type: string
 *                 example: "60d21b2f9d1e8e5a7c8b4567"
 *               level:
 *                 type: string
 *                 example: "60d21b3f9d1e8e5a7c8b4568"
 *               profileImage:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         description: Validation error or malformed data
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.put(
  '/profile',
  authenticateJWT,
  upload.single('profileImage'),
  updateProfile
);

/**
 * @swagger
 * /user/profile/email/request:
 *   post:
 *     summary: Request an OTP to change email
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - newEmail
 *             properties:
 *               newEmail:
 *                 type: string
 *                 format: email
 *                 example: "new@example.com"
 *     responses:
 *       200:
 *         description: OTP sent to the new email address
 *       400:
 *         description: Validation error
 *       404:
 *         description: User not found
 *       409:
 *         description: Email already in use
 *       500:
 *         description: Internal server error
 */
router.post(
  '/profile/email/request',
  authenticateJWT,
  requestEmailChange
);

/**
 * @swagger
 * /user/profile/email/verify:
 *   post:
 *     summary: Verify OTP and finalize email change
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - newEmail
 *               - otp
 *             properties:
 *               newEmail:
 *                 type: string
 *                 format: email
 *                 example: "new@example.com"
 *               otp:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Email updated successfully
 *       400:
 *         description: Validation error, mismatched email, invalid or expired OTP
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.post(
  '/profile/email/verify',
  authenticateJWT,
  verifyEmailChange
);

module.exports = router;
