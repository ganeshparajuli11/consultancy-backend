const Enrollment = require('../../models/Enrollment');

const checkEnrollment = async (req, res, next) => {
  try {
    const sectionId = req.params.sectionId;

    const isEnrolled = await Enrollment.findOne({
      section: sectionId,
      student: req.user.id,
      status: { $in: ['active', 'paid'] } // adjust as needed
    });

    if (!isEnrolled) {
      return res.status(403).json({ message: "You are not enrolled in this section" });
    }

    next();
  } catch (err) {
    next(err);
  }
};

module.exports = checkEnrollment;
