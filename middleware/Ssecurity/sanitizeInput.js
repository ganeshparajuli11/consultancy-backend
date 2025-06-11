// security/sanitizeInput.js
const mongoSanitize = require('express-mongo-sanitize');

const sanitizeInput = mongoSanitize({
  replaceWith: '_',
});

module.exports = sanitizeInput;
