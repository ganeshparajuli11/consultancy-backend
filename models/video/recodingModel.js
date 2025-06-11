const mongoose = require('mongoose');
const { Schema } = mongoose;

const StudentNoteSchema = new Schema({
  student: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  section: {
    type: Schema.Types.ObjectId,
    ref: 'Section',
    required: true
  },

  // Link to the recording if the class was recorded (optional)
  recording: {
    type: Schema.Types.ObjectId,
    ref: 'Recording',
    default: null
  },

  // Exact date and time of the class session (always required)
  classDate: {
    type: Date,
    required: true
  },

  // Student's note content
  content: {
    type: String,
    required: true
  },

  // Optional title (e.g., "Grammar Tip" or "Speaking Practice")
  title: {
    type: String
  },

  // Timestamp within the recording (optional, in seconds)
  timestampInRecording: {
    type: Number,
    default: null // null means it's just a regular class note
  },

  // Flags whether this note is tied to a video moment or general class
  isRecordingBased: {
    type: Boolean,
    default: false
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('StudentNote', StudentNoteSchema);
