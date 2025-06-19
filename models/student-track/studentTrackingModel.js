const mongoose = require('mongoose');
const { Schema } = mongoose;

const StudentTrackingSchema = new Schema({
  student: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  class: {
    type: Schema.Types.ObjectId,
    ref: 'Class',
    required: true
  },
  language: {
    type: Schema.Types.ObjectId,
    ref: 'Language',
    required: true
  },

  // Attendance log (per session)
  attendance: [{
    date: { type: Date, required: true },
    status: { 
      type: String, 
      enum: ['Present', 'Absent', 'Late', 'Excused'], 
      required: true 
    },
    reason: { type: String, default: '' },
    recordedBy: { type: Schema.Types.ObjectId, ref: 'User' } // admin or teacher
  }],

  // Session logs (login/disconnect tracking)
  sessionLogs: [{
    date: { type: Date, required: true },
    loginTime: { type: Date },
    disconnectTime: { type: Date },
    durationMinutes: { type: Number }, // auto-computed if needed
    deviceInfo: { type: String, default: '' }
  }],

  // Flexible mock test results
  mockTests: [{
    title: { type: String, required: true }, // e.g., IELTS Practice 1
    attemptNumber: { type: Number, default: 1 },
    takenOn: { type: Date, default: Date.now },
    scores: { type: Schema.Types.Mixed, default: {} }, // e.g., { Listening: 6.5, Speaking: 7 }
    totalScore: { type: Number }, // optional for aggregation
    evaluator: { type: Schema.Types.ObjectId, ref: 'User' }, // teacher or auto
    remarks: { type: String, default: '' }
  }],

  // Feedback and notes
  adminNotes: [{
    note: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    addedBy: { type: Schema.Types.ObjectId, ref: 'User' }
  }],

  // Flags for fast filtering
  isConsistent: { type: Boolean, default: false },
  isStruggling: { type: Boolean, default: false },
  attendancePercentage: { type: Number, default: 0 },

  // Soft delete support
  isArchived: { type: Boolean, default: false }

}, {
  timestamps: true
});

module.exports = mongoose.model('StudentTracking', StudentTrackingSchema);
