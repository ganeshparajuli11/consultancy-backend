const mongoose = require('mongoose');
const { Schema } = mongoose;

const StudentTrackingSchema = new Schema({
  // Reference to the student user
  student:     { type: Schema.Types.ObjectId, ref: 'User',     required: true },
  class:       { type: Schema.Types.ObjectId, ref: 'Class',    required: true },
  language:    { type: Schema.Types.ObjectId, ref: 'Language', required: true },

  // Attendance log (per session)
  attendance: [{
    date:          { type: Date,   required: true },
    status:        { type: String, enum: ['Present','Absent','Late','Excused'], required: true },
    reason:        { type: String, default: '' },
    recordedBy:    { type: Schema.Types.ObjectId, ref: 'User' } // admin or teacher
  }],

  // Session logs (login/disconnect tracking)
  sessionLogs: [{
    date:            { type: Date, required: true },
    loginTime:       { type: Date },
    disconnectTime:  { type: Date },
    durationMinutes: { type: Number }, // auto-computed if needed
    deviceInfo:      { type: String, default: '' }
  }],

  // Flexible mock test results
  mockTests: [{
    title:         { type: String, required: true }, // e.g., IELTS Practice 1
    attemptNumber: { type: Number, default: 1 },
    takenOn:       { type: Date, default: Date.now },
    scores:        { type: Schema.Types.Mixed, default: {} }, // e.g., { Listening: 6.5, Speaking: 7 }
    totalScore:    { type: Number },                           // optional for aggregation
    evaluator:     { type: Schema.Types.ObjectId, ref: 'User' },
    remarks:       { type: String, default: '' }
  }],

  // Assignment submissions
  assignments: [{
    assignment:   { type: Schema.Types.ObjectId, ref: 'Assignment', required: true },
    submittedAt:  { type: Date, required: true },
    fileUrl:      { type: String },
    grade:        { type: Number, min: 0, max: 100 },
    feedback:     { type: String },
    gradedBy:     { type: Schema.Types.ObjectId, ref: 'User' }
  }],

  // Course/module progress tracking
  courseProgress: [{
    module:        { type: Schema.Types.ObjectId, ref: 'Module' },
    status:        { type: String, enum: ['NotStarted','InProgress','Completed'], default: 'NotStarted' },
    startedAt:     { type: Date },
    completedAt:   { type: Date }
  }],

  // Resource access logs
  resourceLogs: [{
    resource:     { type: Schema.Types.ObjectId, ref: 'Resource' },
    accessedAt:   { type: Date, default: Date.now },
    durationSec:  { type: Number }  // time spent on that resource
  }],

  // Forum and chat participation counts
  participation: {
    forumPosts:   { type: Number, default: 0 },
    chatMessages: { type: Number, default: 0 }
  },

  // Engagement score (weighted metric)
  engagementScore: { type: Number, default: 0 },

  // Quiz results
  quizzes: [{
    quiz:         { type: Schema.Types.ObjectId, ref: 'Quiz' },
    takenOn:      { type: Date, default: Date.now },
    score:        { type: Number },
    maxScore:     { type: Number },
    evaluator:    { type: Schema.Types.ObjectId, ref: 'User' }
  }],

  // Performance trends and averages
  averageScore:   { type: Number, default: 0 },
  scoreTrend: [{ date: Date, score: Number }],

  // Contact and support ticket logs
  contacts: [{
    with:         { type: Schema.Types.ObjectId, ref: 'User' }, // admin, tutor, support
    date:         { type: Date, default: Date.now },
    medium:       { type: String, enum: ['email','phone','chat','meeting'] },
    summary:      { type: String }
  }],

  tickets: [{
    issue:        { type: String },
    openedAt:     { type: Date, default: Date.now },
    resolvedAt:   { type: Date },
    status:       { type: String, enum: ['open','in_progress','closed'], default: 'open' },
    handledBy:    { type: Schema.Types.ObjectId, ref: 'User' }
  }],

  // Warnings and disciplinary actions
  warnings: [{
    date:         { type: Date, default: Date.now },
    reason:       { type: String },
    issuedBy:     { type: Schema.Types.ObjectId, ref: 'User' }
  }],
  disciplineCount: { type: Number, default: 0 },
  riskScore:       { type: Number, default: 0 },

  // Billing and certificates
  invoices: [{
    invoiceId:    { type: String },
    amount:       { type: Number },
    issuedAt:     { type: Date },
    paidAt:       { type: Date },
    status:       { type: String, enum: ['pending','paid','overdue'] }
  }],

  certificates: [{
    title:        { type: String },
    issuedAt:     { type: Date },
    certificateUrl:{ type: String }
  }],

  // Custom tags for quick filtering
  tags:          [{ type: String }],

  // Flags for filtering and summary
  isConsistent:         { type: Boolean, default: false },
  isStruggling:         { type: Boolean, default: false },
  attendancePercentage: { type: Number,  default: 0 },

  // Soft delete / archiving
  isArchived:           { type: Boolean, default: false }

}, {
  timestamps: true
});

module.exports = mongoose.model('StudentTracking', StudentTrackingSchema);
