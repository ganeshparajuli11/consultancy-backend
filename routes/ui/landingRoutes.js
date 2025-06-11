const express = require('express');
const { getLandingContent, updateLandingContent } = require('../../controllers/ui/dashboard/landingPage');
const authenticateJWT = require('../../middleware/auth/authenticate');
const { checkIsAdmin } = require('../../middleware/auth/role');
const router = express.Router();


router.get('/landing', getLandingContent);
router.put('/landing',authenticateJWT, checkIsAdmin, updateLandingContent);

module.exports = router;
