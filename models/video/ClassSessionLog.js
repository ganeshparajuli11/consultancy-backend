const mongoose = require('mongoose');
const { Schema } = mongoose;

const ClassSessionLogSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  role: {
    type: String,
    enum: ['student', 'tutor'],
    required: true
  },

  section: {
    type: Schema.Types.ObjectId,
    ref: 'Section',
    required: true
  },

  recording: {
    type: Schema.Types.ObjectId,
    ref: 'Recording',
    default: null
  },

  classDate: {
    type: Date,
    required: true
  },

  // Detailed join/leave tracking
  joinLogs: [{
    joinedAt: { type: Date },
    leftAt:   { type: Date }
  }],

  // Summary metrics (optional)
  totalDuration: { type: Number, default: 0 }, // in seconds
  wasPresent:    { type: Boolean, default: false },
  wasLate:       { type: Boolean, default: false },
  disconnectedCount: { type: Number, default: 0 },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('ClassSessionLog', ClassSessionLogSchema);
