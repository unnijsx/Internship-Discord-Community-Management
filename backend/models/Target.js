
const mongoose = require('mongoose');

const MetricSchema = new mongoose.Schema({
    name: { type: String, required: true }, // e.g., "Revenue", "Students Placed"
    targetValue: { type: Number, required: true },
    currentValue: { type: Number, default: 0 },
    unit: { type: String, default: 'count' } // e.g., "USD", "count", "hours"
});

const TargetSchema = new mongoose.Schema({
    title: { type: String, required: true },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['Sales', 'Training', 'Placement', 'Recruitment', 'Other'], required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: { type: String, enum: ['Pending', 'In Progress', 'Completed', 'Failed'], default: 'In Progress' },
    metrics: [MetricSchema]
}, { timestamps: true });

module.exports = mongoose.model('Target', TargetSchema);
