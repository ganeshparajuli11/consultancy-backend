// controllers/notice/noticeController.js
const fs = require('fs');
const Joi = require('joi');
const Notice = require('../../models/notice/notice');
const User = require('../../models/userModel');
const { Tutor, Counsellor } = require('../../models/employeeModel');
const { sendAnnouncementEmail } = require('../../services/emailService');
const uploadWithCloudinary = require('../../utils/cloudinaryUploader');


// === 1️⃣ Validation Schema ===
const noticeSchema = Joi.object({
  title: Joi.string().required(),
  message: Joi.string().required(),
  sendEmail: Joi.boolean().default(false),
  posterUrl: Joi.string().uri().optional(),
  targetRoles: Joi.alternatives().try(
    Joi.string().valid('student', 'tutor', 'counsellor', 'admin'),
    Joi.array().items(Joi.string().valid('student', 'tutor', 'counsellor', 'admin'))
  ).optional(),
  targetUsers: Joi.alternatives().try(
    Joi.string().hex().length(24),
    Joi.array().items(Joi.string().hex().length(24))
  )
    .empty('')        // treat empty string as “not provided”
    .default([]),     // default to empty array
  allUsers: Joi.boolean().default(false),
  scheduledAt: Joi.date().optional()
});

// Fetch recipients from User, Tutor, and Counsellor collections
async function getRecipients({ allUsers, targetRoles, targetUsers }) {
  let recipients = [];

  if (allUsers) {
    // broadcast to everyone
    const users = await User.find({}, 'email').lean();
    const tutors = await Tutor.find({}, 'email').lean();
    const counsellors = await Counsellor.find({}, 'email').lean();
    recipients = [...users, ...tutors, ...counsellors];
  } else {
    // filter by roles
    if (targetRoles && targetRoles.length) {
      const roles = Array.isArray(targetRoles) ? targetRoles : [targetRoles];
      for (const role of roles) {
        if (role === 'student' || role === 'admin') {
          recipients.push(...await User.find({ role }, 'email').lean());
        } else if (role === 'tutor') {
          recipients.push(...await Tutor.find({}, 'email').lean());
        } else if (role === 'counsellor') {
          recipients.push(...await Counsellor.find({}, 'email').lean());
        }
      }
    }
    // filter by specific user IDs
    if (targetUsers && targetUsers.length) {
      recipients.push(
        ...await User.find({ _id: { $in: targetUsers } }, 'email').lean(),
        ...await Tutor.find({ _id: { $in: targetUsers } }, 'email').lean(),
        ...await Counsellor.find({ _id: { $in: targetUsers } }, 'email').lean()
      );
    }
  }

  // dedupe by email
  const map = new Map();
  for (const r of recipients) map.set(r.email, r);
  return Array.from(map.values());
}

// Dispatch announcement emails
async function dispatchEmails(notice) {
  const recipients = await getRecipients(notice);
  await Promise.all(recipients.map(r =>
    sendAnnouncementEmail(
      r.email,
      notice.title,
      notice.message,
      { posterUrl: notice.posterUrl }
    ).catch(err => console.error(`Email to ${r.email} failed:`, err))
  ));
}


// === 4️⃣ Create Notice endpoint ===
// POST /notices
async function createNotice(req, res) {
  // validate & fill defaults
  const { error, value } = noticeSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: error.details[0].message }
    });
  }

  try {
    // pull values
    const { title, message, sendEmail, allUsers, scheduledAt } = value;
    const targetRoles = value.targetRoles
      ? Array.isArray(value.targetRoles)
        ? value.targetRoles
        : [value.targetRoles]
      : [];
    const targetUsers = Array.isArray(value.targetUsers)
      ? value.targetUsers
      : (value.targetUsers ? [value.targetUsers] : []);

    // build notice data
    const data = {
      title,
      message,
      sendEmail,
      allUsers,
      scheduledAt,
      targetRoles,
      targetUsers,
      createdBy: req.user.id
    };

    // handle poster upload (optional)
    if (req.file) {
      data.posterUrl = await uploadWithCloudinary(req.file, 'langzy/posters');
      fs.unlinkSync(req.file.path);
    }
    console.log('📦 req.file =', req.file);  // <— should log the Multer file object
    console.log('📦 req.body =', req.body);
    // save
    const notice = new Notice(data);
    await notice.save();

    // immediate send if requested and due
    if (notice.sendEmail) {
      const now = new Date();
      if (!notice.scheduledAt || notice.scheduledAt <= now) {
        await dispatchEmails(notice);
        notice.sentAt = now;
        await notice.save();
      }
    }

    return res.status(201).json({ success: true, data: notice });
  } catch (err) {
    console.error('createNotice error:', err);
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_SERVER_ERROR', message: 'Unable to create notice.' }
    });
  }
}


// Retrieve notices for current user
// GET /notices
async function getNotices(req, res) {
  try {
    const now = new Date();
    const filter = {
      $or: [
        { allUsers: true },
        { targetRoles: req.user.role },
        { targetUsers: req.user.id }
      ],
      $and: [
        { $or: [{ scheduledAt: { $exists: false } }, { scheduledAt: { $lte: now } }] }
      ]
    };

    const notices = await Notice.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ success: true, data: notices });
  } catch (err) {
    console.error('getNotices error:', err);
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_SERVER_ERROR', message: 'Unable to fetch notices.' }
    });
  }
}

// Mark a notice as read
// POST /notices/:id/read
async function markAsRead(req, res) {
  try {
    const notice = await Notice.findById(req.params.id);
    if (!notice) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Notice not found.' } });
    }

    if (!notice.readReceipts.some(r => r.user.toString() === req.user.id)) {
      notice.readReceipts.push({ user: req.user.id });
      await notice.save();
    }

    return res.json({ success: true });
  } catch (err) {
    console.error('markAsRead error:', err);
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_SERVER_ERROR', message: 'Unable to mark as read.' }
    });
  }
}

module.exports = {
  createNotice,
  getNotices,
  markAsRead
};
