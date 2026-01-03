const AuditLog = require('../models/AuditLog');

// Get Audit Logs with pagination and filtering
exports.getAuditLogs = async (req, res) => {
    try {
        const { page = 1, limit = 20, action, user } = req.query;
        const query = {};

        if (action) query.action = action;
        if (user) query.performedBy = user;

        const logs = await AuditLog.find(query)
            .sort({ timestamp: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .populate('performedBy', 'username email'); // Populate user details

        const count = await AuditLog.countDocuments(query);

        res.json({
            logs,
            totalPages: Math.ceil(count / limit),
            currentPage: page
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
