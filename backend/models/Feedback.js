
const mongoose = require('mongoose');

const FeedbackSchema = new mongoose.Schema({
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    type: { type: String, enum: ['Weekly', 'Monthly', 'Project', 'General'], default: 'General' },
    rating: { type: Number, min: 1, max: 10 }, // Optional numeric rating
    date: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Feedback', FeedbackSchema);
