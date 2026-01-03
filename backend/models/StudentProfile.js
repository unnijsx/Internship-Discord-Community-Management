
const mongoose = require('mongoose');

const StudentProfileSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    batch: String,
    course: String,
    joinDate: Date,
    marks: [{
        subject: String,
        score: Number,
        date: Date
    }],
    projectSubmissions: [{
        title: String,
        repoLink: String,
        status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
        feedback: String
    }],
    totalAttendanceHours: {
        type: Number,
        default: 0
    },
    assignedSalesPerson: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, { timestamps: true });

module.exports = mongoose.model('StudentProfile', StudentProfileSchema);
