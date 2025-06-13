const express = require('express');

const { loginController, adminLoginController } = require('../controllers/authentication/loginController');
const refreshTokenHandler = require('../middleware/auth/refreshTokenHandler');

const router = express.Router();


//    limiter will block repeated clicks/hits from the same IP
router.post('/login',  loginController);
router.post('/admin/login', adminLoginController);

// 2️⃣ Refresh endpoint (uses cookie + middleware to mint new access token)
router.get('/refresh', refreshTokenHandler, (req, res) => {
  return res.status(200).json({ token: res.locals.newAccessToken });
});

module.exports = router;
