// models/CourseProgress.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const CourseProgressSchema = new Schema({
  enrollment:   { type: Schema.Types.ObjectId, ref: 'Enrollment', required: true },
  module:       { type: Schema.Types.ObjectId, ref: 'Module',     required: true },
  status:       { type: String, enum: ['NotStarted','InProgress','Completed'], default: 'NotStarted' },
  startedAt:    { type: Date },
  completedAt:  { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('CourseProgress', CourseProgressSchema);
