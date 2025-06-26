// models/Question.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const QuestionSchema = new Schema({
  type: { 
    type: String,
    enum: ['MCQ','TrueFalse','FillBlank','ShortAnswer','Essay','PictureResponse'],
    required: true
  },
  prompt:       { type: String, required: true },
  mediaUrl:     { type: String },                     // e.g., image for PictureResponse
  options: [{                                      // for MCQ
    label:      { type: String },
    value:      { type: String }
  }],
  answer:       { type: Schema.Types.Mixed, required: true }, // e.g., 'A', true/false, ['word1','word2'], free text
  explanation:  { type: String },                     // optional explanation or rationale
  tags:         [{ type: String }],                   // e.g., ['grammar','vocabulary']
  createdBy:    { type: Schema.Types.ObjectId, ref: 'User' },
  difficulty:   { type: String, enum: ['Easy','Medium','Hard'], default: 'Medium' }
}, { timestamps: true });

module.exports = mongoose.model('Question', QuestionSchema);