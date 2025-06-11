// controllers/landingController.js
const Landing = require('../../../models/ui/landingModel');

exports.getLandingContent = async (req, res) => {
  try {
    const content = await Landing.findOne();
    res.status(200).json({ success: true, data: content });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.updateLandingContent = async (req, res) => {
  try {
    const updates = req.body;
    const content = await Landing.findOneAndUpdate({}, updates, { new: true, upsert: true });
    res.status(200).json({ success: true, data: content });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Update failed' });
  }
};
