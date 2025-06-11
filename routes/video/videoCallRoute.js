const express = require('express');
const authenticateJWT = require('../../middleware/auth/authenticate');
const { createVideoRoom, getSessionBySectionId, startSession } = require('../../controllers/videoCall/videoController');

const router = express.Router();


router.post('/create-room', authenticateJWT, createVideoRoom);

router.get('/session/:sectionId',authenticateJWT, getSessionBySectionId);
// Start session (tutor/admin only)
router.post('/start-session', authenticateJWT, startSession);

module.exports = router;
