// index.js
require('dotenv').config(); 
const listEndpoints = require('express-list-endpoints');
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const swaggerUi = require('swagger-ui-express');
const swaggerJsDoc = require('swagger-jsdoc');

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
const employeAuth = require('./routes/admin-head/employeeRoute');
const classRoutes = require('./routes/classRoute');
const userProfileRoutes = require('./routes/profile/profileRoute');
const notice = require('./routes/notice/noticeRoute');
const pricingPlan= require('./routes/billsAndPayment/pricingPlanRoute');
const pagesRoutes = require('./routes/pages/pagesRoute');
const formRoutes = require('./routes/pages/formRoutes');
const uploadRoutes = require('./routes/upload/uploadRoute');

// Initialize app
const app = express();

// Get environment variables
const { MONGO_URI, PORT = 5000 } = process.env;

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

// Trust proxy for production
app.set('trust proxy', 1);

// Security middleware
app.use(helmet);

// CORS configuration
app.use(cors({
  origin: [
    'http://localhost:5173', // Frontend dev server
    'http://localhost:5174', // Admin dev server
    'http://localhost:3000', // Alternative ports
    'http://localhost:3001',
    'https://admin.langzy.co',
    'https://langzy.co'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// Rate limiting
app.use(rateLimiter);

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

// Logging middleware
app.use(requestLogger);

// Basic health check route
app.get('/', (req, res) => {
  res.json({
    message: '🚀 API is live — MongoDB is connected!',
    timestamp: new Date().toISOString(),
    status: 'healthy'
  });
});

// API Routes
app.use('/auth', authRoutes);
app.use('/api/languages', languagesRouter);
app.use('/api/levels', levelsRouter);
app.use('/auth', loginRouter);
app.use('/api', landingRoutes);
app.use('/api/call', videoCallRouter);
app.use('/api/section', sectionRoutes);
app.use('/api/jitsi', jitsiRoutes);
app.use('/auth', employeAuth);
app.use('/api/classes', classRoutes);
app.use('/api/profile', userProfileRoutes);
app.use('/api/notices', notice);
app.use('/api/pricing', pricingPlan);
app.use('/api/pages', pagesRoutes);
app.use('/api/forms', formRoutes);
app.use('/api/upload', uploadRoutes);

// Swagger documentation
const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: { 
      title: 'Langzy API', 
      version: '1.0.0',
      description: 'API for Langzy Consultancy Management System'
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: 'Development server'
      }
    ]
  },
  apis: ['./routes/**/*.js']
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));


// ✅ valid wildcard (slash + anything)
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    availableRoutes: '/api-docs'
  });
});


app.use(errorLogger);
app.use(errorHandler);

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log(`📚 API Documentation available at http://localhost:${PORT}/api-docs`);
  console.log('📋 Available endpoints:');
  console.table(listEndpoints(app));
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  mongoose.connection.close(() => {
    console.log('MongoDB connection closed.');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  mongoose.connection.close(() => {
    console.log('MongoDB connection closed.');
    process.exit(0);
  });
});
