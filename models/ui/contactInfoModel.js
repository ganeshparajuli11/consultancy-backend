const mongoose = require('mongoose');

const contactInfoSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    type: String,
    required: true,
    trim: true
  },
  workingHours: {
    type: String,
    default: 'Mon - Fri: 9:00 AM - 6:00 PM'
  },
  supportEmail: {
    type: String,
    trim: true,
    lowercase: true
  },
  emergencyContact: {
    type: String,
    trim: true
  },
  socialMedia: {
    facebook: {
      type: String,
      default: ''
    },
    instagram: {
      type: String,
      default: ''
    },
    linkedin: {
      type: String,
      default: ''
    },
    twitter: {
      type: String,
      default: ''
    },
    youtube: {
      type: String,
      default: ''
    }
  },
  companyInfo: {
    founded: {
      type: String,
      default: '2024'
    },
    mission: {
      type: String,
      default: 'To make language learning accessible, engaging, and effective for everyone, everywhere.'
    },
    vision: {
      type: String,
      default: 'To be the leading platform connecting language learners with expert tutors worldwide.'
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Ensure only one active contact info record exists
contactInfoSchema.index({ isActive: 1 }, { unique: true, partialFilterExpression: { isActive: true } });

const ContactInfo = mongoose.model('ContactInfo', contactInfoSchema);

module.exports = ContactInfo; 