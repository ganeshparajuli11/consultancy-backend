// models/Landing.js
const mongoose = require('mongoose');

const landingSchema = new mongoose.Schema({
  logo: {
    type: String, // URL of image OR text
  },
  logoType: {
    type: String, enum: ['image', 'text'], default: 'text'
  },
  textLogoColor: {
    type: String, default: '#000000'
  },
  textLogoGradient: {
    type: [String], 
    default: []
  },
  headline: {
    type: String, default: 'Welcome to Learnity'
  },
  subtext: {
    type: String, default: 'Start your global learning journey today.'
  },
  languageOptions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Language'
  }]
});

module.exports = mongoose.model('Landing', landingSchema);
