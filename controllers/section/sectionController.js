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

// Activate/Deactivate section
exports.toggleSectionActiveStatus = async (req, res) => {
  try {
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ message: '"isActive" must be a boolean.' });
    }

    const updated = await Section.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: 'Section not found' });
    }

    res.status(200).json({
      message: `Section "${updated.name}" has been ${isActive ? 'activated' : 'deactivated'}.`,
      data: updated
    });
  } catch (error) {
    console.error('Toggle section status error:', error);
    res.status(500).json({ message: 'Failed to update section status', error: error.message });
  }
};

// Enroll a student into a section
exports.enrollStudentInSection = async (req, res) => {
  const { id } = req.params; // section ID
  const { studentId } = req.body;

  if (!studentId) {
    return res.status(400).json({ message: 'studentId is required.' });
  }

  try {
    const section = await Section.findById(id);
    if (!section) {
      return res.status(404).json({ message: 'Section not found.' });
    }

    // Check if already enrolled
    if (section.enrolledStudents.includes(studentId)) {
      return res.status(409).json({ message: 'Student already enrolled in this section.' });
    }

    // Check capacity
    if (section.enrolled >= section.capacity) {
      return res.status(400).json({ message: 'Section is full. Cannot enroll more students.' });
    }

    // Enroll the student
    section.enrolledStudents.push(studentId);
    section.enrolled += 1;

    // 🔔 Auto-toggle capacity alert
    const threshold = Math.ceil(section.capacity * 0.9);
    section.capacityAlert = section.enrolled >= threshold;

    await section.save();

    res.status(200).json({
      message: 'Student enrolled successfully.',
      data: {
        sectionId: section._id,
        enrolled: section.enrolled,
        totalCapacity: section.capacity,
        capacityAlert: section.capacityAlert
      },
      alert: section.capacityAlert ? '⚠️ Section is 90% full!' : undefined
    });
  } catch (error) {
    console.error('Enroll student error:', error);
    res.status(500).json({ message: 'Failed to enroll student.', error: error.message });
  }
};


// Remove a student from a section
exports.removeStudentFromSection = async (req, res) => {
  const { id } = req.params; // section ID
  const { studentId } = req.body;

  if (!studentId) {
    return res.status(400).json({ message: 'studentId is required.' });
  }

  try {
    const section = await Section.findById(id);
    if (!section) {
      return res.status(404).json({ message: 'Section not found.' });
    }

    const index = section.enrolledStudents.indexOf(studentId);
    if (index === -1) {
      return res.status(404).json({ message: 'Student not enrolled in this section.' });
    }

    // Remove the student
    section.enrolledStudents.splice(index, 1);
    section.enrolled = Math.max(0, section.enrolled - 1);

    // 🔁 Recalculate capacity alert after removal
    const alertThreshold = Math.ceil(section.capacity * 0.9);
    section.capacityAlert = section.enrolled >= alertThreshold;

    await section.save();

    res.status(200).json({
      message: 'Student removed from section.',
      data: {
        sectionId: section._id,
        enrolled: section.enrolled,
        capacityAlert: section.capacityAlert
      }
    });
  } catch (error) {
    console.error('Remove student error:', error);
    res.status(500).json({ message: 'Failed to remove student.', error: error.message });
  }
};


// Transfer students (all or selected) from one section to another
exports.transferStudentsBetweenSections = async (req, res) => {
  const { fromSectionId, toSectionId, studentIds, transferAll } = req.body;

  if (!fromSectionId || !toSectionId) {
    return res.status(400).json({ message: 'Both fromSectionId and toSectionId are required.' });
  }

  if (fromSectionId === toSectionId) {
    return res.status(400).json({ message: 'Cannot transfer to the same section.' });
  }

  try {
    const fromSection = await Section.findById(fromSectionId);
    const toSection = await Section.findById(toSectionId);

    if (!fromSection || !toSection) {
      return res.status(404).json({ message: 'One or both sections not found.' });
    }

    // Determine students to transfer
    let studentsToTransfer;
    if (transferAll) {
      studentsToTransfer = [...fromSection.enrolledStudents];
    } else if (Array.isArray(studentIds)) {
      studentsToTransfer = studentIds.filter(id =>
        fromSection.enrolledStudents.includes(id)
      );
    } else {
      return res.status(400).json({ message: 'Either transferAll must be true or studentIds must be provided.' });
    }

    // Check capacity
    const availableSpots = toSection.capacity - toSection.enrolled;
    if (studentsToTransfer.length > availableSpots) {
      return res.status(400).json({
        message: `Cannot transfer. Target section only has ${availableSpots} spots.`
      });
    }

    // Perform transfer
    fromSection.enrolledStudents = fromSection.enrolledStudents.filter(
      id => !studentsToTransfer.includes(id.toString())
    );
    fromSection.enrolled = fromSection.enrolledStudents.length;

    studentsToTransfer.forEach(id => {
      if (!toSection.enrolledStudents.includes(id)) {
        toSection.enrolledStudents.push(id);
      }
    });
    toSection.enrolled = toSection.enrolledStudents.length;

    await fromSection.save();
    await toSection.save();

    res.status(200).json({
      message: 'Students transferred successfully.',
      data: {
        fromSection: { id: fromSection._id, enrolled: fromSection.enrolled },
        toSection: { id: toSection._id, enrolled: toSection.enrolled },
        transferredCount: studentsToTransfer.length
      }
    });
  } catch (error) {
    console.error('Transfer students error:', error);
    res.status(500).json({ message: 'Failed to transfer students.', error: error.message });
  }
};

// Get all students enrolled in a section
exports.getSectionStudents = async (req, res) => {
  try {
    const section = await Section.findById(req.params.id)
      .populate('enrolledStudents', 'name email profilePicture');

    if (!section) {
      return res.status(404).json({ message: 'Section not found.' });
    }

    res.status(200).json({
      message: 'Students fetched successfully.',
      students: section.enrolledStudents,
      count: section.enrolledStudents.length
    });
  } catch (error) {
    console.error('Get section students error:', error);
    res.status(500).json({ message: 'Failed to fetch students.', error: error.message });
  }
};

// Get summary info about a section
exports.getSectionSummary = async (req, res) => {
  try {
    const section = await Section.findById(req.params.id)
      .populate('language', 'name code')
      .populate('level', 'name code')
      .populate('tutor', 'name email');

    if (!section) {
      return res.status(404).json({ message: 'Section not found.' });
    }

    res.status(200).json({
      success: true,
      data: {
        name: section.name,
        code: section.code,
        description: section.description,
        language: section.language,
        level: section.level,
        tutor: section.tutor,
        schedule: section.schedule,
        capacity: section.capacity,
        enrolled: section.enrolled,
        isActive: section.isActive
      }
    });
  } catch (error) {
    console.error('Get section summary error:', error);
    res.status(500).json({ message: 'Failed to get section summary.', error: error.message });
  }
};

// Archive (soft delete) a section
exports.archiveSection = async (req, res) => {
  try {
    const section = await Section.findByIdAndUpdate(
      req.params.id,
      {
        isArchived: true,
        $push: {
          changeHistory: {
            action: 'archived',
            user: req.user.id,
            message: 'Section archived'
          }
        }
      },
      { new: true }
    );

    if (!section) {
      return res.status(404).json({ message: 'Section not found' });
    }

    res.status(200).json({ message: 'Section archived successfully', data: section });
  } catch (error) {
    console.error('Archive section error:', error);
    res.status(500).json({ message: 'Failed to archive section', error: error.message });
  }
};
