const Joi = require('joi');
const jwt = require('jsonwebtoken');
const ClassModel = require('../../models/classModel');
const Section = require('../../models/sectionModel');
const User = require('../../models/userModel');
const { sendVerificationEmail } = require('../../services/emailService');

// Validation schemas
const createClassSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  code: Joi.string().pattern(/^[A-Za-z0-9-]+$/).min(1).max(20).required()
    .messages({ 'string.pattern.base': '"code" may only contain letters, numbers, and hyphens' }),
  description: Joi.string().allow('').optional(),
  language: Joi.string().required(),
  level: Joi.string().required(),
  section: Joi.string().optional(),
  tutor: Joi.string().required(),
  schedule: Joi.array().items(
    Joi.object({
      day: Joi.string().valid('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday').required(),
      startTime: Joi.string().pattern(/^\d{2}:\d{2}$/).required(),
      endTime: Joi.string().pattern(/^\d{2}:\d{2}$/).required()
    })
  ).min(1).required(),
  capacity: Joi.number().integer().min(1).optional(),
});

const updateClassSchema = Joi.object({
  name: Joi.string().min(1).max(100).optional(),
  code: Joi.string().pattern(/^[A-Za-z0-9-]+$/).min(1).max(20).optional()
    .messages({ 'string.pattern.base': '"code" may only contain letters, numbers, and hyphens' }),
  description: Joi.string().allow('').optional(),
  language: Joi.string().optional(),
  level: Joi.string().optional(),
  section: Joi.string().allow(null).optional(),
  tutor: Joi.string().optional(),
  schedule: Joi.array().items(
    Joi.object({
      day: Joi.string().valid('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday').required(),
      startTime: Joi.string().pattern(/^\d{2}:\d{2}$/).required(),
      endTime: Joi.string().pattern(/^\d{2}:\d{2}$/).required()
    })
  ).min(1).optional(),
  capacity: Joi.number().integer().min(1).optional(),
  isActive: Joi.boolean().optional(),
  isCancelled: Joi.boolean().optional(),
  cancellationReason: Joi.string().optional()
});

// Create a new class
async function createClass(req, res) {
  const { error, value } = createClassSchema.validate(req.body);
  if (error) return res.status(400).json({ success: false, error: error.details[0].message });
  try {
    const cls = new ClassModel(value);
    await cls.save();
    return res.status(201).json({ success: true, data: cls });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ success: false, error: 'Class code already exists.' });
    console.error('Create class error:', err);
    return res.status(500).json({ success: false, error: 'Unable to create class.' });
  }
}

// Get all active, non-cancelled classes
async function getAllClasses(req, res) {
  try {
    const classes = await ClassModel.find({ isActive: true, isCancelled: false });
    return res.json({ success: true, data: classes });
  } catch (err) {
    console.error('Fetch classes error:', err);
    return res.status(500).json({ success: false, error: 'Unable to fetch classes.' });
  }
}

// Get single class by ID
async function getClassById(req, res) {
  try {
    const cls = await ClassModel.findById(req.params.id);
    if (!cls) return res.status(404).json({ success: false, error: 'Class not found.' });
    return res.json({ success: true, data: cls });
  } catch (err) {
    if (err.name === 'CastError') return res.status(400).json({ success: false, error: 'Invalid class ID.' });
    console.error('Fetch class error:', err);
    return res.status(500).json({ success: false, error: 'Unable to fetch class.' });
  }
}

// Update class
async function updateClass(req, res) {
  const { error, value } = updateClassSchema.validate(req.body);
  if (error) return res.status(400).json({ success: false, error: error.details[0].message });
  try {
    const updated = await ClassModel.findByIdAndUpdate(req.params.id, value, { new: true, runValidators: true });
    if (!updated) return res.status(404).json({ success: false, error: 'Class not found.' });
    return res.json({ success: true, data: updated });
  } catch (err) {
    if (err.name === 'ValidationError' || err.name === 'CastError') return res.status(400).json({ success: false, error: err.message });
    console.error('Update class error:', err);
    return res.status(500).json({ success: false, error: 'Unable to update class.' });
  }
}

// Soft delete (deactivate) a class
async function deactivateClass(req, res) {
  try {
    const cls = await ClassModel.findById(req.params.id);
    if (!cls) return res.status(404).json({ success: false, error: 'Class not found.' });
    cls.isActive = false;
    await cls.save();
    return res.json({ success: true, data: cls });
  } catch (err) {
    if (err.name === 'CastError') return res.status(400).json({ success: false, error: 'Invalid class ID.' });
    console.error('Deactivate class error:', err);
    return res.status(500).json({ success: false, error: 'Unable to deactivate class.' });
  }
}

// Permanent delete a class
async function deleteClassPermanently(req, res) {
  try {
    const cls = await ClassModel.findById(req.params.id);
    if (!cls) return res.status(404).json({ success: false, error: 'Class not found.' });
    await ClassModel.findByIdAndDelete(req.params.id);
    return res.json({ success: true, message: 'Class permanently deleted.' });
  } catch (err) {
    if (err.name === 'CastError') return res.status(400).json({ success: false, error: 'Invalid class ID.' });
    console.error('Delete class error:', err);
    return res.status(500).json({ success: false, error: 'Unable to delete class.' });
  }
}

// Cancel class
async function cancelClass(req, res) {
  const { reason } = req.body;
  if (!reason) return res.status(400).json({ success: false, error: 'Cancellation reason required.' });
  try {
    const cls = await ClassModel.findById(req.params.id);
    if (!cls) return res.status(404).json({ success: false, error: 'Class not found.' });
    cls.isCancelled = true;
    cls.cancellationReason = reason;
    await cls.save();
    // notify enrolled students
    const students = await User.find({ _id: { $in: cls.enrolledStudents } });
    for (const student of students) {
      const token = jwt.sign({ classId: cls._id, studentId: student._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
      await sendVerificationEmail(student.email, token);
    }
    return res.json({ success: true, data: cls });
  } catch (err) {
    if (err.name === 'CastError') return res.status(400).json({ success: false, error: 'Invalid class ID.' });
    console.error('Cancel class error:', err);
    return res.status(500).json({ success: false, error: 'Unable to cancel class.' });
  }
}

// Get all students in a class
async function getClassStudents(req, res) {
  try {
    const cls = await ClassModel.findById(req.params.id).populate('enrolledStudents', 'name email');
    if (!cls) return res.status(404).json({ success: false, error: 'Class not found.' });
    return res.json({ success: true, data: cls.enrolledStudents });
  } catch (err) {
    if (err.name === 'CastError') return res.status(400).json({ success: false, error: 'Invalid class ID.' });
    console.error('Fetch students error:', err);
    return res.status(500).json({ success: false, error: 'Unable to fetch students.' });
  }
}

// Enroll student in a class
async function enrollStudent(req, res) {
  const { studentId } = req.body;
  try {
    const cls = await ClassModel.findById(req.params.id);
    if (!cls || !cls.isActive || cls.isCancelled) return res.status(400).json({ success: false, error: 'Cannot enroll in this class.' });
    if (cls.enrolledStudents.includes(studentId)) return res.status(409).json({ success: false, error: 'Student already enrolled.' });
    cls.enrolledStudents.push(studentId);
    await cls.save();
    const student = await User.findById(studentId);
    if (student) {
      const token = jwt.sign({ classId: cls._id, studentId }, process.env.JWT_SECRET, { expiresIn: '7d' });
      await sendVerificationEmail(student.email, token);
    }
    return res.json({ success: true, data: cls });
  } catch (err) {
    if (err.name === 'CastError') return res.status(400).json({ success: false, error: 'Invalid class ID or student ID.' });
    console.error('Enroll student error:', err);
    return res.status(500).json({ success: false, error: 'Unable to enroll student.' });
  }
}

module.exports = {
  createClass,
  getAllClasses,
  getClassById,
  updateClass,
  deactivateClass,
  deleteClassPermanently,
  cancelClass,
  getClassStudents,
  enrollStudent
};
