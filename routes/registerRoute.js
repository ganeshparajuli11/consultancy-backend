// routes/auth.js

const express = require('express');
const router = express.Router();
const { register, checkUsernameAvailability, adminSignupController } = require('../controllers/authentication/register');


/**
 * @route   POST /auth/register
 * @desc    Register a new user and send verification email
 * @access  Public
 */
router.post('/register', register);
router.post('/admin/register', adminSignupController);


/**
 * @route   GET /auth/check-username?userName=example
 * @desc    Check if a username is available, return suggestions if taken
 * @access  Public
 */
router.get('/check-username', checkUsernameAvailability);

module.exports = router;
