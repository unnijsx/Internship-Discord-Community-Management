
const Feedback = require('../models/Feedback');

exports.createFeedback = async (req, res) => {
    try {
        const { studentId, title, content, type, rating } = req.body;
        const feedback = new Feedback({
            student: studentId,
            author: req.user._id,
            title,
            content,
            type,
            rating
        });
        await feedback.save();
        res.status(201).json(feedback);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.getStudentFeedback = async (req, res) => {
    try {
        const studentId = req.params.studentId;
        // Access control: User must be the student OR have permission to view users
        if (req.user._id.toString() !== studentId && !req.user.isSuperAdmin && !req.user.roles.some(r => r.permissions?.canManageUsers)) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const feedbacks = await Feedback.find({ student: studentId })
            .populate('author', 'username')
            .sort({ date: -1 });
        res.json(feedbacks);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
