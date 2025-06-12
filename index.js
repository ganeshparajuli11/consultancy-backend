// index.js
require('dotenv').config(); 

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');

// Security middleware
const helmet = require('./middleware/Ssecurity/helmet');
const rateLimiter = require('./middleware/Ssecurity/rateLimiter');


// Logging middleware
const requestLogger = require('./middleware/logging/requestLogger');
const errorLogger = require('./middleware/logging/errorLogger');
const errorHandler = require('./middleware/logging/errorHandler');

// Routes
const authRoutes = require('./routes/registerRoute');
const languagesRouter = require('./routes/languageRoute');
const levelsRouter = require('./routes/levelRoute');
const loginRouter = require('./routes/loginRoute')
const landingRoutes = require('./routes/ui/landingRoutes');
const videoCallRouter = require('./routes/video/videoCallRoute');
const sectionRoutes = require('./routes/sectionRoute');
const jitsiRoutes = require('./routes/video/jitsiRoutes');

// Initialize app
const app = express();
app.use(cookieParser());
app.set('trust proxy', 1);

// connect to Atlas
const { MONGO_URI, PORT } = process.env;

// MongoDB connection
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ Connected to MongoDB'))
.catch(err => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

// Global middleware (security first)
app.use(helmet);         

app.use(cors({
  origin: ['https://admin.langzy.co', 'http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],  // include OPTIONS for preflight
  allowedHeaders: ['Content-Type', 'Authorization']      // explicitly allow headers used
}));

        
app.use(rateLimiter);      
app.use(cookieParser());   

// Body parser
app.use(express.json());   // JSON body parser

// Logging
app.use(requestLogger);    // Log all incoming requests

// Routes

mongoose
  .connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('✅ Connected to MongoDB Atlas'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

// your routes
app.get('/', (req, res) => res.send('🚀 API is live — MongoDB is connected!'));
app.use('/auth', authRoutes);
app.use('/api/languages', languagesRouter);
app.use('/api/levels', levelsRouter);
app.use('/auth', loginRouter);
app.use('/api', landingRoutes);
app.use('/api/call', videoCallRouter);
app.use('/api/section', sectionRoutes);
app.use('/api/jitsi', jitsiRoutes);






// Error logging and handling (last)
app.use(errorLogger);      // Log any unhandled errors
app.use(errorHandler);     // Send proper error responses

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
