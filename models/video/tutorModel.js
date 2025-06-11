const mongoose = require('mongoose');
const { Schema } = mongoose;

const TutorSchema = new Schema({
  // Link to main User account
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },

  // Teaching qualifications
  languages: [{
    type: Schema.Types.ObjectId,
    ref: 'Language'
  }],
  levels: [{
    type: Schema.Types.ObjectId,
    ref: 'Level'
  }],

  // Assigned sections
  sections: [{
    type: Schema.Types.ObjectId,
    ref: 'Section'
  }],

  // Tutor profile
  bio: { type: String },
  profileImage: { type: String },

  // Weekly availability with multiple time slots per day
  availability: [{
    day: { 
      type: String, 
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'], 
      required: true 
    },
    slots: [{
      startTime: { type: String, required: true }, // e.g., "10:00"
      endTime: { type: String, required: true }     // e.g., "11:30"
    }]
  }],

  // Dynamic classes (manual or instant sessions)
  customClasses: [{
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    date: { type: Date, required: true },
    time: { type: String }, // Optional for flexible times
    notes: { type: String }
  }],

  // Future extensibility
  ratings: [{
    student: { type: Schema.Types.ObjectId, ref: 'User' },
    score: { type: Number, min: 1, max: 5 },
    comment: { type: String },
    createdAt: { type: Date, default: Date.now }
  }],
  isActive: { type: Boolean, default: true }

}, {
  timestamps: true
});

module.exports = mongoose.model('Tutor', TutorSchema);
