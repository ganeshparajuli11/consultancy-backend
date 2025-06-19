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
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date,
    default: null
  },
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  auditLogs: [{
    action: { type: String, required: true },            
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    timestamp: { type: Date, default: Date.now },
    message: { type: String, default: '' }
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Level', LevelSchema);
