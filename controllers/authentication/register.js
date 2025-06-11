// controllers/authentication/register.js

require('dotenv').config();
const argon2 = require('argon2');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const User = require('../../models/userModel');
const { sendVerificationEmail } = require('../../services/emailService');

// === Validation Schema ===
const signupSchema = Joi.object({
  name:     Joi.string().min(2).max(50).required(),
  userName: Joi.string().alphanum().min(3).max(30).required(),
  email:    Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  language: Joi.string().hex().length(24).optional()
    .messages({ 'string.hex': 'Invalid language ID provided.' }),
  level:    Joi.string().hex().length(24).optional()
    .messages({ 'string.hex': 'Invalid level ID provided.' })
});

// === Helper: Username Suggestions ===
async function suggestUsernames(base, count = 5) {
  const pool = new Set();
  while (pool.size < count * 3) {
    pool.add(`${base}${Math.floor(100 + Math.random() * 900)}`);
  }
  const candidates = Array.from(pool);
  const taken = await User.find({ userName: { $in: candidates } }, 'userName');
  const takenSet = new Set(taken.map(u => u.userName));
  return candidates.filter(u => !takenSet.has(u)).slice(0, count);
}

// === Controller: Signup / Register ===
async function register(req, res) {
  // ensure req.body is object
  const payload = req.body || {};

  // 1️⃣ Validate input
  const { error, value } = signupSchema.validate(payload);
  if (error) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: error.details[0].message }
    });
  }

  // safe destructure
  const { name, userName, email, password, language, level } = value;

  try {
    // 2️⃣ Email uniqueness
    if (await User.exists({ email })) {
      return res.status(409).json({
        success: false,
        error: { code: 'EMAIL_TAKEN', field: 'email', message: 'This email is already registered.' }
      });
    }

    // 3️⃣ Username uniqueness + suggestions
    if (await User.exists({ userName })) {
      const suggestions = await suggestUsernames(userName);
      return res.status(409).json({
        success: false,
        error: {
          code: 'USERNAME_TAKEN',
          field: 'userName',
          message: 'Username is unavailable.',
          suggestions
        }
      });
    }

    // 4️⃣ Hash password
    const hashedPassword = await argon2.hash(password);

    // 5️⃣ Build user object
    const userData = { name, userName, email, password: hashedPassword, emailVerified: false };
    if (language) userData.language = language;
    if (level)    userData.level    = level;

    // 6️⃣ Create user
    const user = new User(userData);

    // 7️⃣ Generate email token
    const emailToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    user.emailVerifyToken = emailToken;
    user.emailVerifyTokenExpires = new Date(Date.now() + 24*3600*1000);
    await user.save();

    // 8️⃣ Send verification email
    await sendVerificationEmail(user.email, emailToken);

    // 9️⃣ Success
    return res.status(201).json({ success: true, message: 'Registration successful. Please check your email to verify your account.' });

  } catch (err) {
    console.error('Register error:', err);
    // 1️⃣ Mongoose validation errors
    if (err.name === 'ValidationError') {
      const details = Object.values(err.errors).map(e => ({ field: e.path, message: e.message }));
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'User data failed schema validation', details }
      });
    }
    // 2️⃣ Fallback
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_SERVER_ERROR', message: 'An unexpected error occurred.' } });
  }
}


// Helper (same as register controller)
async function suggestUsernames(base, count = 5) {
  const pool = new Set();
  while (pool.size < count * 3) {
    pool.add(`${base}${Math.floor(100 + Math.random() * 900)}`);
  }
  const candidates = Array.from(pool);
  const taken = await User.find({ userName: { $in: candidates } }, 'userName');
  const takenSet = new Set(taken.map(u => u.userName));
  return candidates.filter(u => !takenSet.has(u)).slice(0, count);
}

// GET /auth/check-username?userName=xyz
async function checkUsernameAvailability(req, res) {
  const { userName } = req.query;

  if (!userName || typeof userName !== 'string' || !/^[a-zA-Z0-9]{3,30}$/.test(userName)) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_USERNAME', message: 'Invalid username format.' } 
    });
  }

  const exists = await User.exists({ userName });
  if (exists) {
    const suggestions = await suggestUsernames(userName);
    return res.status(200).json({
      available: false,
      message: 'Username is unavailable.',
      suggestions
    });
  }

  return res.status(200).json({ available: true });
}



// admin
// ——— Admin Signup Schema ———
const adminSignupSchema = Joi.object({
  name:     Joi.string().min(2).max(50).required(),
  email:    Joi.string().email().required(),
  password: Joi.string().min(8).required()
});

async function adminSignupController(req, res) {
  // 1️⃣ Validate input
  const { error, value } = adminSignupSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      error: {
        code:    'VALIDATION_ERROR',
        message: error.details[0].message
      }
    });
  }
  const { name, email, password } = value;

  // 2️⃣ Check email uniqueness
  if (await User.exists({ email: email.toLowerCase().trim() })) {
    return res.status(409).json({
      success: false,
      error: {
        code:    'EMAIL_TAKEN',
        message: 'This email is already registered.'
      }
    });
  }

  // 3️⃣ Hash password
  const hashedPassword = await argon2.hash(password);

  // 4️⃣ Build new admin user, auto-generate userName
  const defaultUserName = `admin_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
  const admin = new User({
    name,
    userName:      defaultUserName,
    email:         email.toLowerCase().trim(),
    password:      hashedPassword,
    role:          'admin',
    emailVerified: true    // skip email verification
  });

  // 5️⃣ Save & handle Mongoose validation errors
  try {
    await admin.save();
  } catch (err) {
    if (err.name === 'ValidationError') {
      const details = Object.values(err.errors).map(e => ({
        field:   e.path,
        message: e.message
      }));
      return res.status(400).json({
        success: false,
        error: {
          code:    'VALIDATION_ERROR',
          message: 'Admin data failed schema validation.',
          details
        }
      });
    }
    // unexpected
    console.error(err);
    return res.status(500).json({
      success: false,
      error: {
        code:    'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred.'
      }
    });
  }

  // 6️⃣ (Optional) Issue JWT right away
  const payload = { id: admin._id, role: admin.role, email: admin.email };
  const token   = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '15m'
  });

  // 7️⃣ Send success response
  return res.status(201).json({
    success: true,
    message: 'Admin account created successfully.',
    token,
    user: {
      id:    admin._id,
      name:  admin.name,
      email: admin.email,
      role:  admin.role
    }
  });
}



module.exports = { register,checkUsernameAvailability,adminSignupController };
