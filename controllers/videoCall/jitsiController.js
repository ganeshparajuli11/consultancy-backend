// controllers/jitsiController.js
const jwt = require('jsonwebtoken');

exports.getJitsiToken = (req, res) => {
  const { room } = req.body;
  const user = req.user; // already decoded by your auth middleware

  if (!room) {
    return res.status(400).json({ message: "Room name is required" });
  }

  const payload = {
    context: {
      user: {
        name: user.name,
        email: user.email || '',
        role: (user.role === 'tutor' || user.role === 'admin') ? 'moderator' : 'participant'
      }
    },
    aud: 'jitsi',
    iss: 'langzy',
    sub: 'langzy',
    room
  };
console.log('[JITSI DEBUG] App secret:', process.env.JITSI_APP_SECRET);

  const token = jwt.sign(payload, process.env.JITSI_APP_SECRET, { expiresIn: '2h' });

  res.status(200).json({ token });
};
