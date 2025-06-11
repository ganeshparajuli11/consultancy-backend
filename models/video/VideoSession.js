const mongoose = require('mongoose');
const { Schema } = mongoose;

const VideoSessionSchema = new Schema({
    section: { type: Schema.Types.ObjectId, ref: 'Section', required: true },
    roomName: { type: String, required: true, unique: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now },
    isLive: {
        type: Boolean,
        default: false
    }

});

module.exports = mongoose.model('VideoSession', VideoSessionSchema);
