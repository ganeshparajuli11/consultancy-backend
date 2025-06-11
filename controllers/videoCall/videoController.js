const { v4: uuidv4 } = require('uuid');
const Section = require('../../models/sectionModel');
const VideoSession = require('../../models/video/VideoSession'); // new schema if needed

// Create a new video room (called by tutor/admin)
exports.createVideoRoom = async (req, res) => {
  try {
    const { sectionId } = req.body;
    const userId = req.user.id;

    // Validate section exists
    const section = await Section.findById(sectionId);
    if (!section) {
      return res.status(404).json({ message: 'Section not found' });
    }

    // Generate a unique Jitsi room name
    const roomName = `LANGZY-${section.code}-${uuidv4().slice(0, 6)}`;

    // Optional: Save this to DB
    const videoSession = await VideoSession.create({
      section: sectionId,
      roomName,
      createdBy: userId,
      createdAt: new Date()
    });

    res.status(201).json({ message: 'Video room created', roomName });
  } catch (err) {
    console.error('Video room error:', err);
    res.status(500).json({ message: 'Failed to create video room' });
  }
};

// Get video session by section ID
exports.getSessionBySectionId = async (req, res) => {
  try {
    const sectionId = req.params.sectionId;

    const session = await VideoSession.findOne({ section: sectionId });

    if (!session) {
      return res.status(404).json({ message: 'No video session found for this section' });
    }

    res.status(200).json({ message: 'Session found', data: session });
  } catch (error) {
    console.error('Fetch video session error:', error);
    res.status(500).json({ message: 'Error fetching session', error: error.message });
  }
};

exports.startSession = async (req, res) => {
  const { sectionId } = req.body;
  const userRole = req.user.role;

  if (userRole !== 'tutor' && userRole !== 'admin') {
    return res.status(403).json({ message: 'Only tutor or admin can start session' });
  }

  const session = await VideoSession.findOneAndUpdate(
    { section: sectionId },
    { isLive: true },
    { new: true }
  );

  if (!session) {
    return res.status(404).json({ message: 'Session not found' });
  }

  res.status(200).json({ message: 'Session started', data: session });
};