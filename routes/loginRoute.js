// routes/auth.js

const express = require('express');
const loginController = require('../controllers/authentication/loginController');
const { checkStatus } = require('../middleware/auth/checkStatus');
const router = express.Router();


/**
 * @route   POST /auth/register
 * @desc    Register a new user and send verification email
 * @access  Public
 */
router.post('/login', loginController);

module.exports = router;
