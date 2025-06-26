// models/Lesson.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const LessonSchema = new Schema({
  title:        { type: String, required: true, trim: true },
  contentType:  { type: String, enum: ['video','text','quiz'], required: true },
  contentUrl:   { type: String },
  content:      { type: Schema.Types.Mixed },
  module:       { type: Schema.Types.ObjectId, ref: 'Module', required: true },
  order:        { type: Number, default: 0 },
  isActive:     { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Lesson', LessonSchema);