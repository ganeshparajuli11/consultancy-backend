// models/Employee.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * 1️⃣ Base Employee schema
 *    Holds all the common fields (name, email, password, age, dob, languages).
 *    Uses `role` discriminatorKey to branch into Tutor vs Counsellor.
 */
const employeeSchema = new Schema({
  name:       { type: String, required: true },
  email:      { type: String, required: true, unique: true },
  password:   { type: String, required: true },

  // Verification fields (added for your email‐verify logic)
  emailVerified:           { type: Boolean, default: false },
  emailVerifyToken:        { type: String },
  emailVerifyTokenExpires: { type: Date },

  age:        { type: Number },
  dob:        { type: Date },

  // Reference to the Language documents
  languages:  [{ type: Schema.Types.ObjectId, ref: 'Language' }],

  // Will hold the Cloudinary URL
  profilePicture: { type: String }
}, {
  discriminatorKey: 'role',
  timestamps: true
});

const Employee = mongoose.model('Employee', employeeSchema);


/**
 * 2️⃣ Tutor discriminator
 *    - phoneNumber
 *    - validDocs (array of Cloudinary URLs)
 *    - cv         (Cloudinary URL)
 *    - location
 *    - rating & review
 */
const tutorSchema = new Schema({
  phoneNumber: { type: String },
  validDocs:   [{ type: String }],   // store URL strings
  cv:          { type: String },     // store URL string
  location:    { type: String },
  rating:      { type: Number, min: 0, max: 5 },
  review:      { type: String }
});

const Tutor = Employee.discriminator('Tutor', tutorSchema);


/**
 * 3️⃣ Counsellor discriminator
 *    - country
 *    - validDocs (array of Cloudinary URLs)
 */
const counsellorSchema = new Schema({
  country:   { type: String },
  validDocs: [{ type: String }]      // store URL strings
});

const Counsellor = Employee.discriminator('Counsellor', counsellorSchema);


module.exports = {
  Employee,
  Tutor,
  Counsellor
};
