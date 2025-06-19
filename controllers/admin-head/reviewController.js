const Joi = require('joi');
const mongoose = require('mongoose');
const EmployeeReview = require('../../models/employeeReviewModel');
const { Employee } = require('../../models/employeeModel');
const { User } = require('../../models/userModel');

// Joi Schema
const reviewSchema = Joi.object({
    rating: Joi.number().min(1).max(5).required(),
    comment: Joi.string().allow('').optional(),
    role: Joi.string().valid('Tutor', 'Counsellor').required()
});


// Submit review (ONLY ONCE)
async function submitReview(req, res) {
    const { employeeId } = req.params;
    const reviewer = req.user._id;
    const { rating, comment, role } = req.body;

    // ✅ 1. Validate input
    const { error } = reviewSchema.validate({ rating, comment, role });
    if (error) {
        return res.status(400).json({ success: false, error: error.details[0].message });
    }

    // ✅ 2. Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(employeeId)) {
        return res.status(400).json({ success: false, error: 'Invalid employee ID.' });
    }

    try {
        // ✅ 3. Check reviewer exists
        const userExists = await User.exists({ _id: reviewer });
        if (!userExists) {
            return res.status(404).json({ success: false, error: 'Reviewer not found.' });
        }

        // ✅ 4. Check employee exists
        const employeeExists = await Employee.findOne({ _id: employeeId, role });
        if (!employeeExists) {
            return res.status(404).json({ success: false, error: `${role} not found.` });
        }

        // ✅ 5. Check if user already reviewed this employee
        const alreadyReviewed = await EmployeeReview.findOne({ reviewer, employee: employeeId });

        if (alreadyReviewed) {
            return res.status(409).json({
                success: false,
                error: 'You have already submitted a review. Please update or delete it instead.'
            });
        }

        // ✅ 6. Create review
        const newReview = await EmployeeReview.create({
            reviewer,
            employee: employeeId,
            role,
            rating,
            comment
        });

        return res.status(201).json({ success: true, message: 'Review submitted.', data: newReview });

    } catch (err) {
        console.error('Submit review error:', err);
        return res.status(500).json({ success: false, error: 'Failed to submit review.' });
    }
}

async function updateReview(req, res) {
  const { reviewId } = req.params;
  const reviewer = req.user._id;
  const { rating, comment } = req.body;

  if (!mongoose.Types.ObjectId.isValid(reviewId)) {
    return res.status(400).json({ success: false, error: 'Invalid review ID.' });
  }

  try {
    const review = await EmployeeReview.findOne({ _id: reviewId, reviewer });
    if (!review) {
      return res.status(404).json({ success: false, error: 'Review not found or not owned by you.' });
    }

    review.rating = rating;
    review.comment = comment;
    await review.save();

    return res.json({ success: true, message: 'Review updated.', data: review });
  } catch (err) {
    console.error('Update review error:', err);
    return res.status(500).json({ success: false, error: 'Failed to update review.' });
  }
}

async function deleteReview(req, res) {
    const { reviewId } = req.params;
    const reviewer = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
        return res.status(400).json({ success: false, error: 'Invalid review ID.' });
    }

    try {
        const review = await EmployeeReview.findOneAndDelete({ _id: reviewId, reviewer });

        if (!review) {
            return res.status(404).json({ success: false, error: 'Review not found or not owned by you.' });
        }

        return res.json({ success: true, message: 'Review deleted.' });
    } catch (err) {
        console.error('Delete review error:', err);
        return res.status(500).json({ success: false, error: 'Failed to delete review.' });
    }
}

module.exports = {
    submitReview,
    deleteReview,
    updateReview
};