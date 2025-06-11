
const express = require('express');
const { getAllLevels, getLevelById, createLevel, updateLevel, deleteLevel } = require('../controllers/level/levelController');
const router = express.Router();


// Public endpoints (authenticated users)
router.get(
    '/',
    getAllLevels
);

router.get(
    '/:id',
    getLevelById
);

// Protected endpoints (owner/admin only)
router.post(
    '/',
    createLevel
);

router.put(
    '/:id',
    updateLevel
);

router.delete(
    '/:id',
    deleteLevel
);

module.exports = router;
