// models/Resource.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const ResourceSchema = new Schema({
  title:      { type: String, required: true, trim: true },
  type:       { type: String, enum: ['pdf','video','link'], required: true },
  url:        { type: String, required: true },
  lesson:     { type: Schema.Types.ObjectId, ref: 'Lesson', required: true },
  uploadedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  uploadedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Resource', ResourceSchema);
