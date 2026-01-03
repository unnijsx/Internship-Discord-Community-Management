
const Leave = require('../models/Leave');
const { client } = require('../bot/index'); // Optional: Notify Discord

exports.applyLeave = async (req, res) => {
    try {
        const { type, startDate, endDate, reason } = req.body;
        const leave = new Leave({
            student: req.user._id,
            type,
            startDate,
            endDate,
            reason
        });
        await leave.save();
        res.status(201).json(leave);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.getLeaves = async (req, res) => {
    try {
        // If admin (or canManageUsers), see all. Else see own.
        // Simplified check:
        const isAdmin = req.user.isSuperAdmin || req.user.roles.some(r => r.permissions?.canManageUsers);

        const filter = isAdmin ? {} : { student: req.user._id };
        const leaves = await Leave.find(filter)
            .populate('student', 'username')
            .populate('approvedBy', 'username')
            .sort({ createdAt: -1 });

        res.json(leaves);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.updateLeaveStatus = async (req, res) => {
    try {
        const { status, adminComments } = req.body;
        const leave = await Leave.findByIdAndUpdate(
            req.params.id,
            { status, adminComments, approvedBy: req.user._id },
            { new: true }
        );
        res.json(leave);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};
