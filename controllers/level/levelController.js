// controllers/levelController.js

const Joi = require('joi');
const Level = require('../../models/levelModel');

// Validation schemas
const createLevelSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  code: Joi.string()
           .pattern(/^[A-Za-z0-9-]+$/)
           .min(1)
           .max(20)
           .required()
           .messages({
             'string.pattern.base': '"code" may only contain letters, numbers, and hyphens'
           }),
  description: Joi.string().allow('').optional(),
  order: Joi.number().integer().min(0).required(),
  language: Joi.string().optional(), // <-- New field
  isActive: Joi.boolean().optional()
});

const updateLevelSchema = Joi.object({
  name: Joi.string().min(1).max(100).optional(),
  code: Joi.string()
           .pattern(/^[A-Za-z0-9-]+$/)
           .min(1)
           .max(20)
           .optional()
           .messages({
             'string.pattern.base': '"code" may only contain letters, numbers, and hyphens'
           }),
  description: Joi.string().allow('').optional(),
  order: Joi.number().integer().min(0).optional(),
  language: Joi.string().optional(), // <-- New field
  isActive: Joi.boolean().optional()
});


// Create a new level
async function createLevel(req, res) {
  // 1️⃣ Joi validation
  const { error, value } = createLevelSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: error.details[0].message }
    });
  }

  try {
    // 2️⃣ Attempt to save to MongoDB
    const level = new Level(value);
    await level.save();
    return res.status(201).json({ success: true, data: level });

  } catch (err) {
    // 3️⃣ Handle duplicate‑key (11000)
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        error: { code: 'LEVEL_EXISTS', message: 'Level name or code already exists.' }
      });
    }

    // 4️⃣ Handle Mongoose validation errors
    if (err.name === 'ValidationError') {
      const fieldErrors = Object.values(err.errors).map(e => ({
        field:   e.path,
        message: e.message
      }));
      return res.status(400).json({
        success: false,
        error: {
          code:    'VALIDATION_ERROR',
          message: 'Level data failed schema validation',
          details: fieldErrors
        }
      });
    }

    console.error('Create level error:', err);
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Unable to create level.' }
    });
  }
}

// Fetch all levels
async function getAllLevels(req, res) {
  const filter = {};
  if (req.query.active) filter.isActive = req.query.active === 'true';
  try {
    const levels = await Level.find(filter).sort('order');
    return res.json({ success: true, data: levels });
  } catch (err) {
    console.error('Fetch levels error:', err);
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Unable to fetch levels.' } });
  }
}

// Fetch a single level by ID
async function getLevelById(req, res) {
  try {
    const level = await Level.findById(req.params.id);
    if (!level) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Level not found.' } });
    }
    return res.json({ success: true, data: level });

  } catch (err) {
    // Handle invalid ObjectId
    if (err.name === 'CastError') {
      return res.status(400).json({ success: false, error: { code: 'INVALID_ID', message: 'Invalid level ID.' } });
    }
    console.error('Fetch level error:', err);
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Unable to fetch level.' } });
  }
}

// Update an existing level
async function updateLevel(req, res) {
  // 1️⃣ Joi validation
  const { error, value } = updateLevelSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: error.details[0].message } });
  }

  try {
    // 2️⃣ Attempt update with runValidators
    const updated = await Level.findByIdAndUpdate(
      req.params.id,
      value,
      { new: true, runValidators: true }
    );
    if (!updated) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Level not found.' } });
    }
    return res.json({ success: true, data: updated });

  } catch (err) {
    // Duplicate key
    if (err.code === 11000) {
      return res.status(409).json({ success: false, error: { code: 'LEVEL_EXISTS', message: 'Level name or code already exists.' } });
    }
    // Mongoose validation
    if (err.name === 'ValidationError') {
      const fieldErrors = Object.values(err.errors).map(e => ({ field: e.path, message: e.message }));
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Level data failed schema validation', details: fieldErrors } });
    }
    // Invalid ID
    if (err.name === 'CastError') {
      return res.status(400).json({ success: false, error: { code: 'INVALID_ID', message: 'Invalid level ID.' } });
    }
    console.error('Update level error:', err);
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Unable to update level.' } });
  }
}

// Soft-delete a level
async function deleteLevel(req, res) {
  try {
    const level = await Level.findById(req.params.id);
    if (!level) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Level not found.' } });
    }
    level.isActive = false;
    await level.save();
    return res.json({ success: true, data: level });

  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ success: false, error: { code: 'INVALID_ID', message: 'Invalid level ID.' } });
    }
    console.error('Delete level error:', err);
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Unable to delete level.' } });
  }
}

module.exports = {
  createLevel,
  getAllLevels,
  getLevelById,
  updateLevel,
  deleteLevel
};
