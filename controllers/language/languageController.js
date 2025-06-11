// controllers/languageController.js

const Joi = require('joi');
const Language = require('../../models/languageModel');
const Level    = require('../../models/levelModel');

// Validation schemas (unchanged except allowing levels)
const createLanguageSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  code: Joi.string()
    .alphanum()
    .min(2)
    .max(10)
    .required()
    .messages({ 'string.alphanum': '"code" may only contain letters and numbers' }),
  description: Joi.string().allow('').optional(),
  direction: Joi.string().valid('ltr', 'rtl').optional(),
  levels: Joi.array()
    .items(
      Joi.string()
        .hex()
        .length(24)
        .messages({ 'string.hex': 'Invalid level ID' })
    )
    .optional(),
  isActive: Joi.boolean().optional()
});



const updateLanguageSchema = createLanguageSchema.fork(['name','code','levels'], schema => schema.optional());
// Create a new language
async function createLanguage(req, res) {
  // 1️⃣ Validate
  const { error, value } = createLanguageSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: error.details[0].message }
    });
  }

  try {
    // 2️⃣ Save Language
    const language = new Language(value);
    await language.save();

    // 3️⃣ If levels provided, link them
    if (value.levels && value.levels.length) {
      await Level.updateMany(
        { _id: { $in: value.levels } },
        { $set: { language: language._id } }
      );
    }

    return res.status(201).json({ success: true, data: language });

  } catch (err) {
    // duplicate-key
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        error: { code: 'LANGUAGE_EXISTS', message: 'Language name or code already exists.' }
      });
    }
    // mongoose validation
    if (err.name === 'ValidationError') {
      const fieldErrors = Object.values(err.errors).map(e => ({
        field: e.path,
        message: e.message
      }));
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Language data failed schema validation',
          details: fieldErrors
        }
      });
    }
    console.error('Create language error:', err);
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Unable to create language.' }
    });
  }
}


// Fetch all languages
async function getAllLanguages(req, res) {
  const filter = {};
  if (req.query.active) filter.isActive = req.query.active === 'true';
  try {
    const languages = await Language.find(filter).sort('name');
    return res.json({ success: true, data: languages });
  } catch (err) {
    console.error('Fetch languages error:', err);
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Unable to fetch languages.' } });
  }
}

// Fetch a single language by ID
async function getLanguageById(req, res) {
  try {
    const language = await Language.findById(req.params.id);
    if (!language) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Language not found.' } });
    }
    return res.json({ success: true, data: language });

  } catch (err) {
    // Invalid ObjectId
    if (err.name === 'CastError') {
      return res.status(400).json({ success: false, error: { code: 'INVALID_ID', message: 'Invalid language ID.' } });
    }
    console.error('Fetch language error:', err);
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Unable to fetch language.' } });
  }
}

// Update an existing language
async function updateLanguage(req, res) {
  // 1️⃣ Validate
  const { error, value } = updateLanguageSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ 
      success: false, 
      error: { code: 'VALIDATION_ERROR', message: error.details[0].message } 
    });
  }

  try {
    // 2️⃣ Fetch existing for diff
    const existing = await Language.findById(req.params.id).select('levels');
    if (!existing) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Language not found.' } });
    }

    // 3️⃣ Update language doc
    const updated = await Language.findByIdAndUpdate(
      req.params.id,
      value,
      { new: true, runValidators: true }
    );
    if (!updated) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Language not found.' } });
    }

    // 4️⃣ Sync Level.language refs if levels changed
    if (value.levels) {
      const oldIds = existing.levels.map(id => id.toString());
      const newIds = value.levels.map(id => id.toString());

      const toAdd    = newIds.filter(id => !oldIds.includes(id));
      const toRemove = oldIds.filter(id => !newIds.includes(id));

      if (toAdd.length) {
        await Level.updateMany(
          { _id: { $in: toAdd } },
          { $set: { language: updated._id } }
        );
      }
      if (toRemove.length) {
        await Level.updateMany(
          { _id: { $in: toRemove } },
          { $unset: { language: "" } }
        );
      }
    }

    return res.json({ success: true, data: updated });

  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ success: false, error: { code: 'LANGUAGE_EXISTS', message: 'Language name or code already exists.' } });
    }
    if (err.name === 'ValidationError') {
      const fieldErrors = Object.values(err.errors).map(e => ({ field: e.path, message: e.message }));
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Language data failed schema validation', details: fieldErrors } });
    }
    if (err.name === 'CastError') {
      return res.status(400).json({ success: false, error: { code: 'INVALID_ID', message: 'Invalid language ID.' } });
    }
    console.error('Update language error:', err);
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Unable to update language.' } });
  }
}

// Soft-delete a language
async function deleteLanguage(req, res) {
  try {
    const language = await Language.findById(req.params.id);
    if (!language) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Language not found.' } });
    }
    language.isActive = false;
    await language.save();
    return res.json({ success: true, data: language });

  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ success: false, error: { code: 'INVALID_ID', message: 'Invalid language ID.' } });
    }
    console.error('Delete language error:', err);
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Unable to delete language.' } });
  }
}

module.exports = {
  createLanguage,
  getAllLanguages,
  getLanguageById,
  updateLanguage,
  deleteLanguage
};
