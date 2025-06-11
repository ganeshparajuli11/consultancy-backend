// routes/jitsiRoutes.js
const express = require('express');
const router = express.Router();
const { getJitsiToken } = require('../../controllers/videoCall/jitsiController');
const authenticateJWT = require('../../middleware/auth/authenticate');

router.post('/get-token', authenticateJWT, getJitsiToken);

module.exports = router;
