const Section = require('../../models/sectionModel');
const Language = require('../../models/languageModel');
const Level = require('../../models/levelModel');
const User = require('../../models/userModel');

// ✅ Create a new section
exports.createSection = async (req, res) => {
  try {
    const { name, code, description, language, level, tutor, schedule, capacity } = req.body;

    const section = await Section.create({
      name,
      code: code.toUpperCase(),
      description,
      language,
      level,
      tutor,
      schedule,
      capacity
    });

    res.status(201).json({ message: 'Section created successfully', data: section });
  } catch (error) {
    console.error('Create section error:', error);
    res.status(500).json({ message: 'Failed to create section', error: error.message });
  }
};

// ✅ Get all sections
exports.getAllSections = async (req, res) => {
  try {
    const sections = await Section.find()
      .populate('language', 'name code')
      .populate('level', 'name code')
      .populate('tutor', 'name email');

    res.status(200).json({ data: sections });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch sections', error: error.message });
  }
};

// ✅ Get single section by ID
exports.getSectionById = async (req, res) => {
  try {
    const section = await Section.findById(req.params.id)
      .populate('language', 'name code')
      .populate('level', 'name code')
      .populate('tutor', 'name email');

    if (!section) {
      return res.status(404).json({ message: 'Section not found' });
    }

    res.status(200).json({ data: section });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get section', error: error.message });
  }
};

// ✅ Update section
exports.updateSection = async (req, res) => {
  try {
    const updated = await Section.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!updated) {
      return res.status(404).json({ message: 'Section not found' });
    }

    res.status(200).json({ message: 'Section updated', data: updated });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update section', error: error.message });
  }
};

// ✅ Delete section
exports.deleteSection = async (req, res) => {
  try {
    const deleted = await Section.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ message: 'Section not found' });
    }

    res.status(200).json({ message: 'Section deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete section', error: error.message });
  }
};
