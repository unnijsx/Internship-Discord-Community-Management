
const StudentProfile = require('../models/StudentProfile');

const getProfile = async (req, res) => {
    try {
        const userId = req.params.userId || req.user._id;
        let student = await StudentProfile.findOne({ user: userId }).populate('user');

        if (!student) {
            // If requesting own profile and it doesn't exist, create default
            if (userId.toString() === req.user._id.toString()) {
                student = await StudentProfile.create({ user: userId, joinDate: Date.now() });
                student = await student.populate('user');
            } else {
                return res.status(404).json({ message: 'Profile not found' });
            }
        }
        res.json(student);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const updateProfile = async (req, res) => {
    try {
        const student = await StudentProfile.findOneAndUpdate(
            { user: req.params.userId },
            req.body,
            { new: true, upsert: true } // Create if not exists
        );
        res.json(student);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

const User = require('../models/User');
const Role = require('../models/Role');

const getAllStudents = async (req, res) => {
    try {
        // Auto-heal: Ensure all users with STUDENT roles have a profile
        // 1. Find Student-like roles
        const studentRoles = await Role.find({
            $or: [{ name: 'STUDENT' }, { name: 'Student' }, { name: { $regex: /INTERN/i } }]
        });
        const roleIds = studentRoles.map(r => r._id);

        // 2. Find Users with these roles
        const studentUsers = await User.find({ roles: { $in: roleIds } });

        // 3. Upsert profiles for them
        for (const user of studentUsers) {
            await StudentProfile.findOneAndUpdate(
                { user: user._id },
                {
                    $setOnInsert: {
                        joinDate: user.createdAt,
                        course: 'N/A' // Placeholder
                    }
                },
                { upsert: true, new: true }
            );
        }

        const students = await StudentProfile.find().populate('user');
        res.json(students);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const addMark = async (req, res) => {
    const { subject, score, date } = req.body;
    try {
        const student = await StudentProfile.findById(req.params.id);
        if (!student) return res.status(404).json({ message: 'Student not found' });

        student.marks.push({ subject, score, date: date || Date.now() });
        await student.save();
        res.json(student);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

const Attendance = require('../models/Attendance');
const Task = require('../models/Task');
const Material = require('../models/Material');

const getStudentStats = async (req, res) => {
    try {
        const userId = req.user._id;

        // Attendance
        // Simple logic: Count days present vs total days (mock total or use system start?)
        // For now: Just count sessions
        const attendanceCount = await Attendance.countDocuments({ user: userId });

        // Tasks
        const pendingTasks = await Task.countDocuments({
            assignedTo: userId,
            status: { $ne: 'Completed' }
        });

        // Materials (Mock: Total materials available)
        // If 'visibleToRoles' logic is complex, just returning total for now
        const materialsCount = await Material.countDocuments({});

        res.json({
            attendance: attendanceCount > 0 ? 88 : 0, // Mock percentage for demo if no total days logic
            attendanceSessions: attendanceCount,
            pendingTasks,
            materials: materialsCount
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = { getProfile, updateProfile, getAllStudents, addMark, getStudentStats };
