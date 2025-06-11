const mongoose = require('mongoose');

// Sub-schema: In-app notifications
const NotificationSchema = new mongoose.Schema({
  type:      { type: String, required: true },
  message:   { type: String, required: true },
  link:      { type: String },
  isRead:    { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
}, { _id: false });

// Sub-schema: Login records for auditing
const LoginRecordSchema = new mongoose.Schema({
  ip:        { type: String },
  userAgent: { type: String },
  at:        { type: Date, default: Date.now }
}, { _id: false });

// Main User schema
const UserSchema = new mongoose.Schema({
  // Identity
  name:            { type: String, required: true, trim: true },
  userName:        { type: String, required: true, unique: true, lowercase: true, trim: true },
  email:           { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:        { type: String, required: true },

  // Demographics
  age:             { type: Number, min: 0 },
  dob:             { type: Date },
  gender:          { type: String, enum: ['Male','Female','Other'] },

  // Curriculum references
  language:        { type: mongoose.Schema.Types.ObjectId, ref: 'Language' },
  section:         { type: mongoose.Schema.Types.ObjectId, ref: 'Section' },
  level:           { type: mongoose.Schema.Types.ObjectId, ref: 'Level' },

  // Roles & permissions
  role:            { type: String, enum: ['student','tutor','admin','counseller'], default: 'student' },
  permissions:     [{ type: String }],  // e.g. ['create-course','grade-assignment']

  // Account status
  isBlocked:       { type: Boolean, default: false },
  blockedUntil:    { type: Date },
  blockReason:     { type: String },
  isSuspended:     { type: Boolean, default: false },
  suspendedFrom:   { type: Date },
  suspendedUntil:  { type: Date },
  suspendReason:   { type: String },

  // Payment integrations
  stripeCustomerId: { type: String },
  khaltiCustomerId: { type: String },
  subscription: {
    plan:          { type: String, enum: ['free','basic','pro','enterprise'], default: 'free' },
    status:        { type: String, enum: ['active','cancelled','past_due','unpaid'], default: 'active' },
    startedAt:     { type: Date },
    expiresAt:     { type: Date }
  },
  paymentHistory:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'PaymentHistory' }],

  // Verification & security
  emailVerified:           { type: Boolean, default: false },
  emailVerifyToken:        { type: String },
  emailVerifyTokenExpires: { type: Date },
  resetPasswordToken:      { type: String },
  resetPasswordExpires:    { type: Date },
  twoFactorEnabled:        { type: Boolean, default: false },
  twoFactorSecret:         { type: String },

  // Activity & auditing
  loginHistory:   [LoginRecordSchema],
  lastLogin:      { type: Date },
  failedLogins:   { type: Number, default: 0 },
  lockUntil:      { type: Date },

  // Profile & preferences
  profileImage:   { type: String },
  notifications:  [NotificationSchema],
  settings: {
    emailNotifications: { type: Boolean, default: true },
    darkMode:           { type: Boolean, default: false }
  }
}, {
  timestamps: true  
});

// Indexes for quick lookups
UserSchema.index({ email: 1, userName: 1 });

module.exports = mongoose.model('User', UserSchema);
