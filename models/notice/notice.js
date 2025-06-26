const mongoose = require('mongoose');
const { Schema } = mongoose;

// Sub-schema for read receipts
const ReadReceiptSchema = new Schema({
  user:   { type: Schema.Types.ObjectId, ref: 'User', required: true },
  readAt: { type: Date, default: Date.now }
}, { _id: false });

// Main Notice schema
const NoticeSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true
  },
  // Whether to send an email to recipients
  sendEmail: {
    type: Boolean,
    default: false
  },
  // Target by role
  targetRoles: [{
    type: String,
    enum: ['student','tutor','counsellor','admin'],
    default: []
  }],
  // Target specific users
  targetUsers: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
    posterUrl:   { type: String },
  // Broadcast to everyone
  allUsers: {
    type: Boolean,
    default: false
  },
  // Who created/scheduled this notice
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  // Optional schedule in the future
  scheduledAt: {
    type: Date
  },
  // When it was actually sent
  sentAt: {
    type: Date
  },
  // Track which users have read
  readReceipts: [ReadReceiptSchema]
}, {
  timestamps: true
});

// Index for efficient lookups
NoticeSchema.index({ allUsers: 1 });
NoticeSchema.index({ targetRoles: 1 });
NoticeSchema.index({ targetUsers: 1 });

module.exports = mongoose.model('Notice', NoticeSchema);
