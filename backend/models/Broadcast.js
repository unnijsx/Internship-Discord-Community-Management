
const mongoose = require('mongoose');

const BroadcastSchema = new mongoose.Schema({
    title: { type: String, required: true },
    message: { type: String, required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    targetRoles: [{ type: String }], // 'All', 'Student', or specific Role IDs
    sentToDiscord: { type: Boolean, default: false },
    discordMessageId: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Broadcast', BroadcastSchema);
