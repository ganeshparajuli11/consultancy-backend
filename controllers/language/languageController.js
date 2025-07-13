// controllers/languageController.js

const Joi = require('joi');
const fs = require('fs');
const Language = require('../../models/languageModel');
const Level = require('../../models/levelModel');
const uploadWithCloudinary = require('../../utils/cloudinaryUploader');
const { Parser } = require('json2csv');
// Validation schema
const createLanguageSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  code: Joi.string()
    .alphanum()
    .min(2)
    .max(10)
    .required()
    .messages({ 'string.alphanum': '"code" may only contain letters and numbers' }),
  flag: Joi.alternatives().try(
    Joi.string().uri(),
    Joi.object()
  ).optional(),
  flag_type: Joi.string().valid('url', 'file').optional(),
  description: Joi.string().allow('').optional(),
  direction: Joi.string().valid('ltr', 'rtl').optional(),
  levels: Joi.array()
    .items(
      Joi.string().hex().length(24)
        .messages({ 'string.hex': 'Invalid level ID' })
    )
    .optional(),
  isActive: Joi.boolean().optional()
});

const updateLanguageSchema = createLanguageSchema
  .fork(['name', 'code', 'levels'], schema => schema.optional());


// Create a new language
async function createLanguage(req, res) {
  // 1️⃣ Validate input
  const { error, value } = createLanguageSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: error.details[0].message }
    });
  }

  try {
    // 2️⃣ Handle flag upload or URL
    if (req.body.flag_type === 'file' && req.file) {
      const secureUrl = await uploadWithCloudinary(req.file);
      value.flag = secureUrl;
      fs.unlinkSync(req.file.path);
    } else if (req.body.flag_type === 'url' && value.flag) {
      // keep as-is
    } else if (!value.flag && value.code) {
      value.flag = `https://flagcdn.com/w80/${value.code.toLowerCase()}.png`;
    }

    // 3️⃣ Create language object
    const language = new Language(value);

    // 4️⃣ Append audit log
    if (req.user?.id) {
      language.auditLogs = [{
        action: 'created',
        userId: req.user.id,
        message: `Language "${language.name}" created.`
      }];
    }

    // 5️⃣ Save language
    await language.save();

    // 6️⃣ Link levels
    if (value.levels?.length) {
      await Level.updateMany(
        { _id: { $in: value.levels } },
        { $set: { language: language._id } }
      );
    }

    return res.status(201).json({ success: true, data: language });

  } catch (err) {
    console.error('Create language error:', err);
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'LANGUAGE_EXISTS',
          message: 'Language name or code already exists.'
        }
      });
    }
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
    const langs = await Language.find(filter).sort('name');
    return res.json({ success: true, data: langs });
  } catch (err) {
    console.error('❌ Fetch languages error:', err); // log actual error
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Unable to fetch languages.',
        reason: err.message // Add this line temporarily
      }
    });
  }
}



// Fetch a single language by ID
async function getLanguageById(req, res) {
  try {
    const lang = await Language.findById(req.params.id);
    if (!lang) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Language not found.' }
      });
    }
    return res.json({ success: true, data: lang });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_ID', message: 'Invalid language ID.' }
      });
    }
    console.error('Fetch language error:', err);
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Unable to fetch language.' }
    });
  }
}



// Update an existing language
async function updateLanguage(req, res) {
  const { error, value } = updateLanguageSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: error.details[0].message }
    });
  }

  try {
    const existing = await Language.findById(req.params.id).select('levels auditLogs');
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Language not found.' }
      });
    }

    if (req.body.flag_type === 'file' && req.file) {
      value.flag = await uploadWithCloudinary(req.file);
      fs.unlinkSync(req.file.path);
    } else if (req.body.flag_type === 'url' && value.flag) {
      // keep URL
    } else if (!value.flag && value.code) {
      value.flag = `https://flagcdn.com/w80/${value.code.toLowerCase()}.png`;
    }

    const updated = await Language.findByIdAndUpdate(
      req.params.id,
      value,
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Language not found.' }
      });
    }

    if (value.levels) {
      const oldIds = existing.levels.map(id => id.toString());
      const newIds = value.levels.map(id => id.toString());
      const toAdd = newIds.filter(id => !oldIds.includes(id));
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

    // 🔍 Add audit log
    if (req.user?.id) {
      updated.auditLogs.push({
        action: 'updated',
        userId: req.user.id,
        message: `Language "${updated.name}" updated.`
      });
      await updated.save();
    }

    return res.json({ success: true, data: updated });
  } catch (err) {
    console.error('Update language error:', err);

    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        error: { code: 'LANGUAGE_EXISTS', message: 'Language exists.' }
      });
    }

    if (err.name === 'ValidationError') {
      const details = Object.values(err.errors).map(e => ({
        field: e.path, message: e.message
      }));
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Language data failed schema validation',
          details
        }
      });
    }

    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Unable to update language.' }
    });
  }
}


async function deleteLanguage(req, res) {
  try {
    const lang = await Language.findById(req.params.id);

    if (!lang) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Language not found.' }
      });
    }

    if (lang.enrolledStudents?.length > 0 || lang.levels?.length > 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'DEPENDENCY_ERROR',
          message: 'Cannot delete language. It is linked to students or levels.'
        }
      });
    }

    lang.isActive = false;

    // 📝 Audit log
    if (req.user?.id) {
      lang.auditLogs.push({
        action: 'deleted',
        userId: req.user.id,
        message: `Language "${lang.name}" marked as deleted.`
      });
    }

    await lang.save();

    return res.json({
      success: true,
      message: 'Language soft-deleted.',
      data: lang
    });
  } catch (err) {
    console.error('Delete language error:', err);
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Unable to delete language.' }
    });
  }
}


// Toggle active status of an employee (Tutor or Counsellor)
async function toggleEmployeeActiveStatus(req, res) {
  const { id } = req.params;
  const { isActive } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, error: 'Invalid employee ID' });
  }

  if (typeof isActive !== 'boolean') {
    return res.status(400).json({
      success: false,
      error: '"isActive" must be a boolean.'
    });
  }

  try {
    const employee = await Employee.findByIdAndUpdate(
      id,
      { isActive },
      { new: true }
    ).select('-password -__v');

    if (!employee) {
      return res.status(404).json({ success: false, error: 'Employee not found.' });
    }

    return res.json({
      success: true,
      message: `${employee.role} "${employee.name}" has been ${isActive ? 'activated' : 'deactivated'}.`,
      data: employee
    });
  } catch (err) {
    console.error('Toggle employee active status error:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to update employee status.'
    });
  }
}


// PATCH /api/languages/:id/active
async function toggleLanguageActiveStatus(req, res) {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ message: '"isActive" must be a boolean.' });
    }

    const language = await Language.findByIdAndUpdate(
      id,
      { isActive },
      { new: true }
    );

    if (!language) {
      return res.status(404).json({ message: 'Language not found.' });
    }

    return res.status(200).json({
      message: `Language "${language.name}" has been ${isActive ? 'activated' : 'deactivated'}.`,
      data: language
    });
  } catch (error) {
    console.error('Toggle language status error:', error);
    return res.status(500).json({ message: 'Failed to update language status', error: error.message });
  }
};

// PATCH /api/languages/bulk-toggle
async function bulkToggleLanguageActiveStatus(req, res) {
  try {
    const { ids, isActive } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'Provide a list of language IDs.' });
    }

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ message: '"isActive" must be a boolean.' });
    }

    const result = await Language.updateMany(
      { _id: { $in: ids } },
      { $set: { isActive } }
    );

    return res.status(200).json({
      message: `Updated ${result.modifiedCount} language(s) successfully.`,
      result
    });
  } catch (error) {
    console.error('Bulk toggle error:', error);
    return res.status(500).json({ message: 'Failed to toggle language status', error: error.message });
  }
};

// 👇 Add inside your controller exports
async function getLanguagesWithLevels(req, res) {
  try {
    const languages = await Language.find()
      .populate('levels', 'name code description isActive') // include specific fields from level
      .sort('name');

    res.status(200).json({ success: true, data: languages });
  } catch (error) {
    console.error('Error fetching languages with levels:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch languages with levels.' });
  }
}

// controllers/languageController.js

async function searchLanguages(req, res) {
  const { query = '', isActive } = req.query;

  const filters = {
    $or: [
      { name: { $regex: query, $options: 'i' } },
      { code: { $regex: query, $options: 'i' } },
      { description: { $regex: query, $options: 'i' } }
    ]
  };

  if (isActive !== undefined) {
    filters.isActive = isActive === 'true';
  }

  try {
    const languages = await Language.find(filters).sort('name');
    res.status(200).json({ success: true, data: languages });
  } catch (error) {
    console.error('Search language error:', error);
    res.status(500).json({ success: false, message: 'Failed to search languages.' });
  }
}

// controllers/languageController.js

async function sortLanguages(req, res) {
  const { sortBy = 'name', order = 'asc' } = req.query;
  const sortOrder = order === 'desc' ? -1 : 1;

  try {
    const languages = await Language.find().sort({ [sortBy]: sortOrder });
    res.status(200).json({ success: true, data: languages });
  } catch (error) {
    console.error('Sort language error:', error);
    res.status(500).json({ success: false, message: 'Failed to sort languages.' });
  }
}

// controllers/languageController.js

async function removeLevelFromLanguage(req, res) {
  const { languageId, levelId } = req.params;

  try {
    const language = await Language.findById(languageId);
    if (!language) {
      return res.status(404).json({ success: false, message: 'Language not found.' });
    }

    const index = language.levels.indexOf(levelId);
    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Level not associated with this language.' });
    }

    language.levels.splice(index, 1);
    await language.save();

    res.status(200).json({ success: true, message: 'Level removed from language.', data: language });
  } catch (err) {
    console.error('Remove level error:', err);
    res.status(500).json({ success: false, message: 'Failed to remove level from language.' });
  }
}

async function exportLanguagesToCSV(req, res) {
  try {
    const languages = await Language.find()
      .populate('levels', 'name code')
      .populate('enrolledStudents', 'name email');

    const fields = ['name', 'code', 'description', 'direction', 'isActive', 'createdAt'];
    const opts = { fields };

    const parser = new Parser(opts);
    const csv = parser.parse(languages.map(lang => ({
      name: lang.name,
      code: lang.code,
      description: lang.description,
      direction: lang.direction,
      isActive: lang.isActive,
      createdAt: lang.createdAt
    })));

    res.header('Content-Type', 'text/csv');
    res.attachment('languages.csv');
    return res.send(csv);

  } catch (err) {
    console.error('Export CSV error:', err);
    res.status(500).json({ success: false, message: 'Failed to export language data.' });
  }
}


module.exports = {
  createLanguage,
  getAllLanguages,
  getLanguageById,
  updateLanguage,
  deleteLanguage,
  toggleEmployeeActiveStatus,
  toggleLanguageActiveStatus,
  bulkToggleLanguageActiveStatus,
  getLanguagesWithLevels,
  searchLanguages,
  sortLanguages,
  removeLevelFromLanguage,
  exportLanguagesToCSV
};
