const express = require('express');

const { loginController, adminLoginController } = require('../controllers/authentication/loginController');
const refreshTokenHandler = require('../middleware/auth/refreshTokenHandler');

const router = express.Router();


/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Log in a user with email and password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: "user@example.com"
 *               password:
 *                 type: string
 *                 example: "UserSecure123"
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid email or password
 *       500:
 *         description: Server error
 */
router.post('/login', loginController);
router.post('/admin/login', adminLoginController);

// 2️⃣ Refresh endpoint (uses cookie + middleware to mint new access token)
router.get('/refresh', refreshTokenHandler, (req, res) => {
  return res.status(200).json({ token: res.locals.newAccessToken });
});

module.exports = router;
