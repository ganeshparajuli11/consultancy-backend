const express = require('express');
const { submitReview, updateReview, deleteReview } = require('../../controllers/admin-head/reviewController');


const router = express.Router();

// reviewRoute.js
router.post('/employee/:employeeId/review',  submitReview);
router.put('/review/:reviewId',  updateReview);
router.delete('/review/:reviewId',  deleteReview);

module.exports = router;
