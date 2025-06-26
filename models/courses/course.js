// models/Course.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const CourseSchema = new Schema({
  title:        { type: String, required: true, trim: true },
  description:  { type: String, default: '' },
  thumbnailUrl: { type: String },
  language:     { type: Schema.Types.ObjectId, ref: 'Language', required: true },
  levels:       [{ type: Schema.Types.ObjectId, ref: 'Level' }],
  modules:      [{ type: Schema.Types.ObjectId, ref: 'Module' }],
  isActive:     { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Course', CourseSchema);