const mongoose = require('mongoose');

const fieldSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  label: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: [
      'text', 'email', 'tel', 'number', 'textarea', 'select', 
      'multiselect', 'checkbox', 'radio', 'date', 'file', 
      'url', 'password', 'color', 'range', 'time',
      // New field types for consultancy forms
      'rating', 'address', 'language-level', 'language-selection', 
      'education-level', 'experience'
    ]
  },
  required: {
    type: Boolean,
    default: false
  },
  options: [{
    value: String,
    label: String
  }],
  placeholder: String,
  helpText: String,
  validation: {
    min: {
      type: Number,
      default: null
    },
    max: {
      type: Number,
      default: null
    },
    pattern: {
      type: String,
      default: null
    },
    minLength: {
      type: Number,
      default: null
    },
    maxLength: {
      type: Number,
      default: null
    }
  },
  order: {
    type: Number,
    default: 0
  }
});

const applicationFormSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  slug: {
    type: String,
    unique: true,
    required: true
  },
  fields: [fieldSchema],
  isActive: {
    type: Boolean,
    default: true
  },
  category: {
    type: String,
    enum: ['language-course', 'test-preparation', 'consultation', 'general'],
    default: 'general'
  },
  language: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Language',
    required: false // Optional - some forms might be general, not language-specific
  },
  emailNotifications: {
    enabled: {
      type: Boolean,
      default: true
    },
    adminEmails: [String],
    autoReplyTemplate: {
      subject: String,
      message: String
    }
  },
  settings: {
    allowMultipleSubmissions: {
      type: Boolean,
      default: false
    },
    maxSubmissions: {
      type: Number,
      default: 1
    },
    maxCapacity: {
      type: Number,
      default: null // null = unlimited
    },
    submissionDeadline: Date,
    requiresApproval: {
      type: Boolean,
      default: true
    }
  },
  submissions: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Generate slug from name
applicationFormSchema.pre('save', async function(next) {
  try {
    if (this.isModified('name') || this.isNew) {
      let baseSlug = this.name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim('-');
      
      // Ensure we have a valid base slug
      if (!baseSlug) {
        baseSlug = 'form';
      }
      
      let slug = baseSlug;
      let counter = 1;
      
      // Check for existing slugs and make unique
      while (await this.constructor.findOne({ slug: slug, _id: { $ne: this._id } })) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }
      
      this.slug = slug;
      console.log('Generated slug:', slug);
    }
    next();
  } catch (error) {
    console.error('Error generating slug:', error);
    next(error);
  }
});

// Index for efficient querying
applicationFormSchema.index({ slug: 1 });
applicationFormSchema.index({ isActive: 1, category: 1 });
applicationFormSchema.index({ language: 1, isActive: 1 });
applicationFormSchema.index({ language: 1, category: 1 });
applicationFormSchema.index({ createdBy: 1 });

// Static methods for language-specific queries
applicationFormSchema.statics.getByLanguage = function(languageId, options = {}) {
  const filter = { 
    language: languageId,
    isActive: options.activeOnly !== false ? true : undefined
  };
  
  // Remove undefined values
  Object.keys(filter).forEach(key => filter[key] === undefined && delete filter[key]);
  
  return this.find(filter)
    .populate('language', 'name code flag')
    .populate('createdBy', 'name email')
    .sort({ createdAt: -1 });
};

applicationFormSchema.statics.getGeneralForms = function(options = {}) {
  const filter = { 
    language: null,
    isActive: options.activeOnly !== false ? true : undefined
  };
  
  // Remove undefined values
  Object.keys(filter).forEach(key => filter[key] === undefined && delete filter[key]);
  
  return this.find(filter)
    .populate('createdBy', 'name email')
    .sort({ createdAt: -1 });
};

// Virtual to check if form is language-specific
applicationFormSchema.virtual('isLanguageSpecific').get(function() {
  return !!this.language;
});

// Virtual to get form type description
applicationFormSchema.virtual('formType').get(function() {
  if (this.language) {
    return 'Language-Specific';
  }
  return 'General';
});

const ApplicationForm = mongoose.model('ApplicationForm', applicationFormSchema);

module.exports = ApplicationForm; 