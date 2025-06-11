const rateLimit = require('express-rate-limit');

// Example: Apply to login, registration, or public API routes
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many requests. Please try again later.",
});

module.exports = limiter;
