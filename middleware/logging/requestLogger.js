const morgan = require('morgan');

// Logs in 'combined' format: IP, method, status, response time, etc.
const requestLogger = morgan('combined');

module.exports = requestLogger;
