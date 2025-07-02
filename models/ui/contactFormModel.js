const mongoose = require('mongoose');

const contactFormSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  contactNumber: {
    type: String,
    required: true,
    trim: true
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'resolved', 'closed'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  adminNotes: [{
    note: {
      type: String,
      required: true
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  responseDate: {
    type: Date
  },
  resolvedDate: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for efficient querying
contactFormSchema.index({ status: 1, createdAt: -1 });
contactFormSchema.index({ email: 1 });

const ContactForm = mongoose.model('ContactForm', contactFormSchema);

module.exports = ContactForm; 