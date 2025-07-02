const mongoose = require('mongoose');

const studentApplicationSchema = new mongoose.Schema({
  applicationForm: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ApplicationForm',
    required: true
  },
  studentInfo: {
    fullName: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    phoneNumber: {
      type: String,
      required: true,
      trim: true
    },
    dateOfBirth: Date,
    address: {
      street: String,
      city: String,
      state: String,
      country: String,
      zipCode: String
    },
    emergencyContact: {
      name: String,
      relationship: String,
      phone: String,
      email: String
    }
  },
  academicInfo: {
    education: [{
      level: {
        type: String,
        enum: ['high-school', 'bachelor', 'master', 'phd', 'diploma', 'certificate']
      },
      institution: String,
      fieldOfStudy: String,
      graduationYear: Number,
      grade: String
    }],
    englishProficiency: {
      level: {
        type: String,
        enum: ['beginner', 'elementary', 'intermediate', 'upper-intermediate', 'advanced', 'native']
      },
      testScores: [{
        testName: {
          type: String,
          enum: ['IELTS', 'TOEFL', 'PTE', 'DUOLINGO', 'OTHER']
        },
        score: String,
        testDate: Date
      }]
    }
  },
  coursePreferences: {
    interestedCourses: [String],
    preferredSchedule: {
      type: String,
      enum: ['morning', 'afternoon', 'evening', 'weekend', 'flexible']
    },
    learningGoals: String,
    previousLanguageLearning: String
  },
  documents: [{
    name: String,
    type: {
      type: String,
      enum: ['transcript', 'certificate', 'id-document', 'photo', 'test-score', 'other']
    },
    url: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  formData: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  status: {
    type: String,
    enum: ['pending', 'under-review', 'approved', 'rejected', 'waitlisted', 'cancelled'],
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
  reviewNotes: [{
    note: String,
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    addedAt: {
      type: Date,
      default: Date.now
    },
    isInternal: {
      type: Boolean,
      default: true
    }
  }],
  statusHistory: [{
    previousStatus: String,
    newStatus: String,
    reason: String,
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    changedAt: {
      type: Date,
      default: Date.now
    }
  }],
  communication: {
    emailsSent: [{
      type: {
        type: String,
        enum: ['welcome', 'status-update', 'approval', 'rejection', 'reminder', 'custom']
      },
      subject: String,
      sentAt: {
        type: Date,
        default: Date.now
      },
      sentBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    }],
    lastContactDate: Date
  },
  submissionSource: {
    type: String,
    enum: ['website', 'admin-panel', 'mobile-app', 'agent'],
    default: 'website'
  },
  ipAddress: String,
  userAgent: String,
  tags: [String],
  isArchived: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
studentApplicationSchema.index({ 'studentInfo.email': 1 });
studentApplicationSchema.index({ status: 1, priority: 1 });
studentApplicationSchema.index({ applicationForm: 1, status: 1 });
studentApplicationSchema.index({ assignedTo: 1 });
studentApplicationSchema.index({ createdAt: -1 });
studentApplicationSchema.index({ 'studentInfo.fullName': 'text', 'studentInfo.email': 'text' });

// Virtual for student's full contact
studentApplicationSchema.virtual('fullContact').get(function() {
  return `${this.studentInfo.fullName} (${this.studentInfo.email})`;
});

// Method to add status history
studentApplicationSchema.methods.updateStatus = function(newStatus, reason, changedBy) {
  this.statusHistory.push({
    previousStatus: this.status,
    newStatus: newStatus,
    reason: reason,
    changedBy: changedBy
  });
  this.status = newStatus;
  return this.save();
};

// Method to add review note
studentApplicationSchema.methods.addNote = function(note, addedBy, isInternal = true) {
  this.reviewNotes.push({
    note: note,
    addedBy: addedBy,
    isInternal: isInternal
  });
  return this.save();
};

// Static method to get applications by status
studentApplicationSchema.statics.getByStatus = function(status) {
  return this.find({ status: status })
    .populate('applicationForm', 'name category')
    .populate('assignedTo', 'name email')
    .sort({ createdAt: -1 });
};

const StudentApplication = mongoose.model('StudentApplication', studentApplicationSchema);

module.exports = StudentApplication; 