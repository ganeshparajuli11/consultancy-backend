// models/Exercise.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const ExerciseSchema = new Schema({
  title:         { type: String, required: true, trim: true },
  description:   { type: String },
  type:          { type: String, enum: ['Quiz','Exam','Practice'], required: true },
  questions:     [{ type: Schema.Types.ObjectId, ref: 'Question' }],
  settings: {
    shuffleQuestions:  { type: Boolean, default: false },
    timeLimitMinutes:  { type: Number },
    maxAttempts:       { type: Number, default: 1 },
    availableFrom:     { type: Date },
    dueBy:             { type: Date }
  },
  createdBy:     { type: Schema.Types.ObjectId, ref: 'User' },
  course:        { type: Schema.Types.ObjectId, ref: 'Course' },
  module:        { type: Schema.Types.ObjectId, ref: 'Module' },
}, { timestamps: true });

module.exports = mongoose.model('Exercise', ExerciseSchema);