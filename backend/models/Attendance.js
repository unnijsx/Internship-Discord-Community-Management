
const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    clockInTime: Date,
    clockOutTime: Date,
    durationMinutes: Number,
    status: {
        type: String,
        enum: ['Present', 'Absent', 'Half-Day'],
        default: 'Present'
    },
    method: {
        type: String,
        enum: ['Discord', 'QR', 'Manual'],
        required: true
    },
    breaks: [{
        startTime: Date,
        endTime: Date,
        reason: String
    }],
    totalBreakMinutes: {
        type: Number,
        default: 0
    },
    isBreakActive: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

// Compound index to ensure one record per user per day
AttendanceSchema.index({ user: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', AttendanceSchema);
