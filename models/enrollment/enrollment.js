// models/Enrollment.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const EnrollmentSchema = new Schema({
  student:      { type: Schema.Types.ObjectId, ref: 'User',    required: true },
  course:       { type: Schema.Types.ObjectId, ref: 'Course',  required: true },
  enrolledAt:   { type: Date, default: Date.now },
  status:       { type: String, enum: ['active','completed','dropped'], default: 'active' },
  progress:     { type: Number, min: 0, max: 100, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Enrollment', EnrollmentSchema);