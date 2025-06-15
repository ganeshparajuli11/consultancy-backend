const Joi = require('joi');
const fs  = require('fs');
const { Tutor, Counsellor } = require('../../models/employeeModel');
const uploadWithCloudinary   = require('../../utils/cloudinaryUploader');
const { Employee } = require('../../models/employeeModel');
// 1️⃣ Validation schemas
const tutorSchema = Joi.object({
  name:       Joi.string().required(),
  email:      Joi.string().email().required(),
  password:   Joi.string().min(6).required(),
  age:        Joi.number().integer().min(18).optional(),
  dob:        Joi.date().optional(),
  languages:  Joi.array().items(Joi.string().hex().length(24)).optional(),
  phoneNumber: Joi.string().optional(),
  location:    Joi.string().optional()
});

const counsellorSchema = Joi.object({
  name:      Joi.string().required(),
  email:     Joi.string().email().required(),
  password:  Joi.string().min(6).required(),
  age:       Joi.number().integer().min(18).optional(),
  dob:       Joi.date().optional(),
  languages: Joi.array().items(Joi.string().hex().length(24)).optional(),
  country:   Joi.string().required()
});

// 2️⃣ Register Tutor
async function registerTutor(req, res) {
  // validate body
  const { error, value } = tutorSchema.validate(req.body);
  if (error) return res.status(400).json({ success:false, error:error.details[0].message });

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
    return res.status(201).json({ success:true, data: tutor });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        success:false,
        error: 'Email already registered'
      });
    }
    console.error(err);
    return res.status(500).json({ success:false, error: 'Server error' });
  }
}

// 3️⃣ Register Counsellor
async function registerCounsellor(req, res) {
  const { error, value } = counsellorSchema.validate(req.body);
  if (error) return res.status(400).json({ success:false, error:error.details[0].message });

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
    return res.status(201).json({ success:true, data: counsellor });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        success:false,
        error: 'Email already registered'
      });
    }
    console.error(err);
    return res.status(500).json({ success:false, error: 'Server error' });
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

module.exports = {
  registerTutor,
  registerCounsellor,
  getAllStaff
};
