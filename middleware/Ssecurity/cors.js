const cors = require('cors');

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173', // for Vite
  'https://owner.merocourse.com',
  'https://admin.merocourse.com',
  'https://tutor.merocourse.com',
  'https://merocourse.com',
  'https://0de4-2405-acc0-1306-2dd3-31f4-4d3-67a1-e9d8.ngrok-free.app' // your Ngrok URL
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS blocked: ${origin}`));
    }
  },
  credentials: true, // Allow cookies
};

module.exports = cors(corsOptions);
