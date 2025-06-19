const Joi = require('joi');
const fs = require('fs');
const { Tutor, Counsellor } = require('../../models/employeeModel');
const uploadWithCloudinary = require('../../utils/cloudinaryUploader');
const argon2 = require('argon2');
const { Employee } = require('../../models/employeeModel');

// 1️⃣ Validation schemas
const tutorSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  age: Joi.number().integer().min(18).optional(),
  dob: Joi.date().optional(),
  languages: Joi.array().items(Joi.string().hex().length(24)).optional(),
  phoneNumber: Joi.string().optional(),
  location: Joi.string().optional()
});

const counsellorSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  age: Joi.number().integer().min(18).optional(),
  dob: Joi.date().optional(),
  languages: Joi.array().items(Joi.string().hex().length(24)).optional(),
  country: Joi.string().required()
});

// 2️⃣ Register Tutor
async function registerTutor(req, res) {
  // validate body
  const { error, value } = tutorSchema.validate(req.body);
  if (error) return res.status(400).json({ success: false, error: error.details[0].message });

  try {
    // handle profilePicture
    if (req.files?.profilePicture) {
      const picUrl = await uploadWithCloudinary(req.files.profilePicture[0]);
      value.profilePicture = picUrl;
      fs.unlinkSync(req.files.profilePicture[0].path);
    }
    // handle CV
    if (req.files?.cv) {
      const cvUrl = await uploadWithCloudinary(req.files.cv[0]);
      value.cv = cvUrl;
      fs.unlinkSync(req.files.cv[0].path);
    }
    // handle validDocs[]
    if (req.files?.validDocs) {
      const docs = await Promise.all(
        req.files.validDocs.map(f => uploadWithCloudinary(f))
      );
      value.validDocs = docs;
      req.files.validDocs.forEach(f => fs.unlinkSync(f.path));
    }

    const tutor = await Tutor.create(value);
    return res.status(201).json({ success: true, data: tutor });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        error: 'Email already registered'
      });
    }
    console.error(err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
}

// 3️⃣ Register Counsellor
async function registerCounsellor(req, res) {
  const { error, value } = counsellorSchema.validate(req.body);
  if (error) return res.status(400).json({ success: false, error: error.details[0].message });

  try {
    // profilePicture
    if (req.files?.profilePicture) {
      const picUrl = await uploadWithCloudinary(req.files.profilePicture[0]);
      value.profilePicture = picUrl;
      fs.unlinkSync(req.files.profilePicture[0].path);
    }
    // validDocs[]
    if (req.files?.validDocs) {
      const docs = await Promise.all(
        req.files.validDocs.map(f => uploadWithCloudinary(f))
      );
      value.validDocs = docs;
      req.files.validDocs.forEach(f => fs.unlinkSync(f.path));
    }

    const counsellor = await Counsellor.create(value);
    return res.status(201).json({ success: true, data: counsellor });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        error: 'Email already registered'
      });
    }
    console.error(err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
}


/**
 * Fetch all staff (Tutors + Counsellors) without passwords
 */
async function getAllStaff(req, res) {
  try {
    const staff = await Employee
      .find({})
      .select('-password -__v')              // exclude password & __v
      .sort({ createdAt: -1 })               // newest first (optional)
      .lean();                               // return plain JS objects

    return res.json({ success: true, data: staff });
  } catch (err) {
    console.error('Fetch staff error:', err);
    return res
      .status(500)
      .json({ success: false, error: 'Unable to fetch staff.' });
  }
}

// Helper to delete old Cloudinary file if URL is known and public_id was saved (optional future extension)
async function updateEmployee(req, res) {
  const employeeId = req.params.id;

  if (!mongoose.Types.ObjectId.isValid(employeeId)) {
    return res.status(400).json({ success: false, error: 'Invalid employee ID' });
  }

  try {
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ success: false, error: 'Employee not found' });
    }

    const updates = req.body;

    // 🔒 Handle password update (if provided)
    if (updates.password) {
      updates.password = await argon2.hash(updates.password);
    }

    // 📤 New profile picture
    if (req.files?.profilePicture) {
      const profilePicUrl = await uploadWithCloudinary(req.files.profilePicture[0]);
      updates.profilePicture = profilePicUrl;

      fs.unlinkSync(req.files.profilePicture[0].path);
    }

    // 📤 New CV
    if (req.files?.cv) {
      const cvUrl = await uploadWithCloudinary(req.files.cv[0]);
      updates.cv = cvUrl;

      fs.unlinkSync(req.files.cv[0].path);
    }

    // 📤 New Valid Docs
    if (req.files?.validDocs) {
      const docUrls = await Promise.all(
        req.files.validDocs.map(file => uploadWithCloudinary(file))
      );
      updates.validDocs = docUrls;

      req.files.validDocs.forEach(file => fs.unlinkSync(file.path));
    }

    // 🔁 Perform update
    const updated = await Employee.findByIdAndUpdate(
      employeeId,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password -__v');

    return res.json({ success: true, data: updated });
  } catch (err) {
    console.error('Update employee error:', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
}


// Clone a language
async function cloneLanguage(req, res) {
  const { id } = req.params;
  const { name, code } = req.body;

  if (!name || !code) {
    return res.status(400).json({ success: false, message: 'New name and code are required to clone a language.' });
  }

  try {
    const original = await Language.findById(id);
    if (!original) {
      return res.status(404).json({ success: false, message: 'Original language not found.' });
    }

    const exists = await Language.findOne({ $or: [{ name }, { code }] });
    if (exists) {
      return res.status(409).json({ success: false, message: 'Name or code already exists.' });
    }

    const cloned = new Language({
      name,
      code: code.toUpperCase(),
      flag: original.flag,
      description: original.description,
      direction: original.direction,
      levels: [...original.levels],
      enrolledStudents: [],
      isActive: original.isActive
    });

    await cloned.save();
    return res.status(201).json({ success: true, message: 'Language cloned successfully.', data: cloned });
  } catch (err) {
    console.error('Clone language error:', err);
    return res.status(500).json({ success: false, message: 'Failed to clone language.', error: err.message });
  }
}

// Get summary of a language
async function getLanguageSummary(req, res) {
  try {
    const language = await Language.findById(req.params.id)
      .populate('levels', 'name code')
      .populate('enrolledStudents', '_id'); // Just count them

    if (!language) {
      return res.status(404).json({ success: false, message: 'Language not found.' });
    }

    return res.status(200).json({
      success: true,
      data: {
        id: language._id,
        name: language.name,
        code: language.code,
        direction: language.direction,
        description: language.description,
        isActive: language.isActive,
        levelsCount: language.levels.length,
        studentsEnrolled: language.enrolledStudents.length,
        createdAt: language.createdAt,
        updatedAt: language.updatedAt
      }
    });
  } catch (err) {
    console.error('Get language summary error:', err);
    return res.status(500).json({ success: false, message: 'Failed to get summary.', error: err.message });
  }
}


module.exports = {
  registerTutor,
  registerCounsellor,
  getAllStaff,
  updateEmployee,
  cloneLanguage,
  getLanguageSummary
};
