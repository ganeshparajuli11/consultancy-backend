// models/Module.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const ModuleSchema = new Schema({
  title:       { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  order:       { type: Number, default: 0 },
  course:      { type: Schema.Types.ObjectId, ref: 'Course', required: true },
  lessons:     [{ type: Schema.Types.ObjectId, ref: 'Lesson' }],
  isActive:    { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Module', ModuleSchema);
