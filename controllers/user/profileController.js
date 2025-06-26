// controllers/user/profileController.js
require('dotenv').config();
const argon2 = require('argon2');
const Joi = require('joi');
const fs = require('fs');
const path = require('path');
const User = require('../../models/userModel');
const uploadWithCloudinary = require('../../utils/cloudinaryUploader');

// === Validation Schemas ===
const passwordSchema = Joi.object({
  oldPassword: Joi.string().min(8).required(),
  newPassword: Joi.string().min(8).required()
});

const usernameSchema = Joi.object({
  userName: Joi.string().alphanum().min(3).max(30).required()
});

const profileSchema = Joi.object({
  name:     Joi.string().min(2).max(50).optional(),
  language: Joi.string().hex().length(24).optional(),
  level:    Joi.string().hex().length(24).optional()
});

// Helper: Suggest alternative usernames
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

// Email change schemas
const emailRequestSchema = Joi.object({
  newEmail: Joi.string().email().required()
});

const emailVerifySchema = Joi.object({
  newEmail: Joi.string().email().required(),
  otp:      Joi.string().length(6).required()
});


// === Controller Methods ===

// Change Password
// PUT /user/profile/password
async function updatePassword(req, res) {
  const { error, value } = passwordSchema.validate(req.body);
  if (error) return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: error.details[0].message }});

  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, error: { code: 'USER_NOT_FOUND' }});

    const valid = await argon2.verify(user.password, value.oldPassword);
    if (!valid) return res.status(401).json({ success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Old password is incorrect.' }});

    user.password = await argon2.hash(value.newPassword);
    await user.save();

    res.json({ success: true, message: 'Password updated successfully.' });
  } catch (err) {
    console.error('updatePassword error:', err);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_SERVER_ERROR', message: 'Unable to update password.' }});
  }
}

// Change Username
// PUT /user/profile/username
async function updateUsername(req, res) {
  const { error, value } = usernameSchema.validate(req.body);
  if (error) return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: error.details[0].message }});

  try {
    const exists = await User.exists({ userName: value.userName });
    if (exists) {
      const suggestions = await suggestUsernames(value.userName);
      return res.status(409).json({ success: false, error: { code: 'USERNAME_TAKEN', message: 'Username unavailable.', suggestions }});
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { userName: value.userName },
      { new: true, runValidators: true, context: 'query' }
    );
    if (!user) return res.status(404).json({ success: false, error: { code: 'USER_NOT_FOUND' }});

    res.json({ success: true, message: 'Username updated.', user: { id: user._id, userName: user.userName }});
  } catch (err) {
    console.error('updateUsername error:', err);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_SERVER_ERROR', message: 'Unable to update username.' }});
  }
}

// Update Profile (name, language, level, profileImage)
// PUT /user/profile
async function updateProfile(req, res) {
  const { error, value } = profileSchema.validate(req.body);
  if (error) return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: error.details[0].message }});

  try {
    const update = { ...value };

    // Handle profile image upload if provided
    if (req.file) {
      const imageUrl = await uploadWithCloudinary(req.file.path);
      update.profileImage = imageUrl;
      fs.unlinkSync(req.file.path);
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      update,
      { new: true, runValidators: true, context: 'query' }
    ).select('-password');

    if (!user) return res.status(404).json({ success: false, error: { code: 'USER_NOT_FOUND' }});

    res.json({ success: true, message: 'Profile updated.', user });
  } catch (err) {
    console.error('updateProfile error:', err);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_SERVER_ERROR', message: 'Unable to update profile.' }});
  }
}

// Request Email Change
// POST /user/profile/email/request
async function requestEmailChange(req, res) {
  const { error, value } = emailRequestSchema.validate(req.body);
  if (error) return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: error.details[0].message }});

  try {
    const { newEmail } = value;
    if (await User.exists({ email: newEmail })) {
      return res.status(409).json({ success: false, error: { code: 'EMAIL_TAKEN', message: 'This email is already in use.' }});
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, error: { code: 'USER_NOT_FOUND' }});

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.pendingEmail = newEmail;
    user.emailChangeOTP = otp;
    user.emailChangeOTPExpires = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    // Send OTP to new email
    await sendVerificationEmail(newEmail, otp);
    res.json({ success: true, message: 'OTP sent to the new email address.' });
  } catch (err) {
    console.error('requestEmailChange error:', err);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_SERVER_ERROR', message: 'Unable to send OTP.' }});
  }
}
// Verify Email Change
// POST /user/profile/email/verify
async function verifyEmailChange(req, res) {
  const { error, value } = emailVerifySchema.validate(req.body);
  if (error) return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: error.details[0].message }});

  try {
    const { newEmail, otp } = value;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, error: { code: 'USER_NOT_FOUND' }});

    if (user.pendingEmail !== newEmail) {
      return res.status(400).json({ success: false, error: { code: 'EMAIL_MISMATCH', message: 'Pending email does not match.' }});
    }

    if (!user.emailChangeOTP || user.emailChangeOTP !== otp) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_OTP', message: 'OTP is incorrect.' }});
    }

    if (user.emailChangeOTPExpires < new Date()) {
      return res.status(400).json({ success: false, error: { code: 'OTP_EXPIRED', message: 'OTP has expired.' }});
    }

    user.email = newEmail;
    user.pendingEmail = undefined;
    user.emailChangeOTP = undefined;
    user.emailChangeOTPExpires = undefined;
    await user.save();

    res.json({ success: true, message: 'Email updated successfully.', user: { id: user._id, email: user.email }});
  } catch (err) {
    console.error('verifyEmailChange error:', err);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_SERVER_ERROR', message: 'Unable to verify email change.' }});
  }
}

module.exports = {
  updatePassword,
  updateUsername,
  updateProfile,
  requestEmailChange,
  verifyEmailChange
};
