const mongoose = require('mongoose');
const { Schema } = mongoose;


const SectionSchema = new Schema({
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
  tutor: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  schedule: [{
    day: { type: String, enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] },
    startTime: { type: String },
    endTime: { type: String }
  }],
  capacity: {
    type: Number,
    min: 1,
    default: 20
  },
  capacityAlert: { type: Boolean, default: false },
  isArchived: { type: Boolean, default: false },
  enrolled: {
    type: Number,
    min: 0,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  changeHistory: [{
    action: { type: String, enum: ['created', 'updated', 'enrolled', 'removed', 'archived'], required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    message: { type: String },
    timestamp: { type: Date, default: Date.now }
  }],
  enrolledStudents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]

}, {
  timestamps: true
});

module.exports = mongoose.model('Section', SectionSchema);
