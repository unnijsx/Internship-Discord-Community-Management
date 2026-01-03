
const Target = require('../models/Target');
const User = require('../models/User');

// Create a new target (Division Lead -> Associate)
exports.createTarget = async (req, res) => {
    try {
        const { title, assignedTo, type, startDate, endDate, metrics } = req.body;

        const target = new Target({
            title,
            assignedTo,
            assignedBy: req.user._id,
            type,
            startDate,
            endDate,
            metrics // Array of { name, targetValue, unit }
        });

        await target.save();
        res.status(201).json(target);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// Get targets for specific user (My Targets)
exports.getMyTargets = async (req, res) => {
    try {
        // If query param 'userId' is present AND user is admin/manager, fetch for that user
        // Else fetch for self
        let userId = req.user._id;
        const isManager = req.user.isSuperAdmin || req.user.roles.some(r => r.name === 'MANAGER' || r.name.includes('LEAD'));

        if (req.query.userId && isManager) {
            userId = req.query.userId;
        }

        const targets = await Target.find({ assignedTo: userId })
            .populate('assignedBy', 'username')
            .populate('assignedTo', 'username')
            .sort({ createdAt: -1 });

        res.json(targets);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get targets created BY the logged in user (For Leads to track what they assigned)
exports.getAssignedTargets = async (req, res) => {
    try {
        const targets = await Target.find({ assignedBy: req.user._id })
            .populate('assignedTo', 'username')
            .sort({ createdAt: -1 });
        res.json(targets);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Update progress (User updates their own numbers)
exports.updateProgress = async (req, res) => {
    try {
        const { targetId } = req.params;
        const { metrics } = req.body; // Array of { _id, currentValue } to update

        const target = await Target.findById(targetId);
        if (!target) return res.status(404).json({ message: 'Target not found' });

        // Update specific metrics
        if (metrics && Array.isArray(metrics)) {
            metrics.forEach(update => {
                const metric = target.metrics.id(update._id);
                if (metric) {
                    metric.currentValue = update.currentValue;
                }
            });
        }

        // Auto-update status?
        const allCompleted = target.metrics.every(m => m.currentValue >= m.targetValue);
        if (allCompleted) target.status = 'Completed';

        await target.save();
        res.json(target);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};
