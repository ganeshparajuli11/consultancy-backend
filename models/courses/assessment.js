// models/Assignment.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

// Sub-document for submissions
const SubmissionSchema = new Schema({
  student:      { type: Schema.Types.ObjectId, ref: 'User', required: true },
  submittedAt:  { type: Date, default: Date.now },
  fileUrl:      { type: String },                    // for attachments
  content:      { type: String },                    // free-text answer
  grade:        { type: Number, min: 0, max: 100 },
  feedback:     { type: String },
  gradedBy:     { type: Schema.Types.ObjectId, ref: 'User' }
}, { _id: false, timestamps: true });

const AssignmentSchema = new Schema({
  title:          { type: String, required: true, trim: true },
  description:    { type: String },
  course:         { type: Schema.Types.ObjectId, ref: 'Course' },
  module:         { type: Schema.Types.ObjectId, ref: 'Module' },
  dueDate:        { type: Date },
  instructions:   { type: String },
  questions:      [{ type: Schema.Types.ObjectId, ref: 'Question' }], // optional curated questions
  submissions:    [SubmissionSchema]
}, { timestamps: true });

module.exports = mongoose.model('Assignment', AssignmentSchema);
