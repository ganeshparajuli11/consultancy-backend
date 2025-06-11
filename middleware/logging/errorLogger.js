const fs = require('fs');
const path = require('path');

const errorLogger = (err, req, res, next) => {
  const logPath = path.join(__dirname, '../../logs/error.log');

  const errorDetails = `
[${new Date().toISOString()}]
${req.method} ${req.originalUrl}
Status: ${res.statusCode}
Message: ${err.message}
Stack: ${err.stack}

`;

  fs.appendFile(logPath, errorDetails, (writeErr) => {
    if (writeErr) console.error("Error writing to log file", writeErr);
  });

  console.error("Logged error:", err);
  next(err); // Pass to errorHandler
};

module.exports = errorLogger;
