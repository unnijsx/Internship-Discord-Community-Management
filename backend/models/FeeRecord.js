
const mongoose = require('mongoose');

const FeeRecordSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'StudentProfile',
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    paymentDate: {
        type: Date,
        default: Date.now
    },
    type: {
        type: String,
        enum: ['Registration', 'Installment', 'Full', 'Fine'],
        required: true
    },
    collectedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    status: {
        type: String,
        enum: ['Pending', 'Completed', 'Failed'],
        default: 'Completed'
    },
    remarks: String
}, { timestamps: true });

module.exports = mongoose.model('FeeRecord', FeeRecordSchema);
