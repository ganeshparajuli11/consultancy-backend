const mongoose = require('mongoose');

// Question Schema - Flexible for different question types
const questionSchema = new mongoose.Schema({
  questionType: {
    type: String,
    enum: ['mcq', 'true_false', 'fill_blank', 'essay', 'speaking', 'listening', 'reading', 'writing', 'custom'],
    required: true
  },
  question: {
    type: String,
    required: true
  },
  options: [{
    text: String,
    isCorrect: Boolean,
    explanation: String
  }],
  correctAnswer: {
    type: mongoose.Schema.Types.Mixed, // Can be string, array, or object
    required: function() {
      return ['mcq', 'true_false', 'fill_blank'].includes(this.questionType);
    }
  },
  explanation: String,
  marks: {
    type: Number,
    default: 1
  },
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced', 'expert'],
    default: 'intermediate'
  },
  tags: [String],
  audioUrl: String, // For listening questions
  imageUrl: String, // For visual questions
  timeLimit: Number, // Time limit in seconds
  customFields: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  }
}, { timestamps: true });

// Assessment Schema
const assessmentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: String,
  type: {
    type: String,
    enum: ['quiz', 'test', 'exam', 'practice', 'mock_test'],
    default: 'quiz'
  },
  questions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question'
  }],
  totalMarks: {
    type: Number,
    default: 0
  },
  passingScore: {
    type: Number,
    default: 60
  },
  timeLimit: Number, // Total time in minutes
  instructions: String,
  isActive: {
    type: Boolean,
    default: true
  },
  customFields: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  }
}, { timestamps: true });

// Lesson Schema
const lessonSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: String,
  content: {
    type: String,
    required: true
  },
  videoUrl: String,
  audioUrl: String,
  attachments: [{
    name: String,
    url: String,
    type: String
  }],
  duration: Number, // Duration in minutes
  order: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  customFields: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  }
}, { timestamps: true });

// Module Schema
const moduleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: String,
  lessons: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lesson'
  }],
  assessments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assessment'
  }],
  order: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  customFields: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  }
}, { timestamps: true });

// Main Content Schema
const contentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: String,
  type: {
    type: String,
    enum: ['ielts', 'pte', 'german', 'english', 'spanish', 'french', 'custom'],
    required: true
  },
  category: {
    type: String,
    enum: ['language', 'exam_preparation', 'general_education', 'skill_development'],
    required: true
  },
  level: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Level',
    required: false // Can be null for general content
  },
  language: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Language',
    required: false // Can be null for non-language specific content
  },
  modules: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Module'
  }],
  assessments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assessment'
  }],
  thumbnail: String,
  isActive: {
    type: Boolean,
    default: true
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tags: [String],
  metadata: {
    totalLessons: {
      type: Number,
      default: 0
    },
    totalAssessments: {
      type: Number,
      default: 0
    },
    estimatedDuration: {
      type: Number,
      default: 0 // Total duration in minutes
    },
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'expert'],
      default: 'intermediate'
    }
  },
  customFields: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  // Content-specific schemas
  ieltsSchema: {
    band: {
      type: String,
      enum: ['4.0-5.0', '5.0-6.0', '6.0-7.0', '7.0-8.0', '8.0-9.0']
    },
    testType: {
      type: String,
      enum: ['academic', 'general_training']
    },
    skills: [{
      type: String,
      enum: ['listening', 'reading', 'writing', 'speaking']
    }]
  },
  pteSchema: {
    scoreRange: {
      type: String,
      enum: ['30-50', '50-65', '65-79', '79-90']
    },
    skills: [{
      type: String,
      enum: ['speaking', 'writing', 'reading', 'listening']
    }]
  },
  languageSchema: {
    proficiencyLevel: {
      type: String,
      enum: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
    },
    focusAreas: [{
      type: String,
      enum: ['grammar', 'vocabulary', 'pronunciation', 'conversation', 'writing', 'reading', 'listening']
    }]
  }
}, { timestamps: true });

// Create indexes for better performance
contentSchema.index({ type: 1, level: 1, language: 1 });
contentSchema.index({ category: 1, isActive: 1, isPublished: 1 });
contentSchema.index({ createdBy: 1 });
contentSchema.index({ tags: 1 });

// Pre-save middleware to update metadata
contentSchema.pre('save', async function(next) {
  if (this.isModified('modules') || this.isModified('assessments')) {
    // Calculate total lessons and assessments
    const Module = mongoose.model('Module');
    const Assessment = mongoose.model('Assessment');
    
    let totalLessons = 0;
    let totalAssessments = this.assessments.length;
    let estimatedDuration = 0;
    
    if (this.modules.length > 0) {
      const modules = await Module.find({ _id: { $in: this.modules } }).populate('lessons');
      modules.forEach(module => {
        totalLessons += module.lessons.length;
        module.lessons.forEach(lesson => {
          estimatedDuration += lesson.duration || 0;
        });
      });
    }
    
    this.metadata.totalLessons = totalLessons;
    this.metadata.totalAssessments = totalAssessments;
    this.metadata.estimatedDuration = estimatedDuration;
  }
  next();
});

// Create models
const Question = mongoose.model('Question', questionSchema);
const Assessment = mongoose.model('Assessment', assessmentSchema);
const Lesson = mongoose.model('Lesson', lessonSchema);
const Module = mongoose.model('Module', moduleSchema);
const Content = mongoose.model('Content', contentSchema);

module.exports = {
  Question,
  Assessment,
  Lesson,
  Module,
  Content
}; 