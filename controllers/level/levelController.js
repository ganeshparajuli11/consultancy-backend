const Joi = require('joi');
const Level = require('../../models/levelModel');
const Language = require('../../models/languageModel');
const Section = require('../../models/sectionModel'); // for dependency checks

// Validation schemas
const createLevelSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  code: Joi.string().pattern(/^[A-Za-z0-9-]+$/).min(1).max(20).required()
       .messages({ 'string.pattern.base': '"code" may only contain letters, numbers, and hyphens' }),
  description: Joi.string().allow('').optional(),
  order: Joi.number().integer().min(0).required(),
  language: Joi.string().optional(),
  isActive: Joi.boolean().optional()
});

const updateLevelSchema = Joi.object({
  name: Joi.string().min(1).max(100).optional(),
  code: Joi.string().pattern(/^[A-Za-z0-9-]+$/).min(1).max(20).optional()
       .messages({ 'string.pattern.base': '"code" may only contain letters, numbers, and hyphens' }),
  description: Joi.string().allow('').optional(),
  order: Joi.number().integer().min(0).optional(),
  language: Joi.string().allow(null).optional(),
  isActive: Joi.boolean().optional()
});

// Helper to log audit for Level and Language
async function logAction(doc, action, userId, message = '') {
  doc.auditLogs.push({ action, userId, message });
  await doc.save();
}

// Create a new level
async function createLevel(req, res) {
  const { error, value } = createLevelSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ success: false, error: error.details[0].message });
  }

  try {
    const level = new Level(value);
    await level.save();
    // audit
    await logAction(level, 'created', req.user.id, 'Level created');

    // link to language
    if (value.language) {
      const lang = await Language.findById(value.language);
      if (lang) {
        lang.levels.push(level._id);
        await logAction(lang, 'level_added', req.user.id, `Level ${level._id} added`);
      }
    }

    return res.status(201).json({ success: true, data: level });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ success: false, error: 'Level name or code already exists.' });
    }
    if (err.name === 'ValidationError') {
      return res.status(400).json({ success: false, error: err.message });
    }
    console.error(err);
    return res.status(500).json({ success: false, error: 'Unable to create level.' });
  }
}

// Get all levels (including deleted if requested)
async function getAllLevels(req, res) {
  const { active, includeDeleted } = req.query;
  const filter = {};
  if (active !== undefined) filter.isActive = active === 'true';
  if (!includeDeleted) filter.isDeleted = false;

  try {
    const levels = await Level.find(filter).sort('order');
    return res.json({ success: true, data: levels });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Unable to fetch levels.' });
  }
}

// Get single level
async function getLevelById(req, res) {
  try {
    const level = await Level.findById(req.params.id);
    if (!level || level.isDeleted) {
      return res.status(404).json({ success: false, error: 'Level not found.' });
    }
    return res.json({ success: true, data: level });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ success: false, error: 'Invalid level ID.' });
    }
    console.error(err);
    return res.status(500).json({ success: false, error: 'Unable to fetch level.' });
  }
}

// Update existing level
async function updateLevel(req, res) {
  const { error, value } = updateLevelSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ success: false, error: error.details[0].message });
  }

  try {
    const level = await Level.findById(req.params.id);
    if (!level || level.isDeleted) {
      return res.status(404).json({ success: false, error: 'Level not found.' });
    }

    const oldLang = level.language?.toString();
    Object.assign(level, value);
    await level.save();
    await logAction(level, 'updated', req.user.id, 'Level updated');

    // Handle language change
    if (value.language !== undefined) {
      const newLangId = value.language;
      if (oldLang && oldLang !== newLangId) {
        const oldLangDoc = await Language.findById(oldLang);
        if (oldLangDoc) {
          oldLangDoc.levels.pull(level._id);
          await logAction(oldLangDoc, 'level_removed', req.user.id, `Level ${level._id} removed`);
        }
      }
      if (newLangId) {
        const newLangDoc = await Language.findById(newLangId);
        if (newLangDoc && !newLangDoc.levels.includes(level._id)) {
          newLangDoc.levels.push(level._id);
          await logAction(newLangDoc, 'level_added', req.user.id, `Level ${level._id} added`);
        }
      }
    }

    return res.json({ success: true, data: level });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ success: false, error: 'Level code or name already exists.' });
    }
    if (err.name === 'ValidationError') {
      return res.status(400).json({ success: false, error: err.message });
    }
    console.error(err);
    return res.status(500).json({ success: false, error: 'Unable to update level.' });
  }
}

// Soft delete (archive)
async function archiveLevel(req, res) {
  try {
    const level = await Level.findById(req.params.id);
    if (!level || level.isDeleted) {
      return res.status(404).json({ success: false, error: 'Level not found.' });
    }
    // Prevent if sections exist
    const linked = await Section.exists({ level: level._id });
    if (linked) {
      return res.status(400).json({ success: false, error: 'Cannot archive: level is in use.' });
    }
    level.isDeleted = true;
    level.deletedAt = new Date();
    level.deletedBy = req.user.id;
    await level.save();
    await logAction(level, 'soft_deleted', req.user.id, 'Level archived');

    // remove from language
    if (level.language) {
      const lang = await Language.findById(level.language);
      if (lang) {
        lang.levels.pull(level._id);
        await logAction(lang, 'level_removed', req.user.id, `Level ${level._id} archived`);
      }
    }
    return res.json({ success: true, data: level });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ success: false, error: 'Invalid level ID.' });
    }
    console.error(err);
    return res.status(500).json({ success: false, error: 'Unable to archive level.' });
  }
}

// Restore archived level
async function restoreLevel(req, res) {
  try {
    const level = await Level.findById(req.params.id);
    if (!level || !level.isDeleted) {
      return res.status(404).json({ success: false, error: 'Level not found or not archived.' });
    }
    level.isDeleted = false;
    level.deletedAt = null;
    level.deletedBy = null;
    await level.save();
    await logAction(level, 'restored', req.user.id, 'Level restored');

    // add back to language
    if (level.language) {
      const lang = await Language.findById(level.language);
      if (lang && !lang.levels.includes(level._id)) {
        lang.levels.push(level._id);
        await logAction(lang, 'level_added', req.user.id, `Level ${level._id} restored`);
      }
    }
    return res.json({ success: true, data: level });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ success: false, error: 'Invalid level ID.' });
    }
    console.error(err);
    return res.status(500).json({ success: false, error: 'Unable to restore level.' });
  }
}

// Hard delete (permanent)
async function deleteLevelPermanently(req, res) {
  try {
    const level = await Level.findById(req.params.id);
    if (!level) {
      return res.status(404).json({ success: false, error: 'Level not found.' });
    }
    // Prevent if sections exist
    const linked = await Section.exists({ level: level._id });
    if (linked) {
      return res.status(400).json({ success: false, error: 'Cannot delete: level is in use.' });
    }
    // remove from language
    if (level.language) {
      const lang = await Language.findById(level.language);
      if (lang) {
        lang.levels.pull(level._id);
        await logAction(lang, 'level_removed', req.user.id, `Level ${level._id} permanently deleted`);
      }
    }
    await logAction(level, 'permanent_deleted', req.user.id, 'Level permanently deleted');
    await Level.findByIdAndDelete(level._id);
    return res.json({ success: true, message: 'Level permanently deleted.' });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ success: false, error: 'Invalid level ID.' });
    }
    console.error(err);
    return res.status(500).json({ success: false, error: 'Unable to delete level permanently.' });
  }
}

module.exports = {
  createLevel,
  getAllLevels,
  getLevelById,
  updateLevel,
  archiveLevel,
  restoreLevel,
  deleteLevelPermanently
};
