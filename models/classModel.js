const mongoose = require('mongoose');
const { Schema } = mongoose;

const ClassSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  language: {
    type: Schema.Types.ObjectId,
    ref: 'Language',
    required: true
  },
  level: {
    type: Schema.Types.ObjectId,
    ref: 'Level',
    required: true
  },
  section: {
    type: Schema.Types.ObjectId,
    ref: 'Section'
  },
  tutor: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  schedule: [{
    day: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      required: true
    },
    startTime: { type: String, required: true },  // HH:mm format
    endTime:   { type: String, required: true }
  }],
  capacity: {
    type: Number,
    default: 20,
    min: 1
  },
  enrolledStudents: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  isCancelled: {
    type: Boolean,
    default: false
  },
  cancellationReason: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Class', ClassSchema);
