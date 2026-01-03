
const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: String,
    startTime: {
        type: Date,
        required: true
    },
    endTime: Date,
    trainer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    batch: String, // e.g., "Batch 2025"
    meetingLink: String,
    discordEventId: String, // To sync with Discord Native Events
    status: {
        type: String,
        enum: ['Scheduled', 'Completed', 'Cancelled'],
        default: 'Scheduled'
    }
}, { timestamps: true });

module.exports = mongoose.model('Event', EventSchema);
