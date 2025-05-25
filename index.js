// index.js
require('dotenv').config();              // Load .env into process.env

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// Pull in your env vars
const { MONGO_URI, PORT } = process.env;

// 1️⃣ Connect to MongoDB
mongoose
  .connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

// 2️⃣ Middleware
app.use(cors());           // Enable CORS (restrict origins in production)
app.use(express.json());   // Parse JSON bodies

// 3️⃣ Routes
app.get('/', (req, res) => {
  res.send('🚀 Consultancy API is live — MongoDB is connected!');
});

// 4️⃣ Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
