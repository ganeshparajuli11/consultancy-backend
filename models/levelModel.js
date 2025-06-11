const mongoose = require('mongoose');
const { Schema } = mongoose;

const LevelSchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true,
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
  order: {
    type: Number,
    required: true,
    default: 0
  },
  language: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Language',
    default: null // Will be set when explicitly linked
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Level', LevelSchema);
